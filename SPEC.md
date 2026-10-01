# OakJMUN 2026 website: full build spec

This is the complete brief. `CLAUDE.md` holds the short rules that apply every session; this file holds everything else. Work through the tasks in section 12 one at a time. Each task ends with a "done when" check and the verification loop in section 13.

---

## 1. Context

- **Event:** Oakridge Junior Model United Nations (OakJMUN) 2026, Chapter XIV (TBC). Friday 30 and Saturday 31 October 2026, Oakridge International School, Gachibowli, Hyderabad.
- **Audience:** about 350 delegates in Grades 6 to 8 from around five schools. Every Grade 6 delegate is a first-timer. Parents and faculty advisors also read the site. Many visitors use a parent's phone on mobile data.
- **Owner:** Supratiik, USG of Technology. He has permission to reuse the Oakridge MUN XVI website's code and design.
- **Goal:** a reviewable draft the Secretariat can open on their phones within two days, built properly enough to become the real site.
- **Out of scope for this version:** QR codes, any database, sign-up forms, server functions, payments.

## 2. The site we're matching

The Secretariat loves the Oakridge MUN XVI site (`https://github.com/srijai-k/FINAL-OAKMUN`, MIT licence, live at oakridgemun.in). We copy its look, feel and section structure, give it OakJMUN's content, and rebuild the code properly.

**Reading it efficiently.** The repo is about 600 MB because `node_modules` was committed and every photo is stored twice. Use a subagent to study it so the file reads don't fill this session's context:

```bash
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/srijai-k/FINAL-OAKMUN.git oakmun-src
cd oakmun-src
git sparse-checkout init --no-cone
printf '/*.html\n' > .git/info/sparse-checkout
git checkout main
```

Every page is a single HTML file with all its CSS and JS inline. `index.html` is about 196 KB. Pull only the specific images you need later (section 7.4).

**What it does well (keep):** deep navy palette with teal light, big heavy Montserrat headings, the floating pill nav, glass countdown tiles, teal marquee, gradient stat tiles, the schedule timeline, the "Committees at a glance" wheel, photo committee cards, Secretariat flip cards, and big confident page titles.

**What it does badly (fix):**
- The nav, footer and all CSS are copied into all 13 pages, so the authors needed Python scripts to patch the same change into every file.
- Content is hard-coded in HTML.
- The homepage intro hijacks the scroll wheel to drive an animation.
- Some labels are as small as 6 px (`.4rem`).
- Frosted-glass blur is used heavily.
- It loads Lenis from unpkg at runtime.
- Body text uses warm white at very low opacity (.42), which is hard to read.

**Reference screenshots** are in `reference/`; `reference/README.md` explains each one. They're frames from a screen recording at about 1918 px wide. Match the look, not the exact pixels.

## 3. Design system

### 3.1 Colour

The main colour is **OakMUN navy `#003057`**. Most of the site is this navy and the darker shades OakMUN uses around it. Supratiik doesn't want strict brand-guide limits everywhere, so other colours are allowed where they serve a purpose (the schedule legend, Social Night, the beginner's guide), but navy always dominates.

Put these in `src/css/tokens.css` as custom properties. The hex values are taken from OakMUN's CSS.

**Blue ramp (OakMUN's own shades, darkest to lightest)**

| Token | Hex | Where OakMUN uses it |
| --- | --- | --- |
| `--blue-950` | `#03080F` | hero ground, sponsors |
| `--blue-940` | `#020C1A` | theme section |
| `--blue-900` | `#001223` | stats, "More than debate", footer |
| `--blue-850` | `#001A35` | closing banner gradient middle |
| `--blue-800` | `#001E3C` | schedule gradient top, Secretariat card back |
| `--blue-750` | `#002548` | schedule gradient bottom |
| `--blue-700` | `#003057` | **main navy**: page bodies, letter, committees, FAQ |
| `--blue-650` | `#003566` | Secretariat card back highlight |
| `--blue-600` | `#003D6E` | chip and input fill |
| `--blue-500` | `#1A5A90` | chip and input border |

**Teal light**
- `--teal` `#30CDD7` (accents, active states, highlighted words)
- `--teal-dark` `#1E96A5`
- `--teal-light` `#B4EBF5`
- `--teal-marquee` `#27B0BD`

**Text**
- Base text colour `--ink` `#FAF5ED` (OakMUN's warm white).
- Use opacity steps: headings 1.0, lead text .85, body .75, secondary .6, captions .5.
- Never go below .5 for anything people need to read. OakMUN goes down to .38 to .42, which fails contrast on navy.

**Accents (used sparingly, mainly as the schedule legend)**

| Token | Hex | Use |
| --- | --- | --- |
| `--gold` | `#E1AA28` | ceremonies |
| `--sand` | `#BC9A6E` | meals |
| `--yellow` | `#FFCB00` | |
| `--peach` | `#F0B4A0` | |
| `--red` | `#FF3750` | urgent notices only |

**Primary button gradient:** `linear-gradient(180deg, #30CDD7 0%, #1E96A5 100%)` with navy `#003057` text. Never white text on teal.

**Number gradient:** `linear-gradient(135deg, #30CDD7 0%, #B4EBF5 55%, #30CDD7 100%)` clipped to text. Used only on the stat numbers and the countdown.

**Overlays on photos and video:** `linear-gradient(135deg, rgba(0,48,87,.72) 0%, rgba(30,150,165,.45) 50%, rgba(0,20,40,.78) 100%)`.

**Social Night palette** (section 9.8). Start from OakMUN's own Social Night card:
- browns `#2E1400` → `#1C0A00` → `#0F0500`
- gold `#FFD700`, amber `#E8A020`, cream text `#FFF0A0`

Add, for Halloween:
- pumpkin `#FF7A1A`
- night sky `--blue-900`
- moon `#FAF5ED` with a soft gold glow

Purple is allowed only as a faint haze, never as a fill.

### 3.2 Type

- **Montserrat everywhere**, as OakMUN does. Self-host it with `@fontsource-variable/montserrat` (Latin subset only, weights 400 to 900, plus 300 italic for the one italic word in "More than debate"). Preload the woff2. No Google Fonts request at runtime.

| Role | Size | Weight | Tracking | Line-height | Notes |
| --- | --- | --- | --- | --- | --- |
| Hero title | `clamp(2.6rem, 5.5vw, 5.5rem)` | 900 | -0.04em | .88 | Uppercase |
| Page title (Committees, Resources, FAQ) | `clamp(3rem, 9vw, 7.5rem)` | 900 | -0.04em | 1 | |
| Section title | `clamp(2.2rem, 4vw, 3.6rem)` | 800 | -0.03em | 1.05 | Optional short teal bar under it: 44 × 3 px, gradient teal → transparent |
| Wheel names | `clamp(2rem, 4vw, 3.4rem)` | 800 | -0.04em | | |
| Card title | `clamp(1.05rem, 1.8vw, 1.3rem)` | 800 | -0.02em | | |
| Body | 1rem to 1.05rem (16 px minimum on phones) | 400 | | 1.7 | Max 68 characters per line |
| Label / eyebrow | .72rem (11.5 px minimum) | 700 | .18em to .28em | | Uppercase |
| Nav link | .7rem | 700 | .1em | | Uppercase; ink .55 → 1.0 on hover or active |
| Button | .78rem | 800 | .08em | | Uppercase |

### 3.3 Shape, depth and light

**Radii**
- `999px` for pills: buttons, chips, search, nav.
- `16px` for cards.
- `24px` for committee photo tiles.
- `12px` for nav buttons and timeline events.
- `9px` for countdown tiles.
- `50%` for circles.

**Borders:** 1px.
- `rgba(250,245,237,.07)` on dark glass.
- `rgba(48,205,215,.12)` resting on cards.
- `rgba(48,205,215,.35)` on hover.

**Shadows**
- Primary button: `0 8px 24px rgba(48,205,215,.25)` resting, `0 14px 32px rgba(48,205,215,.45)` on hover.
- Nav: `0 8px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(250,245,237,.04)`.
- Card hover: `0 16px 48px rgba(0,0,0,.4)`.

**Ambient glows ("orbs").** OakMUN's signature light: soft radial circles of teal, dark teal or deeper navy at 10 to 35% alpha behind section content.
- Use at most two per section, placed behind the section's focal element.
- They're static. No drifting.
- They're circles on purpose: circles are the Oakridge brand's connecting shape.

**Hero texture:** dot grid, `radial-gradient(circle, rgba(48,205,215,.055) 1px, transparent 1px)`, about 28 px apart.

**Chapter watermark:** a huge faint outlined "XIV" behind the hero title, as OakMUN does with "XVI". Opacity about .15.

### 3.4 Motion

- **Easing tokens:**
  - `--ease-standard: cubic-bezier(0.4,0,0.2,1)` (most UI)
  - `--ease-snap: cubic-bezier(.2,.9,.3,1)` (buttons, .18s)
  - `--ease-out-expo: cubic-bezier(0.16,1,0.3,1)` (entrances)
- **Durations:** hover .18s to .25s, open and close .3s, entrances .5s to .7s.
- **Only `transform` and `opacity`.** No animating `filter: blur`, `box-shadow`, `width` or `height` on large elements. Hover shadows may change on small elements such as buttons.
- **One orchestrated moment per page.** On the homepage it's the placard intro. Elsewhere, motion only answers what the visitor does (opening, flipping, filtering) or quietly confirms content arriving. See section 4.
- **Pause what can't be seen:** `IntersectionObserver` stops marquees, the committees wheel and Social Night particles when they're off-screen. `document.visibilitychange` stops them when the tab is hidden.
- **`prefers-reduced-motion: reduce`:** no intro, no marquee movement, no wheel auto-advance, no particles, instant reveals.

### 3.5 Layout

- **Content max width:** 1200 px. Text columns max 680 px.
- **Side gutters:** 56 px on desktop, 24 px on tablet, 20 px on phone.
- **Breakpoints:** 1250, 980, 768 and 480 px, following OakMUN.
- **Section padding:** 120 px top and bottom on desktop, 72 px on phones.
- **Alignment:** left by default. The home hero, the theme reveal and the Committees and Secretariat page titles are centred, as in OakMUN.
- **No sideways scrolling** at any width from 360 px up.

## 4. Anti-slop rules (keep the OakMUN look, drop the generic AI look)

OakMUN already uses a few moves that read as generic when overused. Keep them where they define the look, and stop them spreading.

1. **Copy is specific to OakJMUN.**
   - Don't invent slogans, triads ("Create. Debate. Innovate."), or taglines like "Your voice, your resolution."
   - Don't use these words: unlock, elevate, empower, journey, seamless, world-class, cutting-edge, unique, dedicated, showcase, inspire, delve, vibrant.
   - No lorem ipsum. Write real, plain placeholder copy marked TBC.
   - Write the way a friendly Secretariat member would talk to an 11-year-old and their parent.
2. **Eyebrow labels only when they carry information.** "Day 1, Friday 30 October" or "Crisis committee" are fine. "Oakridge JMUN · Chapter XIV" above every heading isn't. At most one per section.
3. **Middle-dot strings ("A · B · C")** appear in only three places: the home hero meta line, the Social Night meta line and the footer.
4. **Teal-highlighted words** only where the highlighted word is a name: "Oakridge **JMUN**", "Meet the **Secretariat**", "Committee **Allocations**". Never a random emotive word.
5. **Motion:**
   - Allowed: the placard intro, the stat count-up (once), the schedule timeline entrance, the committees wheel, the marquee, and the theme reveal.
   - Not allowed: fade-up on every card, staggered list entrances, floating blobs, parallax on every section.
6. **Not everything is a card.** Cards are for repeated items (committees, people, guides, FAQs). The SG letter, page intros and the beginner's guide steps aren't cards. Vary spacing to show hierarchy rather than giving every block identical padding.
7. **Gradients only from section 3.1.** No purple-to-blue or rainbow gradients anywhere.
8. **Icons:** one keyline set ([Lucide](https://lucide.dev), inline SVG, 1.5 px stroke, `currentColor`). No emoji as icons.
9. **Arrows:** `↗` only on links that leave the site or open a PDF. No `→` stuck onto button labels.
10. **Images:** only real Oakridge/OakJMUN photos, or the borrowed placeholders listed in `docs/REPLACE_ME.md`.
    - No AI-generated people.
    - No stock "students smiling at laptops".
    - A missing photo is a neutral navy tile with a small label ("Photo TBC") or initials.
11. **No made-up numbers, quotes or testimonials.** Stats come only from `site.json`.
12. **One bold idea:** the placard motif. It appears in the hero intro, the 404 page and the New to MUN page. Everything else stays disciplined OakMUN.

## 5. Speed rules

**Targets (check with Lighthouse in mobile mode)**
- Performance 90 or above (85 at the very least).
- LCP under 2.5 s, CLS under 0.1, INP under 200 ms.
- Homepage under 1.5 MB transferred before any video. No JS file over 30 KB minified, except vendored Lenis.

**Images**
- Use `@11ty/eleventy-img` with the HTML transform plugin: formats `avif`, `webp`, `jpeg`; widths matched to display size (for example 400, 800, 1200, 1600). `loading="lazy"` and `decoding="async"` by default; `sizes` set.
- The hero image is the exception: eager, with `fetchpriority="high"`.

**Hero video (when Supratiik supplies one)**
- The poster image is the LCP element and paints at once.
- Video: `<video muted loop playsinline preload="none" poster>`, started only after `load`, and only when it's on screen.
- Encode AV1 (WebM) first, H.264 MP4 as fallback, 720p, 20 seconds or less, under 6 MB, `-movflags +faststart`.
- `scripts/optimize-media.mjs` does the encoding with ffmpeg. If ffmpeg isn't installed, it skips video with a clear message saying how to install it, and still optimises images.
- Skip the video entirely (poster only) when any of these are true: screen width under 768 px, `navigator.connection.saveData` is true, or reduced motion is on.

**Files and caching**
- No file over 25 MiB (Cloudflare Pages' limit) and fewer than 20,000 files.
- A `_headers` file gives fingerprinted CSS, JS, fonts and images `Cache-Control: public, max-age=31536000, immutable`, and HTML `max-age=0, must-revalidate`.

**Blur:** `backdrop-filter` only on the nav pill and only on screens wider than 768 px. Phones get a solid fallback colour. OakMUN already does this on phones; keep it.

**Sections and CSS**
- `content-visibility: auto` with `contain-intrinsic-size` on heavy below-the-fold sections (committees wheel, FAQ, sponsors).
- One shared stylesheet, plus a small page stylesheet only where a page needs it. Critical hero CSS can be inlined.

**JS**
- ES modules with `type="module"`, all deferred.
- Lenis (`npm i lenis`) copied into `src/js/vendor/` at build time and loaded only when `(pointer: fine)` matches and reduced motion is off. Settings: `lerp: 0.11`, `smoothWheel: true`, `wheelMultiplier: 0.95` (OakMUN's values).

## 6. Accessibility

- Keyboard: every control is reachable and has a visible focus ring (2 px teal outline, 3 px offset). The skip link goes to `<main>`.
- The nav dropdown and mobile menu work with keyboard and close with Escape. The mobile menu traps focus while open.
- FAQ items are `<button aria-expanded>`. Schedule tabs use the ARIA tabs pattern. Secretariat card flips are buttons with `aria-pressed`, and the back face's text is readable by screen readers.
- Colour contrast meets WCAG AA for all text over navy.
- The countdown has an `aria-label` with the date, and doesn't announce every second.
- The placard intro is `aria-hidden` and skippable. The real headline is in the HTML from the start.

## 7. Content model

Everything changeable lives in `src/_data/`. Placeholders contain "TBC". Use these files and fields (rename only with a good reason).

### 7.1 `site.json`

- **Conference:** name "Oakridge JMUN", chapter "XIV" (TBC), year 2026, start date `2026-10-30T08:00:00+05:30`, end date 31 October, venue "Oakridge International School, Gachibowli, Hyderabad".
- **`announcement`:** `{ "enabled": true, "text": "Registration opens soon (TBC)", "link": "" }`
- **`nav.register`:** `{ "label": "Register", "url": "TBC" }`
- **`nav.secondary`:** `{ "label": "Consent form", "url": "" }` (hidden when the URL is empty)
- **`stats`:** delegates "350+", committees (counted from `committees.json`), days 2, chapter "XIV".
- **`theme`:** `{ "enabled": false, "words": ["TBC"], "highlight": 1, "caption": "TBC" }`. When disabled, the theme section shows a small "Conference theme announced soon" band instead of the full reveal.
- **`sgLetter`:** `{ "name": "Vihaan T.", "role": "Secretary-General", "photo": "", "signature": "", "paragraphs": ["Placeholder letter from the Secretary-General (TBC)."] }`. Don't write the letter in Vihaan's voice.
- **`contact`:** `{ "email": "TBC", "instagram": "" }`
- **`sponsors`:** `[]`
- **`allocations`:** `{ "rounds": [{ "name": "Round 1", "date": "TBC", "note": "TBC" }], "matrixUrl": "", "status": "Registration opens soon (TBC)" }`
- **`intro.countries`:** about 24 country names for the placard intro (section 10). Placeholder list for now: India, France, Japan, Brazil, Kenya, Germany, Canada, Egypt, Mexico, Norway, Chile, Ghana, Italy, Peru, Spain, Nepal, Qatar, Fiji, China, Sweden, Cuba, Ireland, Oman, Greece. Short names fit the placard; long ones (for example "United Kingdom") step down a size.

### 7.2 `committees.json`

An array of committees:

```json
{
  "slug": "disec",
  "code": "DISEC",
  "name": "Disarmament and International Security Committee",
  "category": "General Assembly",
  "agenda": "Agenda TBC",
  "overview": "Short plain-English description, two sentences, TBC.",
  "image": "assets/img/committees/disec.jpg",
  "guide": { "status": "coming-soon", "file": "" },
  "eb": [
    { "role": "Chair", "name": "", "photo": "", "bio": "" },
    { "role": "Vice Chair", "name": "", "photo": "", "bio": "" },
    { "role": "Rapporteur", "name": "", "photo": "", "bio": "" }
  ]
}
```

**Placeholder list**

| Code | Name | Category |
| --- | --- | --- |
| DISEC | Disarmament and International Security Committee | General Assembly |
| SOCHUM | Social, Humanitarian and Cultural Committee | General Assembly |
| ECOSOC | Economic and Social Council | Council |
| UNHRC | United Nations Human Rights Council | Council |
| UNSC | United Nations Security Council | Council |
| WHO | World Health Organization | Agency |
| UNEP | United Nations Environment Programme | Agency |
| UNICEF | United Nations Children's Fund | Agency |
| UNODC | United Nations Office on Drugs and Crime | Agency |
| Lok Sabha | Lok Sabha (Indian Parliament) | Assembly |
| JCC | Joint Crisis Committee | Crisis |
| IP | International Press | Press |

### 7.3 Other data files

**`secretariat.json`:** an array of `{ "name", "role", "group", "photo", "instagram" }`. Names exactly as written, photos TBC:

| Role | People |
| --- | --- |
| Secretary-General | Vihaan T. |
| Deputy Secretary-General | Aryan N. |
| Director General | Raaghav M. |
| Committee Directors | Riddha, Akshay S., Janya R. |
| USGs of Policy | Yuvan, Krishiv |
| USGs of Logistics | Prateek, Yashwanth |
| USGs of Public Relations | Aadya, Aishani |
| USGs of Technology | Supratiik K., TBC |

**`schedule.json`:** days, each with events `{ "start": "8:00 am", "end": "9:00 am", "title", "type": "committee|ceremony|social|meal|break|end" }`. Every time is TBC.

| Day | Events |
| --- | --- |
| Day 1, Friday 30 October | Registration; Opening ceremony; Break; Committee session 1; Lunch; Committee session 2; Dispersal |
| Day 2, Saturday 31 October | Committee session 3; Break; Committee session 4; Lunch; Closing ceremony; Social Night (MPH); Dispersal |

The order of Social Night and the closing ceremony is TBC.

**`faq.json`:** questions and answers. Answers are short, and anything uncertain says TBC.
- Who can take part? (Grades 6 to 8 from Oakridge and invited schools.)
- I've never done MUN. Is that okay? (Yes; link to New to MUN.)
- How do I register? (TBC)
- How are committees and countries given out? (Allocation rounds; link to Allocations.)
- Can I bring my phone or laptop? (Yes, but phones are limited during committee sessions.)
- What's the dress code? (TBC)
- Are there awards? (Best Delegate, Outstanding Delegate, Honourable Mention and Verbal Mention. Chairs decide.)
- Will I get a certificate? (Every delegate gets one.)
- Who do I contact? (Email TBC.)

**`resources.json`:**
- **Documents:** Rules of Procedure, Delegation Guidelines, Consent Form. All TBC.
- **IP style guides:** Journalism, Photography (TBC).
- **Research links, taken from OakMUN's list:**
  - UN official site
  - UN Research Guides
  - UN Digital Library
  - UN News
  - UN Treaty Collection
  - International Law and Justice

**`socialNight.json`:** date, place "MPH", time TBC, dress code "Costumes TBC", photo booth teaser text, and a short FAQ.

### 7.4 Borrowed placeholder assets

Allowed from OakMUN, listed in `docs/REPLACE_ME.md`:
- The generic committee header photos in `public/committee_photos/` (the UN-room images), for the committees that exist in both lists.
- The committee logo circles in `public/comm_logos_webp/`.

Not allowed: any photo of an OakMUN student, EB member or Secretariat member, the OakMUN crest, `xvi.svg`, and `logo.png`.

The OakJMUN crest and the Oakridge school logo are TBC. Until then, use a text wordmark: "OAKRIDGE" in ink, "JMUN" in teal, 800 weight, .14em tracking.

## 8. Components

### 8.1 Announcement strip
- Full-width teal (`--teal` to `--teal-dark` gradient) bar above the nav.
- Navy text: .72rem, 800 weight, .2em tracking, uppercase.
- A close button. The dismissal is remembered in `sessionStorage`, with try/catch so a blocked storage call doesn't break it.
- Content comes from `site.json`; the strip is hidden when disabled.

### 8.2 Nav (copy OakMUN's behaviour exactly; see `reference/02` and `reference/03`)

**The pill**
- Fixed, centred floating pill 16 px from the top.
- Background `rgba(1,3,8,.97)`, with `backdrop-filter: blur(24px)` on desktop only.
- Radius 999 px, 1 px border `rgba(250,245,237,.07)`, padding 8 px 10 px, nav shadow from 3.3.

**Order inside the pill**
1. Wordmark.
2. Left links: Committees, Secretariat, Allocations.
3. Centre crest slot: 44 px, teal `drop-shadow` glow that strengthens on hover.
4. Right links: Schedule, Resources, More ▾.
5. Optional outlined secondary button (radius 12 px, teal border at .35).
6. Primary Register button (radius 12 px, teal gradient, navy text).

**"More" dropdown**
- 320 px wide, background `rgba(3,10,22,.97)`, radius 16 px, teal border at .15.
- Items: Social Night, New to MUN?, FAQ.
- It opens on hover and focus, and closes with a .55 s delay so it doesn't flicker when the pointer crosses the gap.

**Scroll behaviour**
- Scrolling down past 80 px adds `.scrolled`: links, wordmark and buttons collapse, leaving a compact pill with just the crest (see `reference/03`).
- Scrolling up restores the full pill.
- Clicking the compact crest also restores it.

**Mobile (768 px and below)**
- Wordmark and a menu button only.
- The menu opens a full-screen sheet on `rgba(1,3,8,.99)` with large links and the Register button at the bottom.

**Active page:** the current page's link shows in full ink.

### 8.3 Buttons
- **Primary:** pill, padding 13 px 26 px, primary gradient, navy text, button shadow. On hover it lifts 3 px with the stronger shadow and `filter: brightness(1.05)`.
- **Ghost:** pill, transparent, 1 px border at ink .14, ink .8 text. On hover: teal border and teal text.
- **Labels say what happens:** "Register", "Explore committees", "Open background guide ↗".

### 8.4 Chips and search (committees and resources filters)
- Chips: pill, background `--blue-600`, border `--blue-500`, .7rem, 700 weight, .1em tracking, uppercase.
- Active chip: teal fill, navy text, `0 4px 16px rgba(48,205,215,.3)`.
- Search: the same pill styling with a search icon, 16 px text on phones (stops iOS zooming in).

### 8.5 Countdown
- Four tiles: days, hours, minutes, seconds.
- Each tile is 9 px radius, `rgba(255,255,255,.1)` fill, an inset highlight and a soft drop shadow.
- Numbers: 800 weight, white. Labels: teal at .7, .62rem minimum.
- Counts to `site.json` start date. After it starts, it shows "Happening now"; after the end date, "See you next year".

### 8.6 Cards
- **Committee tile:** square, radius 24 px, photo with navy overlay, the code centred (900 weight, white; size steps down for long codes), category label at top, full name under the tile.
  - Hover, on fine pointers only: lift 13 px, rotate -1.8°, scale 1.055, teal ring `0 0 0 1.5px rgba(48,205,215,.45)`, photo zoom 1.08.
- **Item card ("More than debate", guides, documents):** background `rgba(0,30,60,.65)`, teal border at .12, radius 16 px, a short 28 px accent bar that grows to 44 px on hover, a lift of 4 px.
- **EB card:** photo, role label in teal, name, a two-line bio clamp and "Read more".

## 9. Pages

### 9.1 Home (`/`): sections in this order

1. **Announcement strip** (8.1).
2. **Hero:** full viewport height, minimum 640 px (`reference/02`).
   - **Background stack:** `--blue-950`, then the poster image or video with the overlay from 3.1, then the dot grid, two orbs and the "XIV" watermark.
   - **Content, centred:**
     - a meta line with short teal rules on each side: "Chapter XIV · 30 and 31 October 2026 · Hyderabad";
     - the title "OAKRIDGE" in ink with "JMUN" in teal below it;
     - the Register (primary) and Explore committees (ghost) buttons;
     - the countdown.
   - **No notice cards on the right.** OakMUN has a stack of them; we've removed it.
   - The intro animation in section 10 plays over this.
3. **Committee marquee:** teal strip (`--teal-marquee`), navy uppercase committee codes separated by small navy dots, scrolling left. A second, slower navy strip scrolls right just below it (`reference/05`).
4. **Theme:** OakMUN's sticky reveal (`reference/03`, `reference/04`), shortened to about 200 vh on desktop. Words appear one after another with opacity and a small translate. No blur animation. The highlighted word gets the teal-to-light-teal text gradient. On phones it's a normal section with a simple one-time reveal. When `theme.enabled` is false, show only the "announced soon" band.
5. **Stats:** four gradient tiles (`#0A2040` → `#061628` → `#030E1A`, 145°), each with one small teal glow. Numbers count up once on first view (`reference/05`).
6. **Letter from the Secretary-General:** a 3:4 photo slot on the left with a thin teal border, the letter text on the right, a signature slot, and a "Meet the Secretariat" link (`reference/06`).
7. **Schedule** (`reference/07`):
   - section background gradient `--blue-800` → `--blue-750`;
   - day tabs as pills (active one uses the primary gradient);
   - a legend of type dots: committee teal, ceremony gold, social dark teal, meal sand, break light teal;
   - a vertical timeline: a time column (range plus duration) on the left, a thin teal line with dots, and event rows tinted by type at .07 to .13 alpha with a 3 px left accent bar;
   - a huge faint day number ("01") behind;
   - phones get compact stacked rows.
8. **Committees at a glance** (`reference/08`):
   - left: section title, two plain sentences, and an "Explore committees" button;
   - right: OakMUN's vertical wheel of committee names, each with a 76 px circle icon, the centred item in full ink and the others fading, navy fades top and bottom, and a faint crest watermark;
   - it advances on its own every 2.2 s and pauses on hover, focus or when off-screen;
   - with reduced motion it's a static list.
9. **More than debate** (`reference/10`):
   - background `--blue-900`;
   - the heading "More than" with "debate." in light italic at ink .5;
   - two item cards: Social Night (in its Halloween palette, a small moon and the tag "Day 2, Saturday 31 October") and New to MUN? (navy, tag "For first-timers").
10. **FAQ** (`reference/09`): a huge "FAQ" heading, a one-line intro, and the accordion. Each item has radius 16 px; the + icon rotates 45° and fills teal when open.
11. **Closing banner:** gradient `--blue-900` → `--blue-850` → `--blue-900`, a centred one-line invitation ("Your first committee starts on 30 October.") and the Register button. Hidden if `nav.register.url` is empty.
12. **Sponsors:** only rendered when `sponsors` isn't empty (`reference/11`).
13. **Footer** (`reference/11`):
   - background `--blue-900`, a top hairline gradient (transparent → teal .3 → transparent);
   - four columns: brand (crest slot and two-line wordmark, a one-sentence description), quick links, contact (email TBC, location), event details (dates, venue, theme);
   - a bottom row: "© 2026 Oakridge International School" on the left; "Design based on the Oakridge MUN XVI website by Srijai Kodali" on the right;
   - phones: a single column.

### 9.2 Committees (`/committees/`)

`reference/12`, `reference/13`.
- The page title "Committees" (900 weight, centred) and one plain sentence, for example "Twelve committees, one weekend. Find yours." The number comes from the data.
- The filter row: All, General Assembly, Councils, Agencies, Assembly, Crisis, Press, plus search. Filtering is instant and client-side, and the result count is announced to screen readers.
- The tile grid: three columns on desktop, two on tablet, two on large phones and one below 400 px.

### 9.3 Committee page (`/committees/<slug>/`)

Generated with Eleventy pagination over `committees.json`. No server function. `reference/14`, `reference/15`.
- **Back link:** pill "Back to committees".
- **Hero card:** a black-and-white committee photo with a navy wash, a "Committee" label, the huge code, and the full name.
- **Overview:** the title "<Code> overview" on the left, two to three sentences on the right.
- **Agenda card:** teal border, "Committee agenda" label, a number, and the agenda text. "Agenda TBC" until it's released.
- **Background guide card:**
  - status "Coming soon" (muted) or "Available" (teal), plus "Open background guide ↗" to the PDF;
  - PDFs live in `src/assets/docs/guides/`.
- **EB:** three cards. If a role's name is empty, the card reads "EB announced soon".
- **Next committee:** a link at the bottom.

### 9.4 Secretariat (`/secretariat/`)

`reference/16` to `reference/18`.
- **Title:** "Meet the" in ink, "Secretariat" in teal, centred, plus one plain line.
- **Grid:** three columns of 4:5 cards, radius 16 px.
- **Front of each card:**
  - the photo, or a placeholder: navy-to-blue-650 gradient with large initials in a teal ring;
  - name in uppercase 900 weight, top left;
  - role underneath;
  - signature slot bottom right.
- **Flipping:** a small "Flip" button flips the card (`rotateY(180deg)`, .65 s, `--ease-standard`).
- **Back of each card:** gradient `--blue-800` → `#002D52` → `--blue-650`, with name, role, and an Instagram button when a handle exists.
- **Groups:** top six first, then the USGs, ordered as in `secretariat.json`.

### 9.5 Allocations (`/allocations/`)

`reference/19`, `reference/20`.
- **Title:** "Committee" in ink, "Allocations." in teal, left-aligned and huge.
- **Text:** one paragraph on how allocations work, then the rounds list with teal dots and a status pill.
- **Matrix card:** centred, with an icon, the title "Allocation matrix", one sentence and the "Open allocation matrix ↗" button. When `matrixUrl` is empty, the button is disabled and reads "Opens with Round 1 (TBC)".

### 9.6 Resources (`/resources/`)

`reference/21` to `reference/23`.
- **Title:** "Resources." plus one line.
- **Background guides:** filter chips, then a grid of photo cards per committee with category, code, full name, status and an Open link.
- **IP style guides:** Journalism and Photography cards.
- **Essential documents:** Rules of Procedure, Delegation Guidelines and Consent Form, as cards with a document icon. Each is TBC until a file exists.
- **Research links:** six cards with the domain shown small above the title, each opening in a new tab (`↗`).

### 9.7 New to MUN? (`/new-to-mun/`)

The page for 11-year-olds at their first conference. Friendly, short sentences, no jargon left unexplained. This page may use the brighter accents (light teal, yellow, peach) as panel backgrounds, with navy text.

1. **Intro:** "New to MUN? Start here." plus two sentences on what Model UN is, said simply. Same hero layout as `reference/24`, with a raised placard in place of the globe.
2. **How a committee session runs:** this really is a sequence, so number it. Roll call → setting the agenda → General Speakers List → moderated caucus → unmoderated caucus → working papers → draft resolution → voting by placard. One or two sentences each.
3. **Before the conference:** a checklist.
   - Read your background guide.
   - Research your country's view.
   - Write a 60 to 90-second opening speech.
   - Write a position paper if your committee asks for one (TBC).
4. **On the day:** what to bring, the phone rule, and where to go.
5. **Say it like a delegate:** cards with exact phrases a first-timer can read out:
   - "The delegate of India would like to be added to the speakers list."
   - "Motion for a moderated caucus on [topic], total time 10 minutes, speaking time 1 minute."
   - "The delegate yields the floor back to the chair."
   - "Point of information to the delegate of France."

   Each card is a small white placard shape with navy text.
6. **Glossary:** present / present and voting, placard, GSL, moderated caucus, unmoderated caucus, yield, point of order, point of information, point of personal privilege, bloc, working paper, draft resolution, preambulatory clause, operative clause.
7. **Footer note:** "Procedure may differ slightly at OakJMUN. Check with USG Policy (TBC)."

### 9.8 Social Night (`/social-night/`)

The Halloween edition, on Saturday 31 October in the MPH. It uses the Social Night palette from 3.1.

**Hero** (layout from `reference/24`, OakMUN's event page: big left-aligned title, large circle on the right)
- Night sky (`--blue-900` blending into the brown-black). The big circle on the right becomes the moon: warm white with a soft gold glow and faint craters drawn as low-opacity circles. On phones the moon sits above the title, smaller.
- Three to five small bat silhouettes as inline SVG, drifting slowly along curved paths. On phones there are two. With reduced motion there are none.
- Up to 20 slow amber embers rising. No embers on phones.
- Title "Social Night" in cream; "Halloween edition" in pumpkin; meta line "Saturday 31 October · MPH · Time TBC".

**Sections**
- **What to expect:** short.
- **What to wear:** "Costumes TBC".
- **When and where:** time and MPH.
- **3D photo booth teaser:** "A camera rig takes a short looping 3D photo from several angles. Your photo is sent only to you, and we only take photos of students whose parents have given consent." Placeholder image slot.
- **A small FAQ.**

Cobweb corners are allowed as thin keyline SVGs at low opacity. Keep it fun but tidy: no sound and no jump-scares.

### 9.9 404

A single raised placard reading "POINT OF ORDER" above the line "This page doesn't exist.", with a link home and to Committees.

## 10. The hero intro: "placards rising"

This replaces OakMUN's rotating cards (`reference/01`). It's new work, not a copy.

**The idea.** The page opens like a committee room in the moment of a vote: placards go up across the room, then part to reveal the conference title.

**Placard design**
- A tent-card face: white `#FFFFFF`, about 3.2:1 (desktop 168 × 52 px, phone 120 × 38 px), 6 px radius.
- A 4 px teal strip along the top edge.
- The country name centred in navy, 800 weight, uppercase, .06em tracking.
- A short 4 × 18 px rounded handle below in `--blue-500`, so it reads as raised by hand.
- Countries come from `site.json` (`intro.countries`, section 7.1). Later they can be swapped for names from the real allocation matrix.

**Choreography (desktop, about 20 placards, three depth rows)**

| Time | What happens |
| --- | --- |
| 0 to 0.15 s | The hero background is already painted. A translucent navy wash (`rgba(0,18,35,.7)`) sits over it. |
| 0.15 to 1.25 s | Placards rise from below the bottom edge in three rows. The back row is at 70% scale and .55 opacity, the middle at 85% and .8, the front at 100%. Each animates `translateY(110%)` → `0` with a starting tilt of -7° to 7° that settles to -2° to 2°, over .7 s with `--ease-out-expo`. They're staggered 35 to 60 ms apart in a slightly irregular order, so it feels like a room rather than a machine. |
| 1.25 to 1.55 s | Hold. Each placard bobs 2 px once, as hands settle. |
| 1.55 to 2.15 s | The placards nearest the centre slide out to the sides (`translateX` ±45 to 65 vw) and fade; outer placards sink and fade. The navy wash fades to 0. The title fades in at the same time, scaling .94 → 1. |
| 2.15 to 2.5 s | The meta line, buttons and countdown fade in. |

**Phones:** 8 placards in two rows, the whole sequence compressed to about 1.6 s.

**Rules**
- Build it with DOM elements and the Web Animations API (`element.animate`) so it's compositor-friendly and can be cancelled. No canvas and no libraries.
- Apply `will-change: transform, opacity` only while the animation runs.
- **Never lock or hijack scrolling.** Any click, tap, key press, wheel or touch move skips straight to the final state.
- **Plays once per browser session** (`sessionStorage`, with try/catch). Later visits in the same session show the final state.
- **Reduced motion:** no intro at all.
- **LCP:** the hero background image paints immediately and remains the LCP element. Never cover the hero with an opaque layer. The title is in the HTML from the start (the intro only hides it visually with opacity).
- **Smoothness:** 60 fps on Chrome DevTools' "Mid-tier mobile" profile with 4x CPU slowdown. Check with a performance trace and report dropped frames.

## 11. Project structure

```
oakjmun-site/
├─ CLAUDE.md, SPEC.md, reference/            (not deployed)
├─ eleventy.config.js, package.json
├─ scripts/
│  ├─ optimize-media.mjs                      (sharp + ffmpeg)
│  ├─ screenshot.mjs                          (Playwright)
│  └─ check-links.mjs
├─ docs/  DEPLOY.md, HOW_TO_UPDATE.md, REPLACE_ME.md
└─ src/
   ├─ _data/  site.json, committees.json, secretariat.json, schedule.json,
   │          faq.json, resources.json, socialNight.json
   ├─ _includes/
   │  ├─ layouts/base.njk
   │  └─ partials/  announcement.njk, nav.njk, footer.njk, icons.njk
   ├─ css/  tokens.css, base.css, components.css, pages/*.css
   ├─ js/   nav.js, intro-placards.js, countdown.js, marquee.js, theme-reveal.js,
   │        stats.js, schedule.js, wheel.js, faq.js, filters.js, secretariat.js,
   │        social-night.js, smooth-scroll.js, vendor/lenis.mjs
   ├─ assets/  img/, video/, docs/guides/, fonts/
   ├─ index.njk, secretariat.njk, allocations.njk, resources.njk,
   │  new-to-mun.njk, social-night.njk, 404.njk
   ├─ committees/  index.njk, committee.njk   (pagination → /committees/<slug>/)
   └─ _headers
```

Each page loads only the JS modules it uses.

## 12. Tasks

Do one task per session. Start each with: "Read SPEC.md and do Task N." For Task 0, use plan mode.

### Task 0: study and plan (no code)
1. Use a subagent to study OakMUN's source as described in section 2. Have it report on the nav (HTML, CSS and the scroll/collapse JS), the hero layout, the theme reveal, stats, the SG letter, the schedule, the committees wheel, "More than debate", the FAQ, the footer, the committees grid and tile hover, the committee page, the Secretariat flip card, allocations and resources.
2. Compare that with `reference/` and this spec.
3. Write `PLAN.md`: the components you'll build, which OakMUN CSS you'll port (cleaned up), anything in this spec that conflicts with what you found, and risks.
4. Stop and wait for approval.

**Done when:** `PLAN.md` exists and Supratiik has approved it.

### Task 1: scaffold
- Eleventy 3 project with the structure in section 11.
- Fonts self-hosted.
- `tokens.css` with everything in section 3, plus `base.css` (reset, typography, focus styles, skip link).
- The layout, announcement strip, nav (full behaviour from 8.2) and footer.
- `npm` scripts from `CLAUDE.md`.
- `screenshot.mjs`: Playwright with headless Chromium; every page at 390×844 and 1440×900, full page, saved to `screenshots/<page>-<width>.png`.
- `_headers`.
- A first commit.

**Done when:** a blank page shows the real nav and footer; the nav collapses on scroll and expands on scroll up; the mobile menu works by keyboard; screenshots match `reference/02` and `reference/03` for the nav.

### Task 2: content files
- Create every data file in section 7 with the placeholder content.
- Wire the footer, nav buttons and announcement strip to the data.

**Done when:** changing `announcement.text` and rebuilding changes the strip.

### Task 3: homepage sections
- Build sections 1 to 13 from 9.1, except the intro, with static final states.
- Match the reference screenshots for each section.

**Done when:** desktop and phone screenshots of every homepage section sit side by side with the matching reference frames, and you've listed and fixed the visible differences.

### Task 4: the placard intro
- Build section 10.
- Record a short performance trace on a throttled mobile profile and report frame timing.

**Done when:** it skips on input, plays once per session, is absent with reduced motion, and doesn't move LCP (compare Lighthouse LCP with the intro on and off).

### Task 5: committees
- The listing page with filters and search, and the generated committee pages from 9.2 and 9.3.
- Pull the borrowed committee photos and logos and run them through the media pipeline.

**Done when:** adding a committee to `committees.json` creates its tile and its page, and the filters work with keyboard and screen reader.

### Task 6: Secretariat, Allocations, Resources
- Build 9.4 to 9.6.

**Done when:** releasing a guide is one line in `committees.json` plus the PDF file.

### Task 7: New to MUN?, Social Night, 404
- Build 9.7 to 9.9.

**Done when:** Social Night runs smoothly on a throttled phone profile, its particles stop when off-screen, and the New to MUN page reads well at 390 px wide.

### Task 8: speed, accessibility and polish
1. Run `npm run media` on every asset.
2. Run Lighthouse in mobile mode on Home, Committees, a committee page and Social Night. Fix anything under the targets in section 5.
3. Check keyboard paths, focus states, contrast and heading order, and run axe (`@axe-core/playwright`).
4. Check that nothing scrolls sideways at 360 px.

**Done when:** the scores and axe results are reported, and nothing is below target.

### Task 9: review against the brief
Use a fresh subagent to review the whole site against section 4 (anti-slop), section 5 (speed) and this spec. Ask it to report only real gaps, then fix them.

### Task 10: docs and deployment
- **`docs/DEPLOY.md`**, for Supratiik:
  - create a GitHub repo;
  - connect it to Cloudflare Pages (free plan): build command `npm run build`, output `_site`, Node 20 or newer (pin it with a `.nvmrc` file containing `22`);
  - the first deploy gives a `*.pages.dev` address;
  - adding a custom domain or subdomain later.
- **`docs/HOW_TO_UPDATE.md`**, for a non-coder using GitHub's website (on a phone too):
  - release a background guide;
  - add an EB member;
  - change the announcement strip;
  - edit the schedule;
  - turn the theme on;
  - add a sponsor;
  - add or remove a committee.

  Include one worked example with screenshots of the JSON edit.
- **`docs/REPLACE_ME.md`**: every TBC value and every borrowed asset.

**Done when:** a fresh clone builds with one command, and the docs match the real file names.

## 13. Verification loop (every task)

1. `npm run build` passes with no errors or warnings.
2. `npm run check` finds no broken internal links.
3. `npm run shots`. Open the new screenshots next to the matching `reference/` frames. List what differs in colour, spacing, size, weight and alignment, fix what matters, and shoot again. Show Supratiik the final screenshots.
4. Commit with a clear message.
5. Report what you did, what's still TBC, and anything you'd like a decision on.
