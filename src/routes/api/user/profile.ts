import { createFileRoute } from '@tanstack/react-router';
import { eq } from 'drizzle-orm';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { user } from '@/config/db/schema';
import { MAX_PROFILE_BODY_BYTES, validAvatarDataUrl } from '@/lib/avatar';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function PATCH({ request }: { request: Request }) {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin)
      return respErr('Same-origin request required', { status: 403 });
    const limited = enforceMinIntervalRateLimit(request, {
      intervalMs: 1000,
      keyPrefix: 'profile',
    });
    if (limited) return limited;
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return respErr('Unauthorized', { status: 401 });
    }
    const userLimited = enforceMinIntervalRateLimit(request, {
      intervalMs: 1000,
      keyPrefix: 'profile-user',
      extraKey: session.user.id,
    });
    if (userLimited) return userLimited;
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return respErr('JSON required', { status: 415 });
    const reader = request.body?.getReader();
    let bytes = 0;
    let json = '';
    const decoder = new TextDecoder();
    if (reader)
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_PROFILE_BODY_BYTES) {
          await reader.cancel();
          return respErr('Profile is too large', { status: 413 });
        }
        json += decoder.decode(value, { stream: true });
      }
    json += decoder.decode();
    const body = JSON.parse(json);
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    const image =
      typeof body.image === 'string' ? body.image.trim() : undefined;

    if (name !== undefined && name.length === 0) {
      return respErr('Name cannot be empty');
    }
    if (name !== undefined && name.length > 100) {
      return respErr('Name too long');
    }
    if (image !== undefined && image.length > 0) {
      if (image.startsWith('data:')) {
        if (!validAvatarDataUrl(image))
          return respErr('Invalid avatar image', { status: 400 });
      } else if (
        image.startsWith('/') &&
        !image.startsWith('//') &&
        !image.includes('\\')
      ) {
        // Previously uploaded same-site images remain valid.
      } else {
        try {
          const u = new URL(image);
          if (u.protocol !== 'http:' && u.protocol !== 'https:') {
            return respErr('Invalid image URL');
          }
        } catch {
          return respErr('Invalid image URL');
        }
      }
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (image !== undefined) updates.image = image.length > 0 ? image : null;

    if (Object.keys(updates).length === 0) {
      return respErr('No changes');
    }

    await db().update(user).set(updates).where(eq(user.id, session.user.id));

    const [updated] = await db()
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    return respData({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
    });
  } catch (error: any) {
    return respErr('Unable to update profile', { status: 400 });
  }
}

export const Route = createFileRoute('/api/user/profile')({
  server: {
    handlers: { PATCH },
  },
});
