# OakJMUN 2026 website: build plan (Task 0)

**Status: approved by Supratiik on 1 October 2026, with every recommendation in section 6 (D1 to D7).**

This plan is based on `SPEC.md`, `CLAUDE.md`, all 24 frames in `reference/`, and a subagent's read of OakMUN's source (`srijai-k/FINAL-OAKMUN`, main @ `999b1b7`, the 14 top-level HTML files). The subagent's full report, with file and line references for every value, is saved as `docs/oakmun-source-study.md` so later tasks can port values without re-reading OakMUN.

**Section 6 has seven decisions for you.** Each one has a recommended default, so you can approve the whole plan with one "yes" or change only the ones you disagree with.

---

## 1. Approach

The plan is to rebuild OakMUN's look in Eleventy 3, with:

- one layout;
- one nav, one footer and one announcement strip, each in `src/_includes/partials/`;
- all content in `src/_data/*.json`.

**What gets ported.** OakMUN's CSS *values*, not its code. They go into `tokens.css` plus a few component stylesheets, so a change is made once rather than in 13 files. OakMUN's own copies have already drifted apart (two different golds, three nav paddings, two footers, two scroll thresholds).

**What stays.** OakMUN's signature pieces:

- pill nav
- glass countdown
- teal marquee
- gradient stats
- schedule timeline
- committees wheel
- photo tiles
- flip cards

**What goes.** Everything the brief rules out:

- the scroll-locking intro
- `html { zoom: 1.1 }`
- 6 px labels
- heavy blur
- body text at .4 opacity
- slogans
- eyebrows over every heading
- "→" on buttons
- runtime CDN scripts

**What's new.** One idea: the placard intro, reused on New to MUN? and the 404.

---

## 2. What OakMUN does, and what we'll port

Short version. The full values are in `docs/oakmun-source-study.md`; refs below are `file:line` in OakMUN.

### 2.1 Global facts that change the plan

- **Every page sets `html { zoom: 1.1 }` above 768 px** (index.html:16). Everything in `reference/` is drawn 10% larger than the CSS says. If we copy the spec's sizes exactly, our desktop will look about 10% smaller than the frames. See decision D1.
- **Fonts** come from Google Fonts with no fallback stack. The "debate." italic asks for weight 300 but only 400 italic is loaded, so OakMUN never actually shows the light italic. We'll self-host the variable font, so ours will.
- **Lenis** is loaded from unpkg under its old package name (`@studio-freight/lenis@1.0.42`). The options match the spec (`lerp .11`, `smoothWheel`, `wheelMultiplier .95`), and it's skipped on coarse pointers.
- **Accessibility gaps we'll fix while porting:**
  - FAQ items, Secretariat cards and the "Other" dropdown are hover or click `div`s with no keyboard support or ARIA.
  - Nav CTAs are `<button onclick>` used as links.
  - Nothing handles reduced motion for the intro, wheel, cursor pill or Social Night particles.
- **Licence:** MIT, "Copyright (c) 2026 Oakridge MUN". A copy is saved as `docs/OAKMUN-LICENSE.txt`; the footer keeps the credit line from SPEC 9.1.

### 2.2 Component by component

| Area | OakMUN (key values) | Ours |
| --- | --- | --- |
| **Nav pill** (index:85-375) | `rgba(1,3,8,.97)`, blur 24, radius 100, border `rgba(250,245,237,.07)`, padding 8/10 (10/14 on subpages), nav shadow as spec; links `.64rem/700 .1em` at ink .48; crest 44 px with teal drop-shadow .35 → .65 on hover; CTA gradient 180deg, radius 12. | Same values once, site-wide. Links at `.7rem`, ink .55 → 1 (spec). Crest at the exact centre of the pill (grid `1fr auto 1fr`) so it doesn't move when the pill collapses. |
| **Scroll collapse** (index:357-363, 4231-4257) | Past 80 px going down adds `.scrolled`: wordmark, links and buttons go to `opacity:0; max-width:0`. Any upward scroll restores it. While collapsed, hovering the crest expands it (≥1250 px). | Same rules, but no `max-width` animation (that's what produces the overlapping text visible mid-transition in `reference/11` and `reference/24`). See 4.1. Clicking the compact crest also expands it, as the spec says, so it works for touch and keyboard. |
| **"Other" dropdown** (index:143-176, 256-273) | Actually the 210 px single-column `.nav-drop--events` variant, right-aligned. CSS-only hover, closes after a .55 s delay, with a 20 px invisible bridge. The 320 px 3-column version is unused. | Single column, about 220 px, right-aligned, labelled "More" with a Lucide chevron. Opens on hover and focus, closes after .55 s, Escape closes, `aria-expanded` on the trigger. No blur (the spec allows blur only on the pill). |
| **Mobile sheet** (index:2161-2223) | Hamburger morphs into an X. The drawer is a floating panel with no blur on phones. | The spec's full-screen sheet on `rgba(1,3,8,.99)`, large links, Register at the bottom, focus trap, Escape closes. The menu-button X animation is ported. |
| **Announcement strip** (index:4482-4509) | `#1a8899 → #30CDD7 → #1a8899`, with a shimmer sweeping every 2.2 s forever. | Spec: teal → teal-dark, no shimmer (an always-running animation on every page). |
| **Hero** (index:395-899) | Video at .35 opacity under the spec's overlay **with `mix-blend-mode: multiply`**; 36 px dot grid; three orbs drifting with `filter: blur(60px)`; "XVI" SVG watermark at .18; title clamp as spec; meta line with 28 × 1.5 px teal rules; countdown tiles with an 8 px blur glass layer. | Overlay keeps the multiply blend (without it the photo reads far lighter than `reference/02`). The orbs become static radial gradients with no `filter` (already soft, no blur cost). "XIV" is outlined live text at .15, not an SVG. Countdown tiles are a solid `rgba(255,255,255,.1)` fill, no blur. |
| **Old intro** (index:3610-3990) | Locks `body` with `position: fixed`, forces `scrollTo(0,0)`, drives a virtual scroll from the wheel, intercepts `#` links. Hero content and the watermark start at opacity 0 and depend on it. | Not ported at all. Our hero is fully visible without JS; the placard intro (Task 4) only hides it while it plays. |
| **Theme reveal** (index:1046-1236, 4328-4467) | 340 vh sticky section; words fade in with 48 px translate and a 14 px **blur** at p = .44 + i × .055; one-way (stops at p ≥ .95); highlighted word `135deg teal → teal-light 60%`; caption italic at .7. | 200 vh, no blur, reversible. The same media query decides sticky mode in both CSS and JS (OakMUN gets this wrong on landscape iPads and leaves a long dead scroll). See 4.4. |
| **Marquee** (index:903-939) | `#27b0bd`, `.72rem/800 .2em` navy, 4 px navy dots at .4, two copies of the content, `translateX(-50%)` over 22 s. A reversed navy strip exists but is hidden. | Same, plus the spec's second navy strip running the other way, slower (about 34 s). Both pause off-screen and in hidden tabs. |
| **Stats** (index:1243-1316, 4270-4291) | Tile gradient 145deg `#0a2040 → #061628 60% → #030e1a`, two glows, number gradient and glyph-clipping padding as spec; count-up at threshold .5 over 1600 ms, ease-out cubic. A student photo sits behind at .05. | Ported as is, minus the photo. One glow per tile (spec). Labels raised from `.6rem` at .45 to `.72rem` at .6. |
| **SG letter** (index:1321-1475) | A 380 px **float**, so the letter wraps under the photo; no phone rule (it overflows on phones). Body at .68. | A two-column grid (photo, then a text column of up to 68 characters a line) that stacks on phones with a 4:5 photo. Body at .75. A "Photo TBC" tile until the photo exists, and a signature slot hidden until `signature` is set. |
| **Schedule** (index:1484-1825, 2479-2560) | Exactly the spec. Tab pills, legend, 200 px time column, 1 px fading teal line, 9 px dots with a ring and glow, tint and border alphas per type, 3 px accent bar inset 16%, **and** a huge faint "01" (`clamp(140px,20vw,260px)` at teal .045) plus a small "01" in the day header. Phones get stacked cards via `:has()`. | Ported nearly verbatim, with the ARIA tabs pattern. The row entrance (12 px slide, 60 ms stagger) runs once per tab, as spec 4.5 allows. |
| **Committees wheel** (index:1829-1958, 4160-4229) | Items sit on an arc: `x = R(1 - cos φ)`, `y = R sin φ`, opacity and scale from `cos φ`, R = 280. It spins **continuously** (0.007 rad a frame) and is pushed by scrolling, with no pauses, and the rAF loop never stops. Logos are forced to 90 px inside 76 px circles, so they're cropped. The crest watermark CSS exists but nothing renders it. | Same arc maths and look, but stepped as the spec says (see D3). Logos fit inside the circle; a committee with no logo gets a teal ring with its code. No watermark until the OakJMUN crest exists. |
| **More than debate** (index:2563-2690) | Item card `rgba(0,30,60,.65)`, border .12 → .35, lift 4 px, accent bar 28 → 44 px; Social Night card browns `#2E1400 → #1C0A00 → #0F0500` with gold border .22, two warm inner glows, tag `#E8A020`, title `#FFF0A0`. Tags are `.4rem`, body at .42. | Ported, with two cards (Social Night, New to MUN?) and a small moon on the Social Night card. Tags at `.72rem`, body at .75. |
| **FAQ** (index:1963-2084) | 10 px gap, radius 16, open border teal .3; a 34 px round toggle that rotates 45° and fills teal; the answer opens with a .55 s **height** transition. Clickable `div`s. | `<button aria-expanded>` controlling a region. The toggle is ported exactly. Height: see D6. |
| **Closing banner, sponsors, footer** (index:2093-2165, 2415-2477, 949-1040) | Banner gradient `#001223 → #001a35 → #001223`. Footer grid `300px 1px 1fr 1fr 1fr` with a hairline divider column; h4 `.65rem` teal; links at .55; bottom row at **.25**. committees.html has a different footer. | One footer. h4 at `.72rem`, links at .6, bottom row at .5. The sponsors row only renders when `sponsors` isn't empty. |
| **Committees page** (committees.html:326-823, 1491-1567) | Chips `#003d6e` / `#1a5a90` with an active teal glow; search pill; grid 3 / 2 / 1 columns (gaps `52px 36px`). Tile hover as spec, plus a rotated inner frame and a `saturate` filter. **Photos are in colour** (DISEC's happens to be a black-and-white archive photo). A "View committee" pill follows the cursor with lerp .09. Filtering staggers cards back in. | Tiles and hover ported (the `saturate` filter is dropped: it's a filter animation). Filtering is instant, with a live result count for screen readers (spec: no staggered entrances). The cursor pill only runs on fine pointers and only while over a tile; keyboard focus shows it pinned to the tile corner. Photo colour: see D2. |
| **Committee page** (committee.html) | All content injected by JS from inline objects keyed on `?committee=`. The hero card has a two-layer navy gradient; the back pill is a muted primary gradient; agenda card with a teal left border and glow; guide card with a blurred type pill; horizontal EB cards. | Static pages from Eleventy pagination. Hero, back pill and agenda card ported. The guide card's pill is solid, not blurred. EB cards follow spec 8.6 (photo, teal role, name, two-line bio clamp). |
| **Secretariat** (secretariat.html:344-461) | Card fronts are pre-designed photos with the name baked into the image (there's no real signature slot). Flip `rotateY(180deg)` over .65 s `cubic-bezier(.4,0,.2,1)` with **no `perspective`**, so it looks flat; clicking anywhere on the card toggles it. Back gradient as spec. | Name, role and signature are HTML, over the photo or the initials placeholder. A "Flip" `<button aria-pressed>` triggers it; `perspective: 1200px` is added; the hidden face is `inert`, so its links can't be tabbed to. Primary teal Instagram button (spec). |
| **Allocations** (allocations.html:192-561) | Title with a hanging 3 px teal bar (`margin-left:-31px`); rounds with glowing 6 px dots; outlined status pill; matrix card (radius 24, teal .04 fill, 60 px icon tile). | Ported. The meta chips and the stats strip are dropped (README). The matrix button is the standard primary pill, disabled until `matrixUrl` is set. |
| **Resources** (resources.html:282-1590) | Guide cards as on the committee page; gold-tinted doc and link cards with **blur 12 px**; section numbers "01" to "04"; a marquee and a stats strip. | Guide, doc and link cards ported without blur (the gold tint uses `--sand`). Section numbers, marquee and stats strip dropped (README). The six research links use the URLs OakMUN lists (resources.html:1534-1590). |
| **Event hero** (networking-hour.html:102-253) | Grid `1fr 1fr`, gap 80; three-line title with a teal middle line; a **Three.js globe** from esm.sh in a 480 px circle, behind a full-screen loader that never times out. | The layout is ported for Social Night (the circle becomes a CSS moon) and New to MUN? (a raised placard). No WebGL, no loader. |
| **Social Night** (social-night.html) | 180-particle canvas running forever, with no reduced-motion check; a 55 s spinning sun ring. | Spec 9.8: up to 20 DOM embers and 2 to 5 SVG bats, animating transform and opacity only, paused off-screen. None on phones (embers) or with reduced motion. |

---

## 3. What I'll build

### 3.1 Files

The structure in SPEC section 11, plus:

| Extra file | Why |
| --- | --- |
| `.nvmrc` (`22`) | Pins Node for Cloudflare Pages and your laptop. |
| `src/_data/helpers.js` | Small computed values: committee count, `isSet(url)` (false when empty or containing "TBC"), date formatting. Keeps logic out of templates. |
| `src/_includes/partials/placard.njk` | The one placard shape, shared by the intro, New to MUN? and the 404. |
| `src/_includes/partials/` card partials (committee tile, item card, guide card, EB card, person card) | Repeated cards exist once. |
| `scripts/lib/hash-assets.mjs` | Content-hashes CSS and JS filenames at build time so `_headers` can mark them `immutable` (4.6). |
| `docs/oakmun-source-study.md` | Already written: the subagent's report. |

`layouts/base.njk` reads `pageCss` and `pageJs` from front matter so each page loads only its own modules.

### 3.2 Components by task

| Task | What gets built |
| --- | --- |
| 1 | Tokens, reset, type scale, focus ring, skip link; announcement strip; nav (pill, collapse, More, mobile sheet); footer; `screenshot.mjs`, `check-links.mjs`, `_headers`, npm scripts. |
| 2 | All seven data files with SPEC 7 placeholders; nav, footer and strip wired to them. |
| 3 | Hero (final state) and countdown; twin marquee; theme band plus the full reveal behind `theme.enabled`; stats; SG letter; schedule; wheel; More than debate; FAQ; closing banner; sponsors. |
| 4 | Placard intro, with a performance trace and Lighthouse LCP with and without the intro. |
| 5 | Committees listing and generated committee pages; borrowed photos and logos through `npm run media`. |
| 6 | Secretariat, Allocations, Resources. |
| 7 | New to MUN?, Social Night, 404. |
| 8 to 10 | Lighthouse, axe, the 360 px check, the review subagent, docs. |

---

## 4. How the tricky parts will work

### 4.1 Nav collapse without animating width
- The pill is a three-column grid: left (wordmark and three links), the crest in the centre `auto` column, right (three links and buttons). That keeps the crest at the exact centre in both states, so it never moves.
- **Collapsing:**
  - the left and right groups fade out (opacity, .15 s) and slide 8 px toward the centre (transform);
  - the pill's background, border and shadow sit on a separate layer, which shrinks with `clip-path: inset(0 calc(50% - 32px) round 14px)` over .3 s;
  - nothing changes layout, so text can't overlap mid-transition.
- **Expanding** reverses this, with the groups fading in after the background has opened.
- If the clip-path version shows any jank in the throttled trace, the fallback is a crossfade between the full pill and a separate compact pill.
- Hidden parts get `visibility: hidden` after the fade, so they leave the tab order.

### 4.2 Countdown
- Counts to the `site.json` start date.
- Ticks once a second but only touches the digits that change.
- No live region: the container has a fixed `aria-label` ("Conference starts Friday 30 October 2026, 8:00 am").
- After the start it reads "Happening now"; after the end, "See you next year".

### 4.3 Placard intro (Task 4)
- `intro-placards.js` adds placards to an `aria-hidden` layer over the hero. The real `<h1>`, meta line, buttons and countdown are in the HTML from the start; the script hides them only while the intro plays.
- Every step is `element.animate()` on transform and opacity. `will-change` goes on at the start and comes off in each animation's `finish` handler.
- **Skipping:** one `{ once: true, passive: true }` listener each for `pointerdown`, `keydown`, `wheel` and `touchmove`, which calls `finish()` on every running animation. Scrolling is never blocked.
- `sessionStorage` flag (try/catch). With reduced motion the script returns before touching anything.
- See risk R1 and decision D4 for LCP.

### 4.4 Theme reveal
- **Sticky mode** applies only when `(pointer: fine) and (min-width: 981px)`. CSS (`@media`) and JS (`matchMedia`) use the same query string, so they can't disagree.
- In sticky mode it's a 200 vh section with a sticky inner block, and a rAF-throttled scroll handler maps progress to each word's opacity and translate. It reverses when you scroll back up.
- Everywhere else it's a plain section with one IntersectionObserver reveal.
- While `theme.enabled` is false, only the "Conference theme announced soon" band renders and no theme JS loads.

### 4.5 Images
- `@11ty/eleventy-img` HTML transform: avif, webp and jpeg at 400/800/1200/1600, lazy and async by default, `sizes` on every image. The hero image is eager with `fetchpriority="high"`.
- Borrowed committee photos are processed by `npm run media`. If D2 is black and white, sharp converts them at build time, so there's no CSS filter to repaint on hover.
- A missing photo is the navy "Photo TBC" tile; a missing person photo shows initials in a teal ring.

### 4.6 Caching and fingerprints
- eleventy-img already hashes image filenames.
- For CSS and JS, a small build step writes names like `base.3f9a1c.css`, and an `asset` filter maps `/css/base.css` to the hashed URL in templates.
- Modules don't import each other by relative path (a hashed file importing an unhashed one would go stale under `immutable`). The one shared dependency, Lenis, is loaded with a dynamic `import()` whose URL the template passes in.
- `_headers` marks `/css/*`, `/js/*`, `/assets/*` and fonts `immutable`, and HTML `max-age=0, must-revalidate`.

### 4.7 Fonts
- Copy only `montserrat-latin-wght-normal.woff2` and `montserrat-latin-wght-italic.woff2` from `@fontsource-variable/montserrat` into `src/assets/fonts/`.
- Two `@font-face` rules: weights 300 to 900 normal, and 300 italic. `font-display: swap`.
- A size-adjusted Arial fallback keeps layout shift near zero while the font loads.
- Only the normal file is preloaded. The italic one downloads only on the homepage, for "debate.".

### 4.8 Lenis
- Copied from `node_modules/lenis/dist/lenis.mjs` to `/js/vendor/lenis.mjs` at build time.
- Imported only when `(pointer: fine)` matches and reduced motion is off.
- Options: `lerp 0.11, smoothWheel true, wheelMultiplier 0.95`.
- `content-visibility` sections get `contain-intrinsic-size: auto <height>` so the page length doesn't jump under Lenis (an OakMUN gotcha).

---

## 5. Conflicts and gaps

### 5.1 Spec versus OakMUN or the reference frames (I'll handle these; the bigger ones are decisions in section 6)

| # | Conflict | What I'll do |
| --- | --- | --- |
| C1 | Spec 7.4 says the logo circles are in `public/comm_logos_webp/`. That folder holds only `hcc.webp`. The pages use `public/new_logos/<name> (1).png`. | Borrow from `new_logos/`, convert with `npm run media`, list them in `REPLACE_ME.md`. |
| C2 | Borrowed photos and logos exist for 9 of our 12 committees: DISEC, SOCHUM (`unga_sochum`), UNHRC, UNSC, WHO, UNODC, Lok Sabha, JCC (`jcc-1`), IP. ECOSOC, UNEP and UNICEF have none. (OakMUN's "ECOFIN" isn't ECOSOC.) | Those three get the "Photo TBC" tile and a ringed code instead of a logo. SOCHUM's logo (`new_logos/unga-sochum (1).png`) is in the repo even though OakMUN's wheel doesn't use it, so we use it. |
| C3 | Spec 8.2: the dropdown is 320 px. OakMUN's real "Other" menu is the 210 px single-column variant. | About 220 px, single column (three items don't need 320 px). |
| C4 | Spec 8.2: clicking the compact crest expands the nav. OakMUN: hovering it does (desktop only). | Both: hover on fine pointers, click and Enter everywhere. |
| C5 | The spec's overlay gradient is right, but OakMUN also sets `mix-blend-mode: multiply`. | Keep the blend so photos look like `reference/02`. |
| C6 | Spec 3.3 asks for static orbs; OakMUN's drift and use `filter: blur(60px)`. | Static radial gradients, no blur filter. |
| C7 | The IP style guide "Photography" card uses `ip_photography.webp`, which isn't on the allowed list (7.4). | "Journalism" uses the allowed IP committee photo; "Photography" gets a "Photo TBC" tile. |
| C8 | OakMUN uses "→" on buttons, eyebrow lines over every page title, middle-dot meta strings, section numbers, stats strips on Allocations and Resources, and red "To be announced" agenda states. | All dropped (anti-slop rules 2, 3 and 9, the README, and red being reserved for urgent notices). "Agenda TBC" uses the muted teal card. |
| C9 | OakMUN's agenda, guide and doc cards and its countdown use `backdrop-filter`. | No blur anywhere except the desktop nav pill (spec 5). |
| C10 | Some OakMUN buttons use a 135deg gradient or radius 14. | Every primary button is the spec's 180deg pill. |
| C11 | SPEC 9.3's committee hero shows the full name; `reference/14` shows a short descriptor ("Disarmament and security"). | Full name from `committees.json`, as the spec says. |
| C12 | SPEC 9.3's committee hero has a "Committee" label above the code, as in `reference/14`. | The label shows the committee's category ("Council", "Crisis"), which tells the reader more (anti-slop rule 2 gives "Crisis committee" as a label that carries information). Recorded in Task 9. |

### 5.2 Inside the spec

| # | Conflict | What I'll do |
| --- | --- | --- |
| S1 | 8.5 says countdown numbers are white; 3.1 says the number gradient is used on the countdown. | White, as in 8.5 and `reference/02`. The gradient stays on the stat numbers. |
| S2 | 8.5 sets countdown labels at ".62rem minimum" (9.9 px); `CLAUDE.md` sets 11 px as the label minimum. | `.7rem`. `CLAUDE.md` wins. |
| S3 | `nav.register.url` is `"TBC"`. The closing banner hides only when the URL is empty, so a Register link would point at a page called "TBC" and fail `npm run check`. | Empty or "TBC" means not set. Register buttons still show (the draft needs them for review) but aren't links: `aria-disabled="true"` and a "Registration link TBC" tooltip. When a real URL goes in, they become links with no other change. |
| S4 | 9.2's chips are plural ("Councils", "Agencies"); 7.2's categories are singular. | Chip labels map to the singular values. |
| S5 | 9.1's "More ▾" glyph versus rule 8's single icon set. | Lucide `chevron-down`. |
| S6 | "Every placeholder contains TBC" versus fields meant to be empty (`sgLetter.photo`, `eb[].name`, `sponsors`, `nav.secondary.url`). | Empty means "hide it, or show the placeholder tile". Any visible placeholder *text* contains TBC. |
| S7 | "USGs of Technology: Supratiik K., TBC" makes one person's name "TBC". | That card reads "Name TBC" with initials "TBC". |
| S8 | Rule 1 says no em dashes in visible copy; OakMUN's copy is full of them. | None in our copy. Time ranges use "to" ("8:00 to 9:00 am"), because an en dash in a time range is easy to confuse with one. |

---

## 6. Decisions I need from you

| # | Question | Options | My recommendation |
| --- | --- | --- | --- |
| **D1** | **Desktop scale.** OakMUN zooms the whole page to 110% on desktop, so the frames are 10% bigger than the spec's numbers. | (a) Root font size 110% above 768 px: type and rem spacing match the frames, phones unaffected, no `zoom`. (b) Use the spec's numbers as written (desktop looks about 10% smaller than the frames). | **(a)**. It matches what the Secretariat liked, without `zoom`'s bugs. |
| **D2** | **Committee photos: colour or black and white?** The brief says black and white, but OakMUN's tiles are actually colour (DISEC's photo is an archive shot, which made it look black and white). | (a) Black and white plus navy wash everywhere (tiles, guide cards, committee hero). (b) Colour, as OakMUN. | **(a)**. It's what the brief describes, and it makes 9 borrowed photos and 3 "Photo TBC" tiles look like one set. |
| **D3** | **Wheel motion.** The spec says step every 2.2 s and pause on hover, focus or off-screen. OakMUN actually spins continuously and scrolling pushes it (2.2 s is OakMUN's strip shimmer). | (a) Spec: a .6 s eased step every 2.2 s, with pauses. (b) OakMUN's continuous, scroll-linked spin. | **(a)**. Calmer, readable, cheaper, and it can pause. |
| **D4** | **Interim hero image.** No hero photo exists yet, and OakMUN's hero video shows a person (not allowed). Without an image, the largest thing on screen is the title, which the intro hides until about 2 s, so Lighthouse LCP gets worse by about 2 s (R1). | (a) Use OakMUN's generic UNSC chamber photo (allowed under 7.4) in black and white with the navy wash, listed in `REPLACE_ME.md`. (b) Plain navy until you supply a photo. | **(a)** now. Ask for a photo of the MPH or a committee room; an empty room needs no parental consent. |
| **D5** | **Tablet nav (769 to 1249 px).** Six links, crest, wordmark and Register don't fit in one pill below about 1250 px. OakMUN's homepage switches to a menu button there; its other pages squeeze. | (a) 769 to 1249: wordmark, crest, Register and a menu button; full pill from 1250. (b) Full pill down to 769, with smaller gaps. | **(a)**, like OakMUN's homepage. |
| **D6** | **FAQ opening.** OakMUN animates the answer's height (.55 s). The spec allows only transform and opacity. | (a) The panel opens instantly while the answer fades in and slides 8 px, and the + rotates. (b) OakMUN's height slide, as a one-off exception. | **(a)**. It looks nearly the same and stays within the rule. |
| **D7** | **Missing crest.** The compact nav is "just the crest", and the crest is TBC. | (a) A 44 px teal-ringed circle with "XIV" in it, replaced when the crest arrives. (b) The text "JMUN". | **(a)**. A circle is the Oakridge connecting shape (3.3), and it reads as a placeholder. |

---

## 7. Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | **LCP and the intro.** Chrome ignores elements at opacity 0 for LCP. If the title is the largest element, the intro pushes LCP past 2 s on top of load time. | D4 gives the hero a real image as the LCP element. The Task 4 check compares Lighthouse LCP with the intro on and off and reports both. |
| R2 | **Nav fit** between 769 and 1249 px. | D5, then checked with screenshots at 1024 and 1280 in Task 1 (on top of the spec's two sizes). |
| R3 | **Fingerprinted ES modules** can serve a stale import under `immutable` caching. | 4.6: no relative imports; dynamic import from a template-supplied URL. |
| R4 | **Borrowed UN photos and UN/agency emblems.** They're fine for a school MUN draft, but they aren't ours, and the emblems are trademarks. | Everything listed in `REPLACE_ME.md`. OakJMUN's own committee logos replace them when ready. |
| R5 | **Performance numbers from this container aren't a phone.** Traces here use Chromium's 4x CPU throttle on a server CPU. | I'll report frame timing from the throttled trace and suggest one check on a real mid-range Android over mobile data before launch. |
| R6 | **Tight calendar.** It's 1 October and the conference is 30 October. The review draft is planned for two working days. Final content (EB names, agendas, guides, register link) will arrive late. | Everything is data-driven, so late content is a JSON edit (`docs/HOW_TO_UPDATE.md` in Task 10), not a code change. |
| R7 | **Theme reveal** is the only scroll-linked effect, and it's built while hidden (`theme.enabled` is false). | Task 3 screenshots it with the flag turned on temporarily, so it's tested before anyone needs it. |
| R8 | **Social Night on cheap phones** (bats, embers, glow). | No embers on phones, 2 bats, nothing with reduced motion, everything paused off-screen; checked with a throttled trace in Task 7. |

---

## 8. Working in this cloud session

- These tasks run in a Claude Code cloud container, not on your laptop.
- **Tools here:** Node 22, ffmpeg, and a Chromium build matching Playwright 1.56.1. `npm run shots`, `npm run media` and Lighthouse can all run here.
- **Playwright on your laptop:** I'll pin `playwright@1.56.1`. On your laptop, the first `npm run shots` needs `npx playwright install chromium` once; the Task 10 docs will say so.
- **After each task** I'll send the screenshots to you in the app and push to `claude/new-session-smmq0m` on `suprathedude/JMUN-26-Wesbite`. Nothing goes to `main` until you say so.
- **Previews:** Cloudflare Pages builds a preview link for every branch. You can connect the repo after Task 3 and open the draft on your phone without merging anything.

**To approve:** reply "approved" (which takes every recommendation in section 6), or list the decisions you want changed, for example "D2 colour, rest approved". Task 1 starts after that.
