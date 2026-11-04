# Vikas illustrated guides — research and validation

Date: 2026-11-05. Implemented locally; these changes have not been deployed.

## Search intent and editorial decisions

Research covered each exact phrase and broader spelling/resource variants. Search results mix editing resource sites, creator pages and browser tools. No search-volume or ranking claim is made.

| Target phrase         | Intent found                                                                                      | Guide                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `vikas editor`        | Find an editing resource or a usable photo workflow                                               | `/guides/vikas-editor`: photo preparation, template selection, generation and result review                   |
| `vikas editor logo`   | Find a site's brand asset, a creator signature or an editing overlay                              | `/guides/vikas-editor-logo`: this site's existing SVG, format choice, placement and identification            |
| `vikasheditor`        | Ambiguous navigational spelling; research did not establish a distinct product by that exact name | `/guides/vikasheditor`: exact-domain identification and choosing prompts, image generation or video workflows |
| `vikas editor prompt` | Find usable AI photo-edit instructions and examples                                               | `/guides/vikas-editor-prompt`: a five-part structure, six original recipes and troubleshooting                |

Primary sources consulted:

- [Editing By Vikas — About Us](https://editingbyvikas.com/about-us/): the site describes prompts, CapCut templates, VN codes and other editing resources.
- [Vikas Edit — About Us](https://vikasedit.com/about-us/): the site identifies Vikas Verma and describes editing resources including prompts and PNG assets.

The articles distinguish these sites from **vikas-editor.net**. They do not imply a shared owner, account, credits, endorsement or creator identity. The source descriptions are attributed in the beginner/navigation guides. All six prompt recipes were written for this project, not copied from the researched sites.

## Content and assets

- Four English articles and four complete Chinese translations. Each article has its own title, description, table of contents, date and contextual links.
- Each guide contains exactly three article images: twelve placements per language. Seven lightweight SVG diagrams are original; the photographs reuse this project's existing generated WebP artwork. Captions identify illustrative AI photos and do not present them as tested recipe results.
- The logo download uses the existing `public/logo.svg`. The article accurately describes its charcoal square and SVG view box; it does not promise a transparent PNG download.
- The homepage links to all four guides. Each guide links back to the homepage/templates, links to relevant product pages and shows the other three guides. Chinese page links retain `/zh`.
- The prompt guide has six clipboard buttons and visible error feedback. Examples remain under the studio's 2,000-character limit.
- Product instructions were checked against the existing studio and payment implementation: JPG/PNG/WebP up to 5 MB, one reference image, one free image per account, purchased credits for further images and all video, and the current five-second 720p video workflow. Prices link to the live pricing component instead of being duplicated in articles.

## SEO and rendering

- Each route has a canonical URL, `en`/`zh`/`x-default` alternates, a description, article Open Graph metadata, an Article schema and a BreadcrumbList schema.
- The sitemap gains eight localized URLs. `llms.txt` lists all four English guide routes.
- Guide MDX modules are imported by their route files, outside the eager legal-page glob. Existing legal pages retain their layout.
- Covers have reserved dimensions and high loading priority. Other article images and index thumbnails load lazily. SVG diagrams stay uncropped in covers and guide cards.

## Verification

Checks were performed with Ego Lite against `http://localhost:3105`, using the new routes without placing orders or generating paid media.

- All eight pages rendered their article body in server HTML, with one H1, three article images, nonempty alternative text and no `noindex` directive.
- Browser checks confirmed canonical/alternate links, Article/BreadcrumbList JSON-LD, valid contents targets, homepage links and localized Chinese internal links.
- Forty distinct internal destinations and image URLs returned HTTP 200; the sitemap contained eight guide entries. Authenticated account links were excluded from the anonymous destination check.
- Desktop and 390 px phone layouts were inspected. All eight phone pages had document width equal to viewport width in light mode. Dark and light screenshots were visually reviewed. The mobile guide-index heading was stacked after visual review found an overly narrow two-column heading.
- Clicked homepage → logo guide → homepage. Clicked the prompt contents link and confirmed the heading lands 112 px below the viewport top.
- Clicked all six prompt-copy buttons; all reached their copied state. Downloaded the SVG and compared it byte-for-byte with the source asset.
- `pnpm build`, `pnpm exec tsc --noEmit` and `git diff --check` passed. Existing dependency bundler warnings about `use client` directives remain.

Local screenshots, link results and build logs are in ignored `data/guides-qa/`.

## Security review

Deterministic worktree scan plus manual review covered secrets, injection, access control and ignore coverage. New MDX and SVG content is trusted repository content; SVGs contain no scripts, event handlers or external resources. JSON-LD uses the existing escaped serializer. No API, permission, payment, credit or database behavior changes.

| 级别  | 位置                                              | 问题                                                                  | 修复建议 |
| ----- | ------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| clean | Pending guide changes and existing worktree edits | 扫描通过；未发现密钥泄露、注入或权限漏洞；QA artifacts remain ignored | None     |

No database migration, provider credential or new dependency is needed. Deployment is required before the new guide URLs are publicly available; search indexing has not been claimed or verified.
