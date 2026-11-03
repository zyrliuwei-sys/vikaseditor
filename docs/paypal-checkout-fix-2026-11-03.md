# PayPal checkout repair — 2026-11-03

Live checkout returned HTTP 502 before sending the OAuth request to PayPal. Cloudflare Workers rejects `redirect: 'error'` during request construction; the same code worked under Node. Live stack frames identified `PayPalProvider.ensureAccessToken`, and a real workerd test reproduced the failure before the fix.

PayPal now uses `redirect: 'manual'` and rejects non-success responses. Authorization headers are never forwarded to a redirect destination. The same unsupported option was corrected in EvoLink requests, connection checks, generation downloads and IndexNow. Checkout diagnostics contain only the stage, error class and stack frames, without request/response bodies, customer data or credentials. No schema or saved-key changes were required.

Validation:

- 30 tests passed across PayPal, Workers, EvoLink and IndexNow. Workers tests cover concurrent one-time/monthly checkout and refusal to follow OAuth/order/subscription redirects.
- 6 PayPal settlement tests passed against local D1, including concurrent callbacks, webhook deduplication, amount checks and subscription credits.
- `pnpm build`, the Cloudflare production build, and `git diff --check` passed.
- Published Worker version: `4b034861-6ac8-4227-99c1-391f5bb6abde`.
- Ego browser: clicked the live $9 one-time and $19/month Starter buttons. Both opened the matching PayPal login/card checkout. Both cancel paths returned to the website.
- No payment was authorized or captured. The two test order records were still `created` and were removed by their exact PayPal session IDs; no paid orders or user credits were changed.
- Actual live capture and renewal were not performed. Their amount validation and exactly-once credit settlement were covered by the automated tests.

Security scan:

| 级别 | 位置           | 问题                                                                         | 修复建议 |
| ---- | -------------- | ---------------------------------------------------------------------------- | -------- |
| 通过 | 本次待提交改动 | 未发现密钥泄露、注入或权限问题；忽略配置检查通过。重定向测试确认凭据不外发。 | 无       |

The production PayPal configuration and webhook were verified without exposing their values. Temporary account credentials, payer metadata and raw live logs were removed after the check.
