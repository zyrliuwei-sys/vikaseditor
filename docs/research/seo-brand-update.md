# Vikas Editor AI: SEO copy and visual redesign

Updated 2026-11-03. Audience: people in India looking for photo editing inspiration, usable AI prompts and photo-to-video workflows. English is the primary version; the same editorial content is translated into Chinese.

## Search intent and page mapping

| Keyword group                                     | Content location                      | User value                                                      |
| ------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| Vikas Editor, Vikas Editor AI                     | Homepage title, H1, introduction, FAQ | Identifies this independent product                             |
| Vikas AI photo editor, AI photo editing templates | Introduction and template library     | Shows available looks and editable prompts                      |
| Vikas editing prompts, cinematic photo editing    | Style essays and prompt guide         | Explains how to describe light, outfit, subject and composition |
| Saree photo editing, Diwali photo editing         | Fashion and festival guidance         | Connects visual references to practical creative decisions      |
| Photo to video AI                                 | Motion section and studio             | Describes the actual five-second image-to-video workflow        |

This is an intent map, not a claim of measured search volume. The site does not claim affiliation with Editing By Vikas, official creator status, guaranteed ranking, exact identity preservation or free generation.

## Copy length

The English homepage contains approximately 1,300 editorial words. Latest browser count after the quality refinement: 1,314 words in the headings, paragraphs, template captions, prompt example and FAQ questions/answers, with the initial six templates displayed. The count includes expandable FAQ answers and excludes navigation, buttons, the interactive studio and footer text. There is no hidden SEO copy. All content is rendered in the page and readable without signing in.

The added material covers styles, photo preparation, framing, prompt composition, compatible instructions, iterative refinement, privacy, credits and provider limitations. The prompt example has a working action that populates the studio.

## Sources reviewed

- [Editing By Vikas: About](https://editingbyvikas.com/about-us/) provides first-party context for templates, tutorials and AI prompt search intent. Our product uses original copy and artwork and states that it is independent.
- [VikasEditor.org](https://vikaseditor.org/) and [VikasEditor.net](https://vikaseditor.net/) were reviewed as examples of the photo/template/prompt search landscape. These are not the user's hyphenated domain.
- [Google: Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) informed the emphasis on practical instructions and original content. Google does not prescribe a preferred word count.
- [Google: Title links](https://developers.google.com/search/docs/appearance/title-link) informed concise, distinct page titles.

## Implementation

- Shared metadata helper for `/`, `/create` and `/pricing`: localized title, description, canonical, language alternates, Open Graph and Twitter cards.
- `/create?mode=image` and `/create?mode=video` share the canonical `/create` because they are two states of one studio.
- `/create` added to sitemap. Legal pages retain their own canonical and now have language alternates; homepage alternates are no longer inherited by unrelated routes.
- Production origin is `https://vikas-editor.net`. Local previews intentionally use the development origin to preserve authentication.
- Brand specification: `docs/brand/visual-identity.md`. Original portrait assets are reused; no stock testimonials or fabricated performance metrics were added.

## Verification

- Production build: `pnpm build` passed.
- TypeScript: `pnpm exec tsc --noEmit` passed.
- Homepage and creation studio: no horizontal overflow at 320, 390, 768 and 1440 px.
- English/Chinese homepage, credit page and legal shell inspected in the browser. Chinese mobile heading adjusted to keep the phrase together.
- Template category filter, empty search/reset, prompt dialog, template-to-studio action, guide-to-studio action and mobile menu checked.
- Upload preview tested with an existing local PNG; preview uses a local blob URL. No paid generation was submitted.
- Primary button contrast 9.48:1; muted body text on canvas 7.70:1; muted text on input surfaces 6.24:1.
- Screenshot evidence in `docs/design-references/vikas-brand-*.png`.

Generation service configuration remains unchanged; the interface accurately reports its availability. No deployment or commit was performed.
