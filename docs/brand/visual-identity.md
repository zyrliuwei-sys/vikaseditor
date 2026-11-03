# Vikas Editor AI — visual identity

Direction: a cinematic portrait studio for mobile creators in India, with the restraint of a fashion editorial. The signature is a portrait contact sheet: one dominant image, two supporting frames, small typeset captions and a precise frame-corner mark.

## Palette

Design dials: asymmetry 7/10 (portrait-led contact sheet), motion 2/10 (purposeful feedback only), density 5/10 (readable editorial content and a usable studio).

Dark is the default. A warm paper light mode uses the same typography, geometry and portrait-led composition. The optional admin appearance presets are preserved.

| Token            | Name      | Value                 | Use                                  |
| ---------------- | --------- | --------------------- | ------------------------------------ |
| background       | Graphite  | oklch(0.17 0.006 80)  | Canvas                               |
| foreground       | Porcelain | oklch(0.95 0.012 85)  | Main text                            |
| primary          | Champagne | oklch(0.79 0.075 79)  | Actions, selected states, fine rules |
| muted-foreground | Fog       | oklch(0.72 0.012 85)  | Supporting text                      |
| accent           | Pine      | oklch(0.25 0.025 165) | Editorial inset, selected surface    |
| border           | Slate     | oklch(0.33 0.01 80)   | Separators and control outlines      |

Light mode substitutes warm paper `oklch(0.98 0.008 80)`, ink `oklch(0.23 0.012 80)`, bronze action `oklch(0.45 0.075 79)`, secondary text `oklch(0.46 0.016 80)` and pale mint `oklch(0.94 0.025 165)`. Text over photography stays light in both modes. The theme switch is in the desktop header and inside the mobile menu.

## Type

Archivo Variable for headings and the wordmark; DM Sans Variable for body and controls; Cormorant Garamond Variable italic for editorial emphasis and large credit figures. Chinese uses native sans and upright serif fallbacks, with a smaller hero emphasis to avoid splitting short phrases. Display sizing 48–90 px, section headings 30–48 px, body 15–17 px with 1.7–1.85 line height. Small labels use generous tracking, not light low-contrast text.

## Mark and geometry

The V is held between two opposing crop corners. Use the champagne mark on graphite; leave at least one quarter of its width clear on all sides. Assets: `/logo.svg`, `/favicon.svg`. Buttons and inputs have 4–6 px corners; imagery has square or very slightly rounded corners. Keep the same 1280 px content grid and 24/40/64/96 px spacing rhythm across marketing and studio pages.

Interactive targets are at least 44 px tall for filters, template prompt actions, navigation and studio controls. The primary homepage upload action is 52 px tall. Mobile text inputs use 16 px type. Templates show six initial examples; additional examples are available through a stable expand/collapse button and category filters.

## Imagery and motion

Use the original portrait contact sheet with natural skin detail and clear visual differences between styles. Label generated examples; never pass them off as customer results. The only looping image motion is an explicitly labelled, user-controlled concept preview. Hover transitions are 160–240 ms. Respect reduced motion. No decorative glow, animated background or fake customer statistics.

## Voice and states

Confident, concrete and personal. Explain what the creator controls. Cost, service availability and generation status remain visible. Champagne for primary action/focus, pine for subtle supporting areas, muted red for errors. Disabled states have reduced emphasis and retain readable text. Never promise identity preservation, generation speed, unlimited free output or rankings.
