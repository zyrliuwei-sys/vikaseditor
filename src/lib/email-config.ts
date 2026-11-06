/** Shared capability check; never expose provider credentials to the browser. */
export function isEmailSendingConfigured(
  configs: Record<string, string>
): boolean {
  return configs.email_provider === 'cloudflare'
    ? Boolean(
        configs.cloudflare_email_api_token &&
        configs.cloudflare_email_account_id &&
        configs.cloudflare_email_sender_email
      )
    : Boolean(configs.resend_api_key && configs.resend_sender_email);
}
