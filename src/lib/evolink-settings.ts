/** Server-side credential check. It never submits a generation or spends credits.
 * Docs: https://evolink.ai/docs/en/api-manual/account-management/get-credits
 */
export async function testEvoLinkConnection(
  configs: Record<string, string>
): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, string>;
}> {
  const key = configs.evolink_api_key?.trim();
  if (!key || key.startsWith('••••') || /[\r\n]/.test(key)) {
    return { success: false, message: 'Enter an EvoLink API Key first.' };
  }

  try {
    const base = new URL(
      configs.evolink_base_url?.trim() || 'https://api.evolink.ai'
    );
    // A platform-specific card must never send its key to an arbitrary host.
    if (
      base.protocol !== 'https:' ||
      base.hostname !== 'api.evolink.ai' ||
      base.port ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      !['', '/v1'].includes(base.pathname.replace(/\/+$/, ''))
    ) {
      return {
        success: false,
        message: 'Use the official EvoLink Base URL: https://api.evolink.ai',
      };
    }

    const response = await fetch(new URL('/v1/credits', base), {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const messages: Record<number, string> = {
        401: 'EvoLink rejected this API Key. Check that it is valid and active.',
        403: 'EvoLink denied access. Check the API Key permissions and IP allowlist.',
        429: 'EvoLink rate limit reached. Please try again later.',
      };
      return {
        success: false,
        message:
          messages[response.status] ||
          `EvoLink request failed (HTTP ${response.status}).`,
      };
    }

    const body = await response.json();
    const userCredits = body?.data?.user?.remaining_credits;
    const tokenCredits = body?.data?.token?.remaining_credits;
    const unlimited = body?.data?.token?.unlimited_credits === true;
    if (
      body?.success !== true ||
      typeof userCredits !== 'number' ||
      !Number.isFinite(userCredits) ||
      (!unlimited &&
        (typeof tokenCredits !== 'number' || !Number.isFinite(tokenCredits)))
    ) {
      return {
        success: false,
        message: 'EvoLink returned an unexpected credits response.',
      };
    }
    return {
      success: true,
      message:
        'EvoLink connected. API Key verified; no generation was submitted.',
      details: {
        'Account credits': String(userCredits),
        'API Key credits': unlimited ? 'Unlimited' : String(tokenCredits),
      },
    };
  } catch {
    // Never reflect a raw provider response/error: it may contain credentials.
    return {
      success: false,
      message:
        'Unable to reach EvoLink. Check the Base URL and network, then retry.',
    };
  }
}
