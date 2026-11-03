# Vikas Studio specification

Adaptation of Framia's creator prompt form to the user's upload/template/generate workflow. Scope is an original product that references Framia's style, not a wholesale content clone.

## Extracted visual foundation

- Reference: `docs/design-references/framia-desktop.png`, `docs/research/framia-extraction.json`.
- Reference body background rgb(10,10,11); primary rgb(212,255,94); text rgb(250,250,250).
- Reference prompt surface rgb(31,31,31), 12px radius, 12px 12px 12px 20px padding.
- Reference primary buttons 6px radius, black text, 10px 20px padding.
- Product adaptation uses existing global oklch tokens; Archivo Variable headings, DM Sans Variable body.
- Main width 1240px; surface #151617; inset panels #1c1d1e; 1px #303132 borders.
- Studio desktop grid: form 46%, output 54%; 28px inner padding, 20px panel gap, 18px corner radius.
- At <768px stack form and output; inputs min-height 44px; no horizontal overflow.

## Interaction model

Click-driven image/video tabs, local image upload preview with drag and drop, template selection changes prompt and mode, editable prompt, aspect selector, generate button calls authenticated API, polling output, download link and user history. Never simulate a generated result. A missing provider is an explicit recoverable state.

## Component contract

- `src/blocks/vikas/studio.tsx` exports `VikasStudio({templates, selection})`; section id `studio`.
- Props use VikasTemplate and StudioSelection in src/types/vikas.ts.
- Selection updates carry a revision number, allowing reselecting same template to reset prompt.
- Root owns homepage and gallery. Studio owns form, result and history UI. All text translated via m[]; reusable components take text props.
- Original art previews use `VikasArtwork` in src/components/vikas/artwork.tsx. These are clearly examples, never user results.
- Use useSession from core/auth/client; query/mutation from TanStack Query and apiGet/apiPost.
- Endpoint contract: GET /api/generations/config -> GenerationCapabilities; POST /api/generations -> GenerationResult; GET /api/generations -> GenerationResult[]; GET /api/generations/$id -> GenerationResult.
- POST body `{requestId: UUID, mediaType: 'image'|'video', prompt: string, image?: data URL, aspectRatio:'1:1'|'3:4'|'9:16'|'16:9'}`. Image optional for image, required for video. PNG/JPEG/WebP up to 5MB. Data stays local until Generate.
- Public config false means copy prompt remains available, actual Generate shows configuration message. No credentials exposed.
- Error, loading, signed-out, no-result and success states required. Use native file input; no upload at selection time. Persist neither local photo nor prompt to localStorage. Use form labels and keyboard-focusable controls.

## Copy direction

“Your photo. A whole new story.” / “Image” / “Video” / “Upload a photo” / “Describe your idea” / “Generate image” / “Generate video”. Output area initial state is an example image with a small “Style preview” label and a concise workflow instruction. No invented completion speed, fake statistics, or false free credits.
