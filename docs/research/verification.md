# First-version verification

Date: 2026-11-03. Local preview: http://localhost:3001/. Production domain configured: https://vikas-editor.net. No production deployment or paid model request was made.

## Automated checks

- `pnpm build`: passed on final application source.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- `node --import tsx --test tests/generations.test.ts`: 11 passed.
- `pnpm test:atomic`: 11 passed.
- `pnpm test:atomic:d1`: 11 passed against local D1.
- `python3 .claude/skills/security-scan/scripts/scan_staged.py --worktree`: clean. Manual review covered generation ownership, server-owned costs, idempotent debit and refund, bounded raster data URLs, secret handling and provider result/error handling.
- `git diff --check`: passed.

## Browser checks

Ego Browser: desktop 1440×1000, tablet 768×1024, mobile 390×844. Screenshots in `docs/design-references/`.

- No horizontal page overflow at all checked widths; final desktop has no broken img elements.
- English homepage and Chinese `/zh` render correctly with no missing Vikas translation keys.
- Mobile menu opens and closes. Navigation reaches image/video studio modes.
- Fashion filter shows two matching templates; searching unknown text shows an actionable empty state.
- Template detail dialog opens, copies the original prompt, and applies the selected template to the studio.
- Native photo selection and the hero upload shortcut work. Image preview uses a local object URL; selection alone makes no upload.
- Video mode requires a photo, shows 20-credit cost, and explains source-image framing instead of exposing an unsupported aspect-ratio selector.
- Unconfigured provider state is explicit; Generate does not display a fake result. Account history has an empty state.
- `/`, `/create?mode=video`, `/zh`, `/pricing`, `/privacy-policy`, `/terms-of-service` and `/api/generations/config` return HTTP 200.
- Anonymous generation history returns 401; cross-origin generation POST returns 403.

## Activation

Configure Fal in Admin → Settings → AI → Fal, then grant test credits to an account. Live generation was not exercised because no Fal key is configured. Images cost 4 credits; five-second videos cost 20. Generated media is provider-hosted; uncertain provider submissions need operator reconciliation. The existing payment catalog is retained, but the new public credits page does not advertise its demo subscription offers.

Existing unrelated D1/development changes in the workspace were preserved. Origin points to the user's vikaseditor repository; upstream was added for future ShipAny template updates.
