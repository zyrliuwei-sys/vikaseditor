/** Result URLs originate at the provider, but downloads still use an allowlist
 * to keep a corrupt provider response from becoming a server-side proxy. */
export function safeGenerationDownloadUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      ['files.evolink.ai', 'cdn.evolink.ai', 'fal.media'].some(
        (host) =>
          url.hostname === host ||
          (host === 'fal.media' && url.hostname.endsWith('.fal.media'))
      )
      ? url
      : null;
  } catch {
    return null;
  }
}
