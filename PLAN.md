# OakJMUN 2026 website: build plan (Task 0)

Status: **waiting for Supratiik's approval.** No code has been written yet. Everything below comes from reading `SPEC.md`, `CLAUDE.md`, all 24 frames in `reference/`, and a subagent's read of OakMUN's source (`srijai-k/FINAL-OAKMUN`, the 14 top-level HTML files only).

Section 6 lists the decisions I need from you. Everything else follows the spec unless it says otherwise.

---

## 1. Approach in one paragraph

Rebuild OakMUN's look in Eleventy 3 with one layout, one nav, one footer and all content in `src/_data/*.json`. Port OakMUN's CSS values (not its code) into a token file plus a small set of component stylesheets, so a change happens in one place instead of 13 files. Keep OakMUN's signature pieces (pill nav, glass countdown, teal marquee, gradient stats, schedule timeline, committees wheel, photo tiles, flip cards). Drop what the brief rules out (scroll hijack, 6 px labels, heavy blur, low-contrast body text, slogans, eyebrow labels everywhere, "→" on buttons). Add one new idea: the placard intro, reused on New to MUN? and the 404.

OAKMUN_SECTION_PENDING

---

## 3. What I'll build

### 3.1 Files

Exactly the structure in SPEC section 11, plus:

| Extra file | Why |
| --- | --- |
| `.nvmrc` (`22`) | Pins Node for Cloudflare Pages and your laptop. |
| `.gitignore` | `node_modules/`, `_site/`, `screenshots/`. |
| `src/_data/helpers.js` | Tiny computed values: committee count, `isSet(url)` (false for empty or "TBC"), date formatting. Keeps logic out of templates. |
| `src/_includes/partials/placard.njk` | The one placard shape, shared by the intro, New to MUN? and the 404. |
| `src/_includes/partials/committee-tile.njk`, `item-card.njk`, `eb-card.njk`, `person-card.njk` | Repeated cards exist once. |
| `scripts/lib/hash-assets.mjs` | Content-hashes CSS and JS filenames at build time so `_headers` can mark them `immutable` (see 4.6). |

`src/_includes/layouts/base.njk` takes front matter for `pageCss` and `pageJs` so each page loads only its own modules.

### 3.2 Components, by task

| Task | Component | Notes |
| --- | --- | --- |
| 1 | Tokens, reset, type scale, focus ring, skip link | All values from SPEC 3; no raw hex outside `tokens.css`. |
| 1 | Announcement strip | `sessionStorage` dismissal in try/catch. |
| 1 | Nav pill, More dropdown, scroll collapse, mobile sheet | See 4.1 for how the collapse avoids animating width. |
| 1 | Footer | Four columns, one on phones. |
| 1 | `screenshot.mjs`, `check-links.mjs`, `_headers`, npm scripts | |
| 2 | All seven data files | Placeholder content exactly as SPEC 7, every unknown marked TBC. |
| 3 | Hero (static final state), countdown | |
| 3 | Twin marquee (teal left, navy right, slower) | CSS `transform` loop, paused by IntersectionObserver and `visibilitychange`. |
| 3 | Theme: "announced soon" band, plus the full sticky reveal behind `theme.enabled` | Both built now so "turn the theme on" is a one-line JSON change. |
| 3 | Stats with one-time count-up | Numbers from `site.json`; the committee count is computed. |
| 3 | SG letter | Two-column grid, not a card. |
| 3 | Schedule tabs, legend, timeline | ARIA tabs pattern. |
| 3 | Committees wheel | Static list under reduced motion. |
| 3 | More than debate (two cards), FAQ accordion, closing banner, sponsors (hidden while empty) | |
| 4 | Placard intro | Web Animations API, no libraries. |
| 5 | Committees listing (chips, search, live result count), committee pages via pagination | |
| 5 | Media pipeline for the borrowed photos and logos | |
| 6 | Secretariat flip cards, Allocations, Resources | |
| 7 | New to MUN?, Social Night (moon, bats, embers), 404 | |
| 8 to 10 | Lighthouse, axe, 360 px check, review subagent, docs | |

---

## 4. How the tricky parts will work

### 4.1 Nav collapse without animating width
OAKMUN_NAV_PENDING

### 4.2 Countdown
Counts to `site.json` start date, updates once a second but only rewrites a digit when it changes, and the live region is off: the container has a static `aria-label` ("Conference starts Friday 30 October 2026 at 8:00 am") so screen readers don't hear every tick. After the start it reads "Happening now"; after the end, "See you next year".

### 4.3 Placard intro (Task 4)
- Placards are absolutely positioned `<div>`s injected by `intro-placards.js` into an `aria-hidden` layer over the hero. The real `<h1>`, meta line, buttons and countdown are in the HTML from the start; the script only sets their opacity to 0 at the very beginning and animates them back.
- Every step uses `element.animate()` with transform and opacity only. `will-change` is added at start and removed in the `finish` handler.
- Skip: one `{ once: true, passive: true }` listener each for `pointerdown`, `keydown`, `wheel`, `touchmove`. Skipping calls `finish()` on every running animation, which jumps to the final state. Scrolling is never blocked.
- `sessionStorage` flag (try/catch). Reduced motion: the script exits before doing anything.
- LCP: see risk R1.

### 4.4 Theme reveal
Desktop (fine pointer, wider than 980 px): a 200 vh section with a sticky inner block; a rAF-throttled scroll handler maps progress to each word's opacity and `translateY`. Phones: a plain section, one IntersectionObserver reveal. While `theme.enabled` is false only the "Conference theme announced soon" band renders, so no JS loads for it.

### 4.5 Images
`@11ty/eleventy-img` HTML transform: avif, webp, jpeg at 400/800/1200/1600, lazy and async by default, `sizes` on every image. Borrowed committee photos are made black and white **at build time** with sharp (so there's no CSS filter to repaint on hover) and get the navy overlay in CSS. A missing photo renders the navy "Photo TBC" tile; a missing person photo renders initials in a teal ring.

### 4.6 Caching and fingerprints
eleventy-img already hashes image filenames. For CSS and JS, a small build step writes `base.3f9a1c.css`-style names and an `asset` filter maps `/css/base.css` to the hashed URL in templates. JS modules don't import each other with relative paths (a stale relative import would be cached forever); the one shared dependency, Lenis, is loaded with a dynamic `import()` whose URL the template passes in. `_headers` then marks `/css/*`, `/js/*`, `/assets/*` and fonts `immutable`, and HTML `max-age=0, must-revalidate`.

### 4.7 Fonts
Copy only `montserrat-latin-wght-normal.woff2` and `montserrat-latin-wght-italic.woff2` from `@fontsource-variable/montserrat` into `src/assets/fonts/`. Two `@font-face` rules with `font-weight: 300 900` (normal) and `300` (italic), `font-display: swap`, and a size-adjusted Arial fallback to keep CLS near zero. Preload only the normal file; the italic one downloads only on the homepage, where "debate." uses it.

### 4.8 Lenis
Passthrough-copied from `node_modules/lenis/dist/lenis.mjs` to `/js/vendor/lenis.mjs` at build time. `smooth-scroll.js` imports it only when `(pointer: fine)` matches and reduced motion is off, with `lerp: 0.11, smoothWheel: true, wheelMultiplier: 0.95`.

---

## 5. Conflicts and gaps

### 5.1 Between the spec and OakMUN's source or the reference frames

OAKMUN_CONFLICTS_PENDING

### 5.2 Inside the spec

| # | Conflict | What I'll do |
| --- | --- | --- |
| S1 | 8.5 says countdown numbers are white; 3.1 says the number gradient is used on the countdown. | White, as in 8.5 and `reference/02`. The gradient stays on the stat numbers only. |
| S2 | 8.5 sets countdown labels at ".62rem minimum" (9.9 px); `CLAUDE.md` sets 11 px as the minimum for labels. | `.7rem` (11.2 px). `CLAUDE.md` wins. |
| S3 | `nav.register.url` is `"TBC"`, and the closing banner is hidden only when the URL is empty, so a Register button would link to a page called "TBC" and fail `npm run check`. | Treat any URL that is empty or contains "TBC" as not set. Register buttons still show (the draft needs them for review) but render as non-links with `aria-disabled="true"` and a "Registration link TBC" tooltip. The closing banner shows. When a real URL goes in, they become links with no other change. |
| S4 | 9.2's filter chips are plural ("Councils", "Agencies") but 7.2's categories are singular ("Council", "Agency"). | Chips map to the singular data values. |
| S5 | 9.1 says "More ▾"; rule 8 says one icon set and no stray glyphs. | Lucide `chevron-down`. |
| S6 | "Every placeholder value contains TBC" vs fields that are meant to be empty (`sgLetter.photo`, `eb[].name`, `sponsors`, `nav.secondary.url`). | Empty means "hide or show the placeholder tile"; it doesn't need TBC. Visible placeholder text always contains TBC. |
| S7 | Secretariat lists "USGs of Technology: Supratiik K., TBC", so one person's name is "TBC". | That card reads "Name TBC" with "TBC" initials. |

---

## 6. Decisions I need from you

DECISIONS_PENDING

---

## 7. Risks

RISKS_PENDING

---

## 8. Working in this cloud session

- This session runs Claude Code in a cloud container, not on your laptop. Node 22, ffmpeg and a Chromium build that matches Playwright 1.56.1 are already installed here, so `npm run shots`, `npm run media` and Lighthouse all run here. I'll pin `playwright@1.56.1`; on your laptop the first `npm run shots` needs `npx playwright install chromium` once (Task 10 docs will say so).
- After each task I'll send the screenshots to you in the app and push to the branch `claude/new-session-smmq0m` on `suprathedude/JMUN-26-Wesbite`. Nothing goes to `main` until you say so.
- Cloudflare Pages can build a preview link for every branch, so you can connect the repo after Task 3 and see the draft on your phone without merging anything.
