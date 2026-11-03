import { and, desc, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { atomic, AtomicGuardError, guard } from '@/core/db/atomic';
import { aiTask } from '@/config/db/schema';
import { planConsume, planRevoke } from '@/modules/credits/service';

const SCENE = 'vikas_studio';
const ACTIVE = ['pending', 'processing'];
export type GenerationTask = typeof aiTask.$inferSelect;

export class GenerationTaskError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function parsed(value: string | null): Record<string, unknown> {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export async function findGeneration(
  id: string,
  userId: string
): Promise<GenerationTask | undefined> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, id),
        eq(aiTask.userId, userId),
        eq(aiTask.scene, SCENE),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);
  return task;
}

export async function listGenerations(
  userId: string
): Promise<GenerationTask[]> {
  return db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, userId),
        eq(aiTask.scene, SCENE),
        isNull(aiTask.deletedAt)
      )
    )
    .orderBy(desc(aiTask.createdAt))
    .limit(50);
}

function matchingTask(task: GenerationTask, fingerprint: string) {
  if (parsed(task.options).fingerprint !== fingerprint) {
    throw new GenerationTaskError(
      'This request was already used for a different generation. Start a new generation.',
      409
    );
  }
  return { task, created: false };
}

/** A unique task primary key claims submission and the debit in one D1 batch. */
export async function createGeneration(params: {
  id: string;
  userId: string;
  fingerprint: string;
  mediaType: 'image' | 'video';
  model: string;
  prompt: string;
  aspectRatio: string;
  credits: number;
}): Promise<{ task: GenerationTask; created: boolean }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await findGeneration(params.id, params.userId);
    if (existing) return matchingTask(existing, params.fingerprint);
    const plan = await planConsume({
      userId: params.userId,
      credits: params.credits,
      scene: SCENE,
      description: `AI ${params.mediaType} generation`,
      metadata: JSON.stringify({ taskId: params.id }),
    });
    if (!plan) {
      // A concurrent duplicate may have spent the last credits while we read.
      const concurrent = await findGeneration(params.id, params.userId);
      if (concurrent) return matchingTask(concurrent, params.fingerprint);
      throw new GenerationTaskError(
        'Not enough credits. Add credits before generating.',
        402
      );
    }
    const row: typeof aiTask.$inferInsert = {
      id: params.id,
      userId: params.userId,
      mediaType: params.mediaType,
      provider: 'fal',
      model: params.model,
      prompt: params.prompt,
      options: JSON.stringify({
        fingerprint: params.fingerprint,
        aspectRatio: params.aspectRatio,
      }),
      status: 'pending',
      scene: SCENE,
      costCredits: params.credits,
      creditId: plan.consumedCredit.id,
      taskInfo: JSON.stringify({ creditId: plan.consumedCredit.id }),
    };
    try {
      await atomic((q) => [q.insert(aiTask).values(row), ...plan.steps(q)]);
      const task = await findGeneration(params.id, params.userId);
      if (!task) throw new Error('Created generation missing');
      return { task, created: true };
    } catch (error) {
      const concurrent = await findGeneration(params.id, params.userId);
      if (concurrent) return matchingTask(concurrent, params.fingerprint);
      if (error instanceof AtomicGuardError) continue;
      throw error;
    }
  }
  throw new GenerationTaskError(
    'Credits changed while generating. Please try again.',
    402
  );
}

export async function acceptGeneration(
  task: GenerationTask,
  providerId: string
) {
  await db()
    .update(aiTask)
    .set({
      status: 'processing',
      taskId: providerId,
      taskInfo: JSON.stringify({
        ...parsed(task.taskInfo),
        creditId: task.creditId,
      }),
      taskResult: null,
    })
    .where(
      and(
        eq(aiTask.id, task.id),
        eq(aiTask.userId, task.userId),
        eq(aiTask.status, 'pending')
      )
    );
  return (await findGeneration(task.id, task.userId))!;
}

/** Never automatically resubmit a request with an unknown provider outcome. */
export async function markGenerationUncertain(task: GenerationTask) {
  await db()
    .update(aiTask)
    .set({
      status: 'processing',
      taskResult: JSON.stringify({
        error:
          'Submission status is uncertain. Please contact support before trying again.',
      }),
    })
    .where(
      and(
        eq(aiTask.id, task.id),
        eq(aiTask.userId, task.userId),
        eq(aiTask.status, 'pending'),
        isNull(aiTask.taskId)
      )
    );
  return (await findGeneration(task.id, task.userId))!;
}

export async function finishGeneration(
  task: GenerationTask,
  result:
    { status: 'success'; url: string } | { status: 'failed'; error: string }
) {
  const latest = await findGeneration(task.id, task.userId);
  if (!latest || !ACTIVE.includes(latest.status)) return latest || task;
  const revoke =
    result.status === 'failed' && latest.creditId
      ? await planRevoke(latest.creditId)
      : null;
  try {
    await atomic((q) => [
      guard({
        table: aiTask,
        column: 'userId',
        where: and(eq(aiTask.id, latest.id), eq(aiTask.userId, latest.userId)),
        require: inArray(aiTask.status, ACTIVE),
        message: 'Generation already settled',
      }),
      q
        .update(aiTask)
        .set({
          status: result.status,
          taskResult: JSON.stringify(
            result.status === 'success'
              ? { url: result.url }
              : { error: result.error }
          ),
        })
        .where(eq(aiTask.id, latest.id)),
      ...(revoke ? revoke.steps(q) : []),
    ]);
  } catch (error) {
    if (!(error instanceof AtomicGuardError)) throw error;
  }
  return (await findGeneration(latest.id, latest.userId))!;
}

export function generationResponse(task: GenerationTask) {
  const result = parsed(task.taskResult);
  const staleSubmission =
    !task.taskId &&
    ACTIVE.includes(task.status) &&
    Date.now() - new Date(task.createdAt).getTime() > 120_000;
  return {
    id: task.id,
    status: task.status,
    mediaType: task.mediaType,
    prompt: task.prompt,
    ...(typeof result.url === 'string' && task.status === 'success'
      ? { url: result.url }
      : {}),
    ...(typeof result.error === 'string'
      ? { error: result.error }
      : staleSubmission
        ? {
            error:
              'Submission status is uncertain. Please contact support before trying again.',
          }
        : {}),
    createdAt: new Date(task.createdAt).toISOString(),
  };
}
