import { validateGenerationImage } from '@/lib/generation-input';

import {
  AIMediaType,
  AITaskStatus,
  type AIGenerateParams,
  type AIProvider,
  type AITaskResult,
} from './types';

type Phase = 'upload' | 'submit' | 'query';
export class EvoLinkRequestError extends Error {
  constructor(
    public status: number,
    public phase: Phase
  ) {
    super(`EvoLink ${phase} request failed (HTTP ${status}).`);
  }
}

export function validEvoLinkConfig(config: Record<string, string>) {
  try {
    const url = new URL(
      config.evolink_base_url?.trim() || 'https://api.evolink.ai'
    );
    return (
      Boolean(config.evolink_api_key?.trim()) &&
      !/[\r\n]/.test(config.evolink_api_key) &&
      url.origin === 'https://api.evolink.ai' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      ['', '/v1'].includes(url.pathname.replace(/\/+$/, ''))
    );
  } catch {
    return false;
  }
}

/** Keys and uploads only travel to the official, fixed EvoLink hosts. */
export class EvoLinkProvider implements AIProvider {
  readonly name = 'evolink';
  constructor(public configs: { apiKey: string; timeoutMs?: number }) {}

  private async request(
    url: string,
    phase: Phase,
    body?: BodyInit
  ): Promise<any> {
    try {
      const response = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: {
          Authorization: `Bearer ${this.configs.apiKey.trim()}`,
          Accept: 'application/json',
          ...(typeof body === 'string'
            ? { 'Content-Type': 'application/json' }
            : {}),
        },
        body,
        redirect: 'error',
        signal: AbortSignal.timeout(this.configs.timeoutMs ?? 30_000),
      });
      if (!response.ok) throw new EvoLinkRequestError(response.status, phase);
      return await response.json();
    } catch (error) {
      if (error instanceof EvoLinkRequestError) throw error;
      // Raw network/provider errors can contain credentials or image data.
      throw new EvoLinkRequestError(0, phase);
    }
  }

  private async upload(image: string): Promise<string> {
    try {
      validateGenerationImage(image);
      const [header, data] = image.split(',');
      const mime = header.slice(5).split(';')[0];
      const form = new FormData();
      form.set(
        'file',
        new Blob([Buffer.from(data, 'base64')], { type: mime }),
        `reference.${mime.split('/')[1]}`
      );
      const result = await this.request(
        'https://files-api.evolink.ai/api/v1/files/upload/stream',
        'upload',
        form
      );
      const url = new URL(result.data?.file_url || '');
      if (
        result.success !== true ||
        url.origin !== 'https://files.evolink.ai' ||
        url.username ||
        url.password
      )
        throw new Error('Invalid uploaded file');
      return url.href;
    } catch {
      throw new EvoLinkRequestError(0, 'upload');
    }
  }

  async generate({
    params,
  }: {
    params: AIGenerateParams;
  }): Promise<AITaskResult> {
    const { image_url, ...options } = params.options ?? {};
    const imageUrls = image_url ? [await this.upload(image_url)] : undefined;
    const endpoint =
      params.mediaType === AIMediaType.VIDEO ? 'videos' : 'images';
    const body = await this.request(
      `https://api.evolink.ai/v1/${endpoint}/generations`,
      'submit',
      JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        ...options,
        ...(imageUrls ? { image_urls: imageUrls } : {}),
      })
    );
    if (typeof body.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(body.id))
      throw new EvoLinkRequestError(0, 'submit');
    return { taskId: body.id, taskStatus: AITaskStatus.PENDING };
  }

  async query({
    taskId,
    mediaType,
  }: {
    taskId: string;
    mediaType?: string;
    model?: string;
  }): Promise<AITaskResult> {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(taskId))
      throw new EvoLinkRequestError(400, 'query');
    const body = await this.request(
      `https://api.evolink.ai/v1/tasks/${encodeURIComponent(taskId)}`,
      'query'
    );
    const statuses: Record<string, AITaskStatus> = {
      pending: AITaskStatus.PENDING,
      processing: AITaskStatus.PROCESSING,
      completed: AITaskStatus.SUCCESS,
      failed: AITaskStatus.FAILED,
      cancelled: AITaskStatus.CANCELED,
      canceled: AITaskStatus.CANCELED,
    };
    if (body.id !== taskId || !statuses[body.status])
      throw new EvoLinkRequestError(0, 'query');
    const url =
      typeof body.results?.[0] === 'string' ? body.results[0] : undefined;
    return {
      taskId,
      taskStatus: statuses[body.status],
      taskInfo:
        mediaType === AIMediaType.VIDEO
          ? { videos: [{ videoUrl: url }] }
          : { images: [{ imageUrl: url }] },
    };
  }
}
