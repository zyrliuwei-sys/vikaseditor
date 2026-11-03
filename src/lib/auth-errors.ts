import { m } from '@/paraglide/messages.js';

/** Translate known auth outcomes without exposing provider/internal messages. */
export function authErrorMessage(error: { code?: string } | null | undefined) {
  switch (error?.code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
    case 'INVALID_PASSWORD':
      return m['common.sign.invalid_credentials']();
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return m['common.sign.account_exists']();
    case 'PASSWORD_TOO_SHORT':
      return m['common.validation.password']();
    case 'INVALID_EMAIL':
      return m['common.validation.email']();
    case 'INVALID_TOKEN':
    case 'TOKEN_EXPIRED':
      return m['common.sign.reset_password_invalid_token']();
    default:
      return m['common.sign.request_failed']();
  }
}
