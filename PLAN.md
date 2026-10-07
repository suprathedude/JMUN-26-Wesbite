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
| C13 | SPEC 5 and Task 10 assume Cloudflare Pages (`_headers`, a `*.pages.dev` address, preview links). | Supratiik chose GoDaddy hosting (Task 10). `src/.htaccess` (Apache) and `src/web.config` (Windows) replace `_headers`, and GitHub Actions builds, checks and uploads the site over FTPS (`.github/workflows/deploy.yml`, `scripts/deploy-ftp.sh`). There are no automatic preview links. |

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

### 5.3 Changes from your feedback (2 and 3 October)

These replace the spec where they differ from it.

| # | Change | Notes |
| --- | --- | --- |
| F1 | **Committees:** the conference's 11, in this order: UNSC, DISEC, UNHRC, Lok Sabha, WHO, UNODC, UNCSW, UNICEF, FCC, COPUOS, Doomsday. SOCHUM, ECOSOC, UNEP, JCC and IP are gone. | Without IP, the International Press style guides came off Resources (SPEC 9.6). On 3 October the IP style guides came back (F8) and categories were removed (F7). |
| F2 | **Homepage marquee:** one strip, slower (30 s a loop, was 22 s). The navy strip that ran the other way is gone. | |
| F3 | **Delegates:** 450+. | `site.json` → `stats`. |
| F4 | **Wheel:** turns on its own, about one committee a second, and scrolling turns it further. | This is D3 option (b), OakMUN's motion, in place of the 2.2 s steps. It still stops under the pointer, while a link inside has focus, off screen and in a hidden tab. |
| F5 | **Schedule:** the layout from OakMUN XVI's later site (your first recording). The days are stacked; each has a line down the left that fills teal as you scroll, a dot per event that lights as the fill reaches it, and rows that fade in once. | Replaces SPEC 9.1 item 7's day tabs and colour legend; the type now shows as a word under the title. Times stay "to" (S8). The motion is the "schedule timeline entrance" rule 5 allows. |
| F6 | **Secretariat:** the layout from OakMUN XVI's later site (your second recording). People sit in rows by tier (a new `row` field), with the role above a tall portrait and the name below. With a mouse, the role turns teal, a glow rises, a one-line profile (new `blurb` field) fades in, and a round "View" cursor follows the pointer. | SPEC 9.4's flip stays: the whole portrait is the button. The name moved from the top left of the portrait to below it. The rows fading in and the portraits drifting as you scroll are exceptions to rule 5, made at your request, on this page only. |
| F7 | **No committee categories** (3 October). The filter chips on Committees and Resources, the label on each tile and the label above the code on a committee page are gone; the committee search stays. | Replaces SPEC 9.2's chips and 9.6's filter, and C12. |
| F8 | **International Press** (3 October): IP is a committee again (the 12th), and Resources has an "International Press style guides" section with two separate cards, IP Journalism and IP Photography. | SPEC 9.6's two cards, renamed. The borrowed IP photo is the IP committee's and the IP Journalism card's. |
| F9 | **Secretariat details** (3 October): full names; the three Committee Directors are Chargés d'Affaires; "Director-General" with a hyphen; USGs in the order Logistics, Technology, Policy, Public Relations. Arjun Dhaduvai is the second USG of Technology. | Replaces SPEC section 7.3's short names and S7. |
| F10 | **Content from 3 October:** the full schedule (nine sessions), oakridgejmun.com (canonical links, `sitemap.xml`, `robots.txt`), jmun@oakridge.in, @oakjmun, chapter XIV confirmed, any school's Grades 6 to 8, no position papers, laptops allowed, the New to MUN procedure note removed, Social Night 5:00 to 6:45 pm for registered delegates only, and the photo booth hidden until it's confirmed. | |Question | Options | My recommendation |
| F11 | **Motion across the site** (3 October, "clean animations, not AI slop"): a short crossfade between pages, with the strip and the nav pill staying put (cross-document view transitions); headings rise out of a mask once as they come on screen; each section's text and content fade up as one block, never card by card; pictures that are still downloading fade in; the FAQ and the committee search slide things to their new places instead of jumping. | Transform and opacity only, nothing with reduced motion, one entrance per element. Section blocks follow their heading 90 ms apart; that's the one ordering, not a staggered list. Browsers without cross-document view transitions just load the next page. `src/js/reveal.js`, `faq.js`, `filters.js`; styles at the end of `base.css`. |
| F12 | **Loading screen** for slow connections: the crest, the wordmark and a sweeping bar, shown only if a page hasn't loaded after 0.6 s, gone when it has (or after 12 s whatever happens). | Never seen on a quick connection; never shown without JavaScript. The homepage intro and the entrances wait for it when it's up. |
| F13 | **Also 3 October:** the schedule shows only each event's length, in words ("1 hour 30 minutes"); the footer credit reads "Designed and built by the OakJMUN Technology team" (Srijai Kodali agreed); the preview copy asks its viewer to scroll to the top when a link opens a new page. | The scroll problem was the preview viewer keeping its position. The real site always opened new pages at the top. |
| F14 | **Homepage opening (removed 4 October, see F15)** (3 and 4 October, from your sketch): the hero is the crowd illustration you supplied (people seen from behind holding up country placards, `site.json` → `hero.art`). It opens close in on the placards; scrolling pulls back to show the room, the crowd sinks a little, and the title rises into the space above it, then the dates, buttons and countdown. Scrolling back up reverses it. | Replaces the timed placard intro and the drawn figures tried on 3 October. With reduced motion the picture shows as it is with everything in place. `src/js/intro-placards.js`, "Opening" in `home.css`. |
| F15 | **4 October:** the scroll-driven crowd opening (3 and 4 October) is removed; the hero and the timed placard intro are back as they were. The Secretariat is one even grid of OakMUN-style cards again (no tiers; the `row` and `blurb` fields are gone). Resources: IP's background guide isn't listed (its style guides are), and the four sections are numbered 01 to 04 with a line under each title, as on OakMUN XVI. The "next committee" link is gone from committee pages. A "Get QR" page (`/qr/`, in the More menu) is laid out but not working. The schedule's "Two days, nine committee sessions" line is gone. Committee photos, all 12 logos and the OakJMUN logo (crest and tab icon) supplied. | The middle dots in the Resources lines follow your screenshot (an exception to rule 3). |
| F16 | **4 October, later:** no FAQ answer starts open. The crest is smaller in the nav (30 px), footer (44 px) and loading screen (48 px). Doomsday's photo is cropped lower on its tile and page (`imagePosition` in `committees.json`). The glows in each section drift slowly, like OakMUN's, and hold still while the page scrolls. (A full-page layer of moving lights was tried the same day and removed: it made scrolling lag.) "Get QR" moved out of More to its own button between More and Register (and the phone menu), and the QR page's card now holds the delegate's name, committee, allocation and link, all TBC. | Glows move with `translate` only, pause while scrolling (`html.is-scrolling`, set by nav.js) and stop with reduced motion. The nav pill has no background blur (it's 97% opaque, and the blur was redrawn every frame), and the committee wheel fades its edges through each item's opacity rather than a mask or overlay. Text in `site.json` → `nav.qr` and `qrPage`. |
| F17 | **4 October, last:** the homepage placard intro (placards rising over the hero on a first visit) is removed: its script, layer, styles, `site.json` → `intro.countries` and its screenshot states. The hero shows straight away. Smooth scrolling (Lenis, OakMUN's settings) was switched off for a day of testing and is back as it was. | The placards on New to MUN? and the 404 stay. If the glide feels slow on a fast screen, `lerp` in `src/js/smooth-scroll.js` is the setting (higher settles sooner). |
| F18 | **6 October:** the new schedule (8 committee sessions; Day 2 ends at 5:15 pm; Social Night moves to Day 1, 4:45 to 6:15 pm, everywhere). The schedule shows one day at a time with tabs whose highlight glides across, the day sliding in; "Share timetable" saves both days as one 1080 × 1350 image (share sheet on phones, download on computers). IP has no agenda or EB: its style guides and an IP team section (`press`, `team` in `committees.json`) instead. UNICEF photo added. The Committees header glow fades out below the header instead of being cut at the search bar. The nav collapse uses transform and opacity instead of clip-path. | Without JavaScript both days show one under the other. Tab labels: `schedule.json` → `tab`. |
| F19 | **6 October, gallery intro:** on the first homepage visit of a session the page opens on the 3D photo gallery from your reference video (21st.dev's "3d-gallery-photography", React + Three.js, as you chose). Scrolling flies through it; left idle it keeps drifting without revealing anything; after 2.5 screens the photos fade and rush past while the hero rises in, and scrolling back up reverses it. The nav stays compact and a small "Scroll" cue sits at the bottom while it shows. Later visits in the session start at the hero. | The component is adapted (page scroll drives it instead of capturing the wheel and arrow keys; per-frame updates without React re-renders; refresh-rate independent; pauses when hidden). About 320 KB gzipped, loaded only when the gallery plays: not with reduced motion, not without WebGL. Photos in `site.json` → `gallery`. Later the same day: the announcement bar stays pinned through the gallery and the hero, then slides away with the hero (the nav following); the canvas measures its layout size, not on scroll (it resized mid-scroll during the zoom); the hover wave eases in and doesn't start while scrolling; the photos fly in a balanced pattern, 15 at a time: a centre photo, then mirrored pairs alternating between a middle ring and an outer ring that reaches the screen edges and corners, starting on a balanced view; closer together and a little smaller on portrait screens; photos fade out a little before reaching the camera, so none fills the screen as a large blur. |
| F20 | **6 October, shiny buttons:** Register (nav, phone menu, hero, closing, New to MUN), Explore committees, Get QR (nav and QR page), Open allocation matrix and Share timetable are navy pills with a teal-to-white streak running round the border; on hover or keyboard focus an inner glow breathes and a shimmer sweeps across (after 21st.dev's "shiny-button", in the site's colours). | Plain CSS (`btn--shiny` in components.css, `shine()` in buttons.njk), not the React component: it was only CSS, written for Next.js. The streak turns with `rotate` (composited) instead of animating a gradient angle, which repaints every frame. Still with reduced motion. Later the same day: on the homepage only the nav's Get QR and the hero's Register shine (Explore committees, the closing Register and Share timetable are back to normal there), and the nav and phone-menu Register is the plain teal button on every page, and the shine is fainter and slower (once round every 6 s). |
| F21 | **6 October, committee ring:** "Committees at a glance" has the title, text and button centred on top and a ring of committee cards underneath (21st.dev's "circular-gallery", React, as you chose): each card is the committee's photo with its code and full name and links to its page. The ring turns slowly, scrolling past nudges it, it holds still under the pointer, and keyboard focus turns a card to the front. Replaces the up-and-down wheel. Later the same day: smaller on desktop (front card about 285 px at 1440 px); the mouse wheel over the ring turns it one card per notch instead of scrolling the page, until it has gone all the way round; sliding sideways on phones (or dragging with the mouse) turns it, while up-and-down swipes still scroll. | The component is adapted: its card transform was broken (every card stacked in one place); it turns through refs, not a React re-render per frame; it only animates on screen; Tailwind classes replaced. About 70 KB gzipped, loaded a screen before the section. Without the script or with reduced motion, a plain list of committees. Card photos: `src/_data/committeePhotos.js` (560 px WebP of each committee's photo). |
| F22 | **7 October, Social Night:** the page opens on "SOCIAL / NIGHT" in big letters on the dark page, with the moonlit sky (moon, bats, embers) showing through the letters; scrolling flies the camera into a letter until the sky fills the screen, then the title, date and button appear, with the details and questions below ("Glyph Portal" by Christian Katzmann, MIT, kept as React as you chose). It plays on every visit; "Skip the intro" jumps past it. The bats now fly like bats: erratic darts and turns, banking, quick wingbeats with a faster downstroke and wings half folded on the way up, the odd short glide, drawn in 3D as seen from below. The moon is a detailed rendered image (seas where the real ones are, craters, Tycho's and Copernicus's rays). | The component (`src/components/ui/glyph-portal.tsx`) is adapted: the copy we were given had lost its paired `${…}` (transforms, annotation path, three CSS rules); a "\n" in the word sets it on centred lines (two lines make the letters about twice as big on phones). The island (`src/islands/social-portal.tsx`, about 75 KB gzipped) takes the page's own hero apart, so without JavaScript, with reduced motion, or if it fails, the hero shows as before. The word is `socialNight.json` → `portalWord`. The moon is drawn by `scripts/make-moon.mjs` (no photo hosts were reachable); a photo can replace `src/assets/img/social/moon.webp`. The sky is its own layer while the letters move (frame time in a test went from 67 ms to 17 ms). |
| F23 | **7 October, address:** the site's address is **oakridgejmun.in**; oakridgejmun.com is owned by someone else. | `site.json` → `url`, which sets the canonical links, link previews, `sitemap.xml` and `robots.txt`; `docs/DEPLOY.md` and `docs/REPLACE_ME.md` updated. |
| F24 | **7 October, fixes:** Yashwanth Addala (spelling). The homepage photo intro is 1.9 screens of scrolling instead of 2.5. The committee ring: up-and-down scrolling always scrolls the page; sideways scrolling on a trackpad (or Shift and the wheel) turns it the way a sideways list moves, as do dragging and swiping; the ring is only as wide as itself, so the page either side of it is plain page. "More than debate": the two cards share the width half and half. | `site.json` → `gallery.screens`; the full-turn wheel hold from 6 October is gone. The click animation for committee pages (from your video) waits for the video, which didn't come through. |
| F25 | **7 October, poster colours:** gold accents from the 2026 "We are back" poster, with the backgrounds unchanged and teal still the colour of buttons and links: small labels, footer headings, card tags and edges, title bars and hairlines in the poster's gold; a thin tilted gold frame and two faint blue laurel branches in the homepage hero; a gold frame corner and a laurel in each page header; a gold corner on the closing banner and committee pages; a small gold sprig and lines in the footer. Registration is open: the Register buttons, the top bar and the FAQ link to the registration page on oakridge.in. The conference email is j.mun@oakridge.in. | Colours: `--gilt` and `--laurel` in `tokens.css`; decorations in `partials/gilt.njk`, styles under "Gold accents" in `components.css`. The poster's tagline isn't used (SPEC 4.1). |
| F26 | **7 October, committee pages and polish:** opening a committee from the Committees page grows its tile into the committee page's header while the other tiles fade away, and going back shrinks it into its tile again (from your OakMUN recording, smoother: one continuous move instead of a cut to black). Not Doomsday, which is getting its own. The homepage hero's gold frame stays inside the hero, with its lines crossing at the corners; Delegates and Chapter are in gold; the Social Night card has the rendered moon rising out of its top corner; the closing banner has two plain gold lines; the IP Photography photo is black and white. | Cross-document view transitions with a shared name per committee (`committee-<slug>` on the tile's picture and the page header; styles at the end of `committees.css`). Chrome, Edge and Safari 18.2+; other browsers load the page as before, and reduced motion turns it off. The Committees grid and the committee header photo no longer fade in on load, so the move has something to land on. The IP Photography photo was converted in place (the colour original is in the git history). |
| F27 | **7 October:** the "View committee" pill that followed the pointer over the committee tiles is gone. The closing banner's gold lines are two straight lines across its top corners, where you drew them. | `filters.js` no longer has the pill; the lines are `cuts()` in `partials/gilt.njk`. |
| F28 | **7 October, Doomsday:** the Doomsday page opens on the Marvel Studios intro, full-screen; then "Oakridge JMUN presents" and DOOMSDAY flickering on in green. Scrolling down, Doom's clip plays (his hand crackling with green, the hooded close-up, Doom with his robots) and "Welcome to my lair." types out as he faces the camera; scrolling back up resets it. Skip, a scroll, a tap or a key ends the intro; coming back from another page skips it. Approved from a separate preview first. | Footage from Toshit Sai's fan project, at your request (see `docs/REPLACE_ME.md` for what it is and how to remove it). `committees.json` → Doomsday → `cinematic.line`; `partials/doomsday.njk`, `src/js/doomsday.js`, styles at the end of `committees.css`, titles in Anton (self-hosted, only on that page). About 3 MB of video, downloaded only when it plays; a taller cut on phones. With reduced motion or no script: the logo's last frame behind the title, and Doom's last frame with his line. |
| F29 | **7 October, conference theme:** "Bridge the Divide, Let the Truth Guide" is on the homepage, with the reveal from your OakMUN recording. On desktop, scrolling brings up "Presenting the conference theme", which sharpens in and dissolves; the theme then arrives word by word, each word blurred first and settling sharp as it rises (Bridge and Guide in teal), then the gold line and a short caption. Phones get the same word-by-word entrance once as it comes into view. The footer's Theme line shows it too. | `site.json` → `theme` (`lines`, `highlight`, `caption`; the caption is a draft). The blur is a fixed filter on each word's blurred copy (CSS, from `data-text`, so the page text has each word once); only opacity and transform change. 240 vh on desktop. |
| F17 | **4 October, smooth scrolling off:** Lenis is removed, so pages scroll natively everywhere. A Chrome trace from your Windows laptop (144 Hz screen, viewed in the Claude preview) showed half the frames going out without the page having moved: Lenis moves the page from the main thread every frame, which shares time with everything else on the page, and it eases behind the wheel by design. Native scrolling runs on its own thread and stops when the wheel stops. | Overrides SPEC 5 and the OakMUN setting (lerp 0.11). Anchor links still land below the nav through `scroll-padding-top`. |

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
