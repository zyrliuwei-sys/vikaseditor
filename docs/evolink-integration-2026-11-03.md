# Vikas generation and PayPal pricing v1

Status: local review build. Shared D1 and the existing encrypted EvoLink key are in use. This change has not been deployed to the public Worker. PayPal is selected and enabled in the shared configuration, but merchant Client ID, Client Secret and Webhook ID are still missing; purchases remain explicitly unavailable until configured.

## Generation and pricing

| Feature | Provider request                 | Output                                                 | Charge                            |
| ------- | -------------------------------- | ------------------------------------------------------ | --------------------------------- |
| Image   | `gemini-3.1-flash-image-preview` | 1K, selected aspect ratio; text or one reference image | First image free, then 51 credits |
| Video   | `seedance-2.0-image-to-video`    | Standard 720p, 5 seconds, audio, original framing      | 796 purchased credits             |

The [Nano Banana 2 price page](https://evolink.ai/zh/nano-banana-2) lists approximately USD 0.063 for a 1K output. The [Seedance 2.0 price page](https://evolink.ai/zh/seedance-2-0) lists approximately USD 0.199 per second for Standard 720p image-to-video. V1 multiplies those published base prices by 8 and rounds up to whole credits, at 100 credits per USD. Additional image input and thinking charges are absorbed by the platform. Search add-ons are not enabled.

| Billing  | Starter             | Creator             | Studio              |
| -------- | ------------------- | ------------------- | ------------------- |
| One-time | $9 / 900 credits    | $29 / 2,900 credits | $79 / 7,900 credits |
| Monthly  | $19 / 1,900 credits | $49 / 4,900 credits | $99 / 9,900 credits |

One-time credits do not expire. Monthly credits expire at their paid billing period's end. There are no bonus credits or discounts that silently change the exchange rate. Package limits show images **or** videos, not both combined.

## Accounting and payment behavior

- The first-image entitlement is a deterministic grant in the existing credit ledger. Its claim, consumption and task creation are one D1 batch. Concurrent requests cannot receive multiple free images.
- Further images and all videos use only credits backed by currently paid orders. Gifts and the image trial cannot fund a video. A payment beginning a refund invalidates a pending paid-only debit.
- Confirmed generation failures restore the reservation exactly once. Unknown submission outcomes retain their claim rather than resubmitting a potentially billable provider job.
- EvoLink uploads and generation requests go only to official hosts, with redirects refused and bounded timeouts. Source photos are not stored in the application database.
- Downloads require the task owner's session, enforce a provider-host allowlist and a size limit, and return a real attachment. Results should be downloaded within 24 hours.
- PayPal orders are captured after approval. Subscription approval or activation alone never grants credits; completed transactions do. The same actual transaction ID is used across callbacks and webhooks. Amount and currency must match the order or subscription. Duplicate deliveries are handled atomically.
- PayPal monthly plans and one-time orders are created from the server catalog. Client-supplied prices and credit amounts are ignored. Unsupported explicit providers no longer silently fall back to another gateway.

## PayPal configuration still needed

In Admin → Settings → Payment → PayPal, enter the merchant Client ID, Client Secret and Webhook ID, and select the matching Live or Sandbox environment. Keep secrets in the admin form, not in source code or chat.

Configure the same PayPal application to send events to `https://vikas-editor.net/api/payment/notify/paypal`. The flow uses `CHECKOUT.ORDER.APPROVED`, `CHECKOUT.ORDER.COMPLETED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.SALE.COMPLETED`, and subscription activation/update/cancellation/suspension/expiration events. See [PayPal subscription webhook documentation](https://developer.paypal.com/subscriptions/webhooks) and [Orders API capture flow](https://developer.paypal.com/api/rest/integration/orders-api).

Live merchant checkout and real renewal payments cannot be verified without those credentials. Provider contracts, six package payloads, capture, callback, renewal, invalid signatures, mismatched amounts/currencies and repeated events were tested with isolated API fixtures. There were no real PayPal purchases during testing.

## Verification

- Real EvoLink image and video submissions completed successfully. The image result was a PNG; the video was H.264 with AAC audio, approximately 5 seconds. Both files downloaded successfully.
- Ego browser: new ordinary account → upload/remove/re-upload → custom prompt → copy prompt → aspect ratio → free generation → history → attachment download. The downloaded image was 1024 × 1024.
- After the free image, a second image request returned HTTP 402. An unpaid video request also returned HTTP 402. After logout, the same download returned HTTP 401.
- Paywall opens pricing in another tab, preserving the workspace. Both billing tabs, mobile layout and light/dark colors were checked. No horizontal overflow at 390 px. Temporary test user and its credentials were removed after verification.
- Full suite: 152 passed, 1 skipped. Additional real local D1 runs: 15 generation tests and 6 PayPal tests passed. Post-review payment regression run: 12 passed.
- TypeScript, standard production build and Cloudflare build passed. No schema migration or new environment variable is required.

## Security scan

| Severity | Scope                          | Finding                                                                                                    | Action                                                                                             |
| -------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Clean    | Pending changes / ignore rules | No secret or forbidden-file findings                                                                       | Scanner passed                                                                                     |
| Fixed    | PayPal settlement              | Approval could be confused with payment; webhook IDs did not reliably match checkout IDs                   | Completed-transaction checks, provider-scoped lookup, amount/currency checks and concurrency tests |
| Clean    | Generation / trial / downloads | Owner checks, bounded raster input, atomic accounting, fixed upstream hosts and private download responses | Unit, D1 and browser checks passed                                                                 |

No unresolved high or medium issue was found in the reviewed change. Real PayPal acceptance remains a configuration-dependent verification step, not a successful live-payment claim.
