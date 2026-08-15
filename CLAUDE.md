# CLAUDE.md — trishasalasV2

Rebuild of `trishasalas.com` (the v2 codebase). Personal site of Trisha Salas — front-end developer, accessibility consultant, independent mech-interp researcher.

## Tech stack

- **Astro** (minimal-JS by default; MDX-driven content via Astro content collections)
- Single-palette warm cream / peachy theme (replaces the original dark-mode design); no light/dark toggle
- Static-site generation; deployed as static assets

## URL structure

- `/` — home page (Inkling hero design)
- `/writing/` — full writing archive: a flat chronological list of every post (drafts last), each carrying a `category` (`Essay`, `Personal`, `Process`, `Claude-isms`, `Notes`) rendered as a pill that links to its per-category archive at `/writing/<category>/`
- `/writing/<category>/<slug>/` — individual writing detail. Formal publications live at `research.trishasalas.com`; main-site writing pages do not emit scholarly publication metadata.
- `/about/` — author profile (`Person` JSON-LD with full identifier graph)

## Where things live

| Path | What |
|---|---|
| `_hero-reference/` | **Visual-outcome truth source for the hero** — static HTML/CSS reference Trisha built when the spec-driven implementation diverged from intent. Has its own CLAUDE.md explaining what the layout teaches. When the painting and the implementation disagree, the painting wins. |
| `docs/superpowers/specs/2026-04-26-inkling-hero-design.md` | Original home-page design spec. **Drifted from current implementation** (still describes dark mode, dashed-SVG sparkle trail, mix-blend-mode: screen, PNG assets). Treat as design-intent reference; revise per `superpowers:writing-skills` before re-using as authoritative. |
| `docs/sessions/` | Session logs documenting major work passes and decisions |
| `docs/social-urls.md` | Source of truth for ORCID, DOIs, social/research profile URLs |
| `docs/spec-feedback.md` | External feedback pass on the Inkling spec |
| `src/` | Astro source. Layout system on `.site-wrapper` (CSS Grid + subgrid for `<main>`); page coordinates from `--margin-w` (130px dashed rule) and `--content-start` (180px content column). Sections opt into full-bleed via `.full-bleed` class. |
| `src/content/publications/` | Small route-less feed for homepage Research cards. Canonical publication records, PDFs, and scholarly metadata live in the separate research-site repository. |
| `public/images/` | Production-deployed image assets (.webp); `light-bkg-full.webp` is the painted hero scene |

## Key conventions

- **Inkling is a system, not a hero.** She appears as marginalia: glow trails, sparkles, quill cameos, source-code easter eggs. She is not centered as a brand mascot. See "Design intent" in the spec.
- **The whimsy is non-negotiable.** The defensive structure (minimal-professional inner pages, explicit accessibility, formal research metadata) exists to make the whimsy *legible as deliberate craft*, not to soften it. Do not simplify away marginalia under "look more professional" pressure.
- **Accessibility is built-in, not bolted-on.** WCAG 2.2 AA target. `prefers-reduced-motion` honored. Manual pause toggle for ambient motion >5s. Font sizes use `rem` (not `px`) so the site honors a user's browser-default font size. The site itself must be exemplary — Trisha is an a11y consultant.
- **Findability is load-bearing.** The main site links one-way to canonical publication pages at `research.trishasalas.com`, where Highwire Press tags, Schema.org, Dublin Core, visible abstracts, and first-party PDFs live.

## Communication preferences

When working with Trisha:

- **Lead with the punchline.** Don't build up to it. State the recommendation first, supporting reasoning second.
- **Chunk visually.** Bullets, bold key words, short sections, tables when they fit. Walls of prose are hard to navigate.
- **Cap response length.** If content must be long, structure it for scanning, not linear reading.
- **Recommend, don't make her decide unaided.** Lead with the option you'd pick and the reasoning, then offer alternatives. "What do you want to do?" with no recommendation is friction.
- **Trust expert fluency.** Trisha is a senior front-end developer (~30 years). Skip basics; lead with architectural and tradeoff-level thinking.

## Working in this repo

- **Git:** routine operations (`init`, `add`, `commit`, `status`, `diff`, `log`, `branch`, `merge` non-conflicting) handled without per-action confirmation. **Confirm before** any push, force operation, `reset --hard`, branch deletion, or PR/issue action on GitHub.
- **Default branch:** `main`.
- **Commit messages:** conventional prose, multi-line, explains *why* not just *what*. Follow patterns in `git log`.
- **Commit attribution:** integrity matters — Trisha makes solo commits and AI-collaborative commits, and the history should be honest about which is which. If Claude (any model) authored a commit's content, include a `Co-Authored-By: Claude <model name> <noreply@anthropic.com>` trailer naming the model that actually did the work (e.g. `Claude Opus 4.7 (1M context)`, `Claude Sonnet 4.6`). Solo commits get no trailer. When dispatching subagents, instruct them in the prompt to include the trailer matching their own model — it doesn't propagate automatically.
- **Spec changes:** if modifying the Inkling spec, update its Open Items section accordingly. Commit with a message that lists what changed and why.
- **Metadata changes:** if any identifier value changes (DOI, ORCID, social URL), update `docs/social-urls.md` first, then propagate to the spec.
- **Implementation plans:** when ready to plan implementation, invoke the `superpowers:writing-plans` skill against the existing spec.

## Known constraints

- **No arXiv submissions yet** (no endorser found). The site must serve the discoverability role arXiv normally would. Once arXiv submission is possible, add the URL to the identifier graph in `docs/social-urls.md`.
- **Local paper file `accessibility-knowledge-emergence-v3.pdf`** is the same paper as Authorea v2. Local versioning is offset — the Authorea v2 DOI cites the current published version. No mismatch to fix.

## What this file is not

This file is **public-facing project documentation** intended to onboard any developer or AI assistant working in the repo. Session-specific personal context, project backstory, and confidential history of the project's motivations are deliberately *not* in this file — they live in Trisha's session-private notes. If something here reads as sparse, the missing context is intentional.
