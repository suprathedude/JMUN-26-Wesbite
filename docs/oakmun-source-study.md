# Oakridge MUN XVI source study for the OakJMUN 2026 rebuild

Everything here was read-only. Source: a sparse checkout of the top-level HTML files of `srijai-k/FINAL-OAKMUN` (main @ 999b1b7). Line refs are `file:line`.

**Licence.** `git show HEAD:Lisence` is the standard **MIT License, "Copyright (c) 2026 Oakridge MUN"**. That is the organisation's name, not a person's.

**Biggest global gotcha.** Every page sets `@media (min-width:769px){ html{ zoom:1.1 } }` (index.html:16, and the same in each page's `<style>`). It is reset with `html{zoom:1}` at ≤768 (index.html:2242). So every desktop value below renders **10% larger** than written, and the hero height compensates with `calc(100vh / 1.1)` (index.html:398). If you don't use `zoom`, multiply the desktop px/rem values by 1.1 to get the same look.

---

## 1. Nav

**HTML** (index.html:2942-2976)
- Structure: `nav#navbar > .nav-pill`. Inside the pill:
  - `a.nav-logo` ("Oakridge <span>MUN</span>")
  - `.nav-center`, which holds `ul.nav-links-group.left` (Committees/Secretariat/Allocations), `.nav-mark > img[logo.png]` and `ul.nav-links-group.right` (Schedule/Resources/`li.nav-has-drop` "Other")
  - `.nav-right`, which holds `button.menu-btn` (3 spans), `button.nav-liability` (index only) and `button.nav-cta` "Get Your QR Code". The CTA is a `<button onclick=location…>`, not an `<a>`.
- The mobile drawer `div.mobile-nav#mobileNav` is a sibling placed *before* the nav (2924-2939).

**CSS** (index.html:85-375)
- `nav`: `position:fixed; top:14px; left:50%; translateX(-50%); z-index:400`, entry animation `navSlideDown .45s cubic-bezier(.4,0,.2,1)` (from translateY(-18px), opacity 0). Subpages use z-index 200 and `.6s`.
- `.nav-pill` (93-105):
  - `display:flex; gap:6px; background:rgba(1,3,8,.97); backdrop-filter:blur(24px)`
  - `border-radius:100px; border:1px solid rgba(250,245,237,.07); padding:8px 10px`
  - `box-shadow:0 8px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(250,245,237,.04)`
  - Transitions padding and radius over .3s.
  - **Subpages use `padding:10px 14px`** (committees.html:154-163).
- `.nav-logo`: `.86rem/800`, `letter-spacing .14em`, uppercase, `max-width:180px`.
  - The index "MUN" span is white.
  - Subpages use `.92rem`, `.16em`, `max-width:220px`, and a **teal** "MUN".
- Link groups: `gap:16px` (24px on subpages). Padding is left `0 12px 0 18px` and right `0 6px 0 12px`, `max-width:360px`.
- Links: `.64rem/700`, `ls .1em`, uppercase, `rgba(250,245,237,.48)`. `:hover` and `.active` go to `#FAF5ED`, transition `color .2s`.
- `.nav-mark img` (285): 44×44, `opacity .92`, `drop-shadow(0 0 8px rgba(48,205,215,.35))`, `mix-blend-mode:lighten`. On hover: opacity 1, `drop-shadow(0 0 14px rgba(48,205,215,.65))`.
- `.nav-cta` (336-353):
  - `linear-gradient(180deg,#30CDD7 0%,#1E96A5 100%)`, navy text, `.72rem/800`, `ls .08em`
  - `border:1px solid rgba(255,255,255,.06); border-radius:12px; padding:10px 18px`
  - `box-shadow:0 6px 18px rgba(2,20,26,.06)`; hover `0 12px 30px rgba(2,20,26,.08)`; `:active scale(.997)`
- `.nav-liability` (203-218): transparent, `1px solid rgba(48,205,215,.28)`, radius 10, `8px 12px`, `.66rem`.
- At ≤980: pill `6px 8px`, link gap 10px, logo `.78rem`. At ≤740: `.nav-center` hidden.

**"More" dropdown.** The label is actually **"Other"**, with `content:' ↓'` (index) or `' ▾'` (subpages).
- Base `.nav-drop` (143-160): `top:calc(100% + 18px); width:320px; background:rgba(3,10,22,.97); backdrop-filter:blur(32px); border:1px solid rgba(48,205,215,.15); border-radius:16px; padding:16px; box-shadow:0 24px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(48,205,215,.06)`. It is a 3-column grid.
- The "Other" menu **uses the variant `.nav-drop--events`** (256-273), which overrides to `width:210px; left:auto; right:0`, one column.
- Items: `.62rem/700`, `padding:9px 10px 9px 14px`, `border-left:2px solid transparent`. On hover: `background:rgba(48,205,215,.1)`, teal text, teal left border, `padding-left:18px` (.2s).
- Open/close is **CSS-only `:hover`**:
  - Closed state: `transition: opacity .3s .55s, transform .3s .55s cubic-bezier(.4,0,.2,1)`, so **closing waits .55s**.
  - `:hover`: `transition-delay:0s`, translateY(-6px → 0).
  - A 20px transparent `::before` bridges the gap so the menu doesn't close on the way down.
  - No JS, no keyboard support, no aria.

**Scroll collapse JS** (index.html:4231-4257; the same in each page)
- Ignored when `innerWidth<=768`.
- Scrolling down with `y>80` adds `nav.scrolled`. **Any upward scroll removes it immediately.** committee.html uses **40**, not 80 (committee.html ~2068).
- Resizing to ≤768 clears it.
- `.scrolled` (357-363): `.nav-logo`, `.nav-links-group`, `.nav-right` and `.nav-cta` go to `opacity:0; max-width:0` (and padding 0). The pill becomes `padding:8px; border-radius:14px`, leaving only the crest in a rounded square.
- Re-expand: **`mouseenter` on `.nav-mark`** (not click) while scrolled adds `.hover-expanded`; `mouseleave` of the nav removes it.
  - On index this is only `@media (min-width:1250px)` (365-376). Subpages use `min-width:769px`.
  - Expanded pill: `10px 14px`, radius 100px.

**Tablet nav, index only** (769–1249, 379-390): `.nav-center` hidden, CTA hidden, hamburger shown. Subpages have no tablet rule, so the full pill shows from 769px up.

**Mobile ≤768** (index 2241-2255)
- Nav `top:10px`; pill `padding:8px 14px`; `.nav-center` and CTA hidden; `.nav-right{max-width:52px}`; `.menu-btn` visible.
- Perf block (2696-2700): pill `backdrop-filter:none; background:rgba(1,3,8,.99)`; drop background `rgba(3,12,26,.98)`.
- `.menu-btn` (2161-2185): 36×36, three 2px bars, gap 5px. The open state is an X via `translateY(±7px) rotate(±45deg)`.
- `.mobile-nav` drawer (2188-2223):
  - `position:fixed; top:calc(var(--nav-bottom,78px) + 10px); width:calc(100% - 32px); max-width:360px; max-height:calc(100dvh - var(--nav-bottom) - 16px)`
  - `background:rgba(1,3,8,.99)`, blur 28px (removed on mobile), `border-radius:20px; border:1px solid rgba(48,205,215,.2); padding:16px 24px` (12px 20px 14px at ≤768)
  - Closed: `translateX(-50%) translateY(-12px) scale(.97)`, opacity 0. Open: `.35s` with transform easing `cubic-bezier(.175,.885,.32,1.2)`.
  - Links: `.88rem/700`, `ls .1em`, `rgba(.75)`, `padding:18px 0` (13px at ≤768; 11px at max-height 700; 8px at max-height 520), `border-bottom:1px solid rgba(250,245,237,.07)`.
- JS (4111-4150): `--nav-bottom` is synced from `getBoundingClientRect` on load, resize and open. Opening sets `body.style.overflow='hidden'`. An outside click or a link click closes it.

**Active page.** Static `class="active"` on the matching desktop link (committees.html:1278, committee.html:1497, secretariat.html:1043, allocations.html:915). There is no JS, and index has none.

**Teal top strip `#trainingStrip`** (index.html only; CSS 4482-4509, HTML 4658, JS 4635-4667)
- `position:fixed; top:0; left:0; right:0; z-index:1000`
- `background:linear-gradient(90deg,#1a8899 0%,#30CDD7 48%,#1a8899 100%); padding:11px 20px`
- Text "Get Your QR Code →": `.88rem/800`, `ls .14em`, uppercase, `#003057`, centred flex, gap 12px.
- Shimmer `::after`: 55% wide `linear-gradient(90deg,transparent,rgba(255,255,255,.45) 50%,transparent)`, `left:-70% → 130%` over **`2.2s cubic-bezier(.4,0,.2,1) infinite`**.
- `#stripClose` "✕" sits at `right:16px`, 14px, opacity .6.
- JS forces `nav.style.top='42px'` while the strip is visible; closing it hides the strip and restores the nav.

---

## 2. Home hero (index.html:2980-3083; CSS 395-899)

**Layers**
- `section.hero`: `height:calc(100vh/1.1)` (`100vh` at ≤768; the `100svh` declared before it is overridden), `background:#03080f`, `overflow:hidden`.
- `.hero-bg` (`#020810`, z0) contains:
  - `video.hero-video` `/bg_video.mp4`: `object-fit:cover; opacity:.35`
  - `.hero-video-overlay` (420-431): `linear-gradient(135deg, rgba(0,48,87,.72) 0%, rgba(30,150,165,.45) 50%, rgba(0,20,40,.78) 100%)` **with `mix-blend-mode:multiply`**
  - Dot grid `.hero-bg::before` (433-440): `radial-gradient(circle, rgba(48,205,215,.055) 1px, transparent 1px)` at `36px 36px`. It paints *under* the video in tree order, so it only shows through the 35%-opacity video.
  - Three `.hero-orb`s, all `filter:blur(60px)` (24px at ≤768) and `animation … ease-in-out infinite alternate`:
    - **a**: 65%×60% at top -15%, left 17%, `rgba(30,150,165,.35)`, 18s, to `translate(7%,11%) scale(1.14)`
    - **b**: 55%×55% at bottom -15%, right -5%, `rgba(0,60,110,.55)`, 22s, to `(-9%,-7%) scale(.87)`
    - **c**: 45%×50% at top 25%, left -10%, `rgba(48,205,215,.18)`, 26s, to `(15%,6%) scale(1.09)`
    - All are radial `… 0%, transparent 70%`. Reduced motion stops them.
- **XVI watermark** `.hero-xvi-bg#heroXviBg` (605-623):
  - An `<img src="xvi.svg">` centred by flex, `inset:0; z-index:1`.
  - Image `width:clamp(320px,78vw,840px)`, **`opacity:.18`**, `drop-shadow(0 0 10px rgba(48,205,215,.08))`.
  - The container starts at `opacity:0` and becomes 1 via `.visible` with `transition:opacity 1s .5s`. **Only the intro JS adds `.visible`** (at 2.5s).
- The CSS for `.hero-globe` (485-504) is unused; there is no element for it.

**Content `#heroArcContent`** (650-665)
- Absolute, `inset:0`, z10, centred column, `gap:16px; padding:72px 24px 0`.
- **CSS starts it at `opacity:0`.** Only the intro JS reveals it.

**Meta line `.arc-eyebrow`** (767-783)
- Preceded by an inline 32px `logo.png` with `drop-shadow(0 0 8px rgba(48,205,215,.35))`.
- Text "Chapter XVI · 2026 · Hyderabad": `.68rem/700`, `ls .28em`, uppercase, `rgba(250,245,237,.72)`, flex gap 14px.
- `::before`/`::after` rules: **28×1.5px teal, radius 2, opacity .8**.
- `.42rem` at ≤768.

**Title `.arc-title`** (785-791): "OAKRIDGE<br><span.teal>MUN</span>", `clamp(2.6rem,5.5vw,5.5rem)`, 900, `line-height:.88`, `ls -.04em`, uppercase. Mobile `clamp(2rem,11vw,3.2rem)`.

**Dates `.hero-dates`**: `.66rem/700`, `ls .2em`, `rgba(.75)`, gap 12 (the `.dot` style exists but isn't used). Mobile `.52rem`.

**Buttons** (`.hero-ctas`, gap 12)
- `.hero-btn-primary` (816-832):
  - `.78rem/800`, `ls .08em`, navy text, `linear-gradient(180deg,#30CDD7,#1E96A5)`
  - `border:1px solid rgba(255,255,255,.06); border-radius:100px; padding:13px 26px`
  - `box-shadow:0 8px 24px rgba(48,205,215,.25)`, transition `.18s cubic-bezier(.2,.9,.3,1)`
  - Hover: `translateY(-3px)`, `0 14px 32px rgba(48,205,215,.45)`, `brightness(1.05)`
- `.hero-btn-ghost` (833-844): `.78rem/700`, `ls .1em`, `rgba(.75)`, `1px solid rgba(250,245,237,.14)`, radius 100, `12px 26px`. Hover: border `rgba(48,205,215,.4)`, teal text, `translateY(-2px)`.
- Mobile: buttons stack full-width, `14px 24px`.

**Countdown** (846-863; mobile 2254-2257)
- `.cd-value`: `clamp(1.2rem,2.2vw,1.9rem)/800`, `min-width:52px; border-radius:9px; padding:7px 7px 5px; ls -.02em`
  - `box-shadow:0 4px 12px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.1), inset 0 0 0 1px rgba(255,255,255,.05)`
  - `::before` is the glass layer: `backdrop-filter:blur(8px); background:rgba(255,255,255,.06)`. On mobile there is no blur and the background is `.1`.
- `.cd-label`: `.42rem/700`, `ls .2em`, `rgba(48,205,215,.6)`.
- `.cd-sep` ":": 1.4rem/300, `rgba(.15)`.
- Mobile (the later rule wins): 1.2rem, `min-width 50px`, `8px 6px 6px`, radius 8, label `.4rem`.
- JS (4005-4018): target `new Date('2026-07-24T08:00:00+05:30')`, `setInterval(tick,1000)`, zero-padded; clamps to 00.

**Notification stack `.hero-notifs`** (712-764)
- Right 36px, vertically centred, 240px wide; hidden ≤1024.
- Each card: `rgba(2,10,20,.8)`, blur 18, `border-left:3px solid teal`, radius 12, `14px 16px`.
- Staggered `notifIn .4s` at 0.3/0.45/0.6/0.75s.

---

## 3. Old intro animation (what to remove)

**What it is**
- `#morphCanvas` plus `#heroIntroText` ("Create, / Debate, / Innovate." at `clamp(3rem,6.5vw,6.5rem)`/900, words slide up `.8s cubic-bezier(.16,1,.3,1)` staggered .1s).
- JS IIFE index.html:3610-3990, "ported from danielpetho/scroll-morph-hero".
- 16 flip cards (78×111px; 56×80 mobile) built from `comm_posts_webp/*`.
- Phases: scatter → `line` at 500ms → `circle` at 2500ms. `animationReady` is set 800ms later.
- Spring physics: stiffness 40, damping 15/20, one rAF loop.

**How it hijacks scroll**
- `applyLock()` sets `html/body overflow:hidden` and `body position:fixed`.
- A `scroll` listener forces `scrollTo(0,0)`.
- wheel/touch(×2)/keys drive a `virtualScroll` from 0 to `MAX_SCROLL` (2000 desktop, 1000 mobile), with each delta clamped to 80.
- Morph progress is `virtualScroll/600` (circle → arc). The arc rotates over 600–2000.
- It unlocks at MAX and **re-locks** if the user wheels up at `scrollY<=2`.
- It also hijacks every `a[href^="#"]` / `"/#"` click and skips the whole thing when the URL has a hash (`_skipAnim`).

**What depends on it**
- `#heroArcContent` opacity is written only by `updateText()`: `(sm_morph-.65)/.2`, plus `translateY(20→0)`.
- `.hero-xvi-bg.visible` is added only by the phase timer.
- If you delete the morph, **set `#heroArcContent{opacity:1;transform:none;pointer-events:auto}` and give `.hero-xvi-bg` opacity 1** (or your own fade-in).
- `.hero-notifs` is independent.
- Delete: `#morphCanvas`, `#heroIntroText`, `.morph-*` and `.circle-theme*` CSS (506-711), the IIFE, and `window.wakeLoop` / `CIRCLE_*` globals.

---

## 4. Theme reveal (HTML 3085-3116; CSS 1046-1236; JS 4328-4467)

**CSS**
- `.theme-section`: **`min-height:340vh`**, `background:#020c1a`, `overflow:clip`.
- A `::before` 160px top fade from `#03080f`.
- `.theme-sticky`: `position:sticky; top:0; height:100vh`.
- Background extras:
  - `.theme-bg-glow`: 900×600 `radial-gradient(ellipse, rgba(48,205,215,.12), transparent 70%)`
  - `.theme-bg-word` "RESOLVE": `clamp(10rem,22vw,18rem)`/900, transparent fill, `-webkit-text-stroke:1px rgba(48,205,215,.055)`, parallax `translateY(-50% + lerp(-40,40,p)px)`
- Intro overlay: "Presenting the" (`clamp(.7rem,1.4vw,1rem)`/600, `ls .26em`, `rgba(.5)`) and "Conference Theme" (`clamp(2.2rem,5vw,4.8rem)`/900, gradient `135deg teal 0% → teal-light 70%`).
- Eyebrow: lines 40×1px (gradient transparent→teal, opacity .65) around text `.58rem/700`, `ls .32em`, teal, opacity .85.
- `.theme-title`: `clamp(2.2rem,4.4vw,4.8rem)`/900, `ls -.035em`, `lh 1.1`. Words are `inline-block` with `margin-right:.16em`.
- **Highlighted word `.theme-word-teal`** (1185): `linear-gradient(135deg, var(--teal) 0%, var(--teal-light) 60%)` with `background-clip:text`, transparent fill.
- Divider: 56×2 teal, opacity .45, `margin:28px auto`.
- Bottom label: `.55rem/700`, `ls .28em`, `rgba(.35)`.
- **Caption** (1218): `clamp(.92rem,1.3vw,1.1rem)`, 400 *italic*, `lh 1.8`, `rgba(250,245,237,.7)`, `max-width:620px`.

**JS, desktop** (rAF-throttled scroll listener)
- Progress `p = -rect.top/(offsetHeight - innerHeight)`, eased with `1-(1-t)^3`.
- Each element animates opacity 0→1, translateY down to 0, and `filter: blur(Npx → 0)`:

| Element | p range | Motion |
|---|---|---|
| Intro in | 0–.10 | |
| Intro out | .30–.42 | |
| Eyebrow | .40–.48 | 32px, blur 10 |
| Word *i* | starts .44+i·.055, lasts .11 | 48px, blur 14px |
| Divider | .64–.73 | scaleX |
| Label | .70–.79 | |
| Caption | .75–.90 | |

- At `p≥.95` it sets `allDone` and **stops updating, one-way**: scrolling back up doesn't reverse it.

**JS, mobile** (`pointer:coarse` **or** ≤768)
- An IntersectionObserver (threshold .25) staggers 8 elements 90ms apart, each `.55s` with 32px and blur 8px.
- CSS at ≤768 removes sticky/340vh (`padding:80px 0 90px`).
- Reduced motion: shown instantly.

---

## 5. Committee marquee (HTML 3119-3159; CSS 903-939)

- `.marquee-section`: `background:#27b0bd; padding:14px 0; overflow:hidden; aria-hidden`.
- `.marquee-track`: flex, `animation: marquee 22s linear infinite` (`translateX(0 → -50%)`).
- It contains **two identical `.marquee-content`** blocks, which makes the loop seamless.
- `.marquee-item`: `.72rem/800`, `ls .2em`, uppercase, navy, `padding:0 28px`.
- `.marquee-dot`: 4×4 circle, navy, opacity .4.
- Reduced motion turns the animation off.
- A reversed navy variant (`.marquee-section-rev`, 30s) exists but is `display:none`.

---

## 6. Stats tiles (HTML 3205-3230; CSS 1243-1316, 2263-2266, 2377-2384, 2770-2785)

- Section: `background:#001223; padding:48px 56px`.
  - Background photo `/conference_photos/11.webp` at opacity .05.
  - Two blurred orbs.
  - `::after` `radial-gradient(ellipse at 50% 110%, rgba(48,205,215,.07), transparent 60%)`.
- Grid: 4 columns, gap 16, max 1100.
- `.stats-strip-item` (1256):
  - `linear-gradient(145deg,#0a2040 0%,#061628 60%,#030e1a 100%)`, `1px solid rgba(48,205,215,.12)`, radius 16, `padding:36px 24px`, gap 12
  - Glow `::before`: 120px at top -30/left -20, `radial rgba(48,205,215,.18) → transparent 70%`
  - `::after`: 90px at bottom -20/right -10, `rgba(30,150,165,.14)`
  - Hover: `translateY(-3px)`, `0 12px 40px rgba(0,0,0,.35), 0 0 0 1px rgba(48,205,215,.2)`
- `.ss-num` (1291): `clamp(2.8rem,5vw,4.5rem)`/900, `ls -.03em`, `lh 1`, `linear-gradient(135deg,#30CDD7 0%,#B4EBF5 55%,#30CDD7 100%)` text clip, with `padding-bottom:.1em; padding-right:.08em` to stop glyph clipping. The "+" uses the same gradient.
- `.ss-label`: `.6rem/700`, `ls .22em`, `rgba(.45)`.
- Count-up (4270-4291): IntersectionObserver **threshold .5**, **1600ms**, easing `1-(1-p)^3`, `Math.round`, writes `.count-val`. Final values are already in the HTML (685+, 16, 3, XVI static).
- Mobile: 2 columns, gap 10, `24px 16px`, number `clamp(2rem,10vw,3rem)`.

---

## 7. SG letter (HTML 3233-3268; CSS 1321-1475)

- Section: navy, `72px 56px 80px`. `::before` is a "XVI" at 28vw/900, `rgba(250,245,237,.015)`.
- **Layout is floats, not grid**: `.sg-photo-col{float:left;width:380px;margin-right:80px}`, and the letter text wraps around it.
- Photo:
  - `aspect-ratio:3/4` (4/5 on mobile), radius 16
  - `::after` inner border `1px rgba(48,205,215,.2)`
  - `object-position: top center`
  - A `photo-glow` 4s animation. It is redefined later (2706) as an opacity pulse .92↔1, which overrides the box-shadow version.
  - Path `Secretariat_Photos/SG_Shrey.jpeg`.
- Kicker: `.65rem/800`, `ls .3em`, teal.
- Heading: `clamp(2rem,3vw,2.8rem)/700`, `lh 1.15`, mb 32 (1.8rem mobile).
- Body:
  - `p` `1.02rem`, `lh 1.82`, **`rgba(250,245,237,.68)`**, 16px between paragraphs
  - The first `p` is `1.12rem` at `rgba(.82)`
- Signature block:
  - "Sincerely," `.92rem` at `.68`
  - `img.sg-sig-img /sg_signature.svg`: 160px, `margin:-40px 0`, `opacity .88`, `filter:brightness(0) invert(1)`
  - Name `.92rem/700`; title `.75rem` at `rgba(.45)`
- Link "Meet the Secretariat →": `.75rem/800` teal; hover gap 8→12 and teal-light.
- Reveal: an IntersectionObserver at .12 fades from 28px (`.7s`).

---

## 8. Schedule (HTML 3271-3356; CSS 1484-1825, mobile 2271-2276 and 2479-2560; JS 4074-4108)

**Section and header**
- `linear-gradient(180deg,#001e3c 0%,#002548 100%)`, `min-height:100vh`, `padding:80px 56px 100px`. `::before` `radial(ellipse at 50% 0%, rgba(48,205,215,.08), transparent 60%)`.
- Header is flex space-between, aligned to the end.
- Kicker `.65rem/800`, `ls .3em`.
- Title `clamp(2.4rem,4vw,3.6rem)/800`, `ls -.03em`, with an `::after` bar 44×3 `linear-gradient(90deg,teal,transparent)` at mt 14.

**Tabs**
- Container: `background:rgba(250,245,237,.04); border:1px solid rgba(.1); radius:14; padding:5; gap:6`.
- `.day-tab` (1580): `.72rem/800`, `ls .08em`, `rgba(.55)`, radius 12, `12px 28px`.
  - Hover: `translateY(-3px)`, `background rgba(.06)`.
  - `.active`: primary gradient, navy text, `0 6px 18px rgba(48,205,215,.25)` (hover `0 12px 30px …35`).

**Legend**
- Dots 8px; labels `.62rem/600`, `ls .1em`, `rgba(.45)`.
- Colours: committee teal, ceremony `var(--gold)` (=#E1AA28 here), social teal-dark, meal `rgba(188,154,110,.7)`, break `rgba(250,245,237,.25)`.

**Timeline**
- `.tl-item` grid is `200px 1fr`.
- Vertical line `.timeline::before` (1645): `left:200px`, 1px, `linear-gradient(to bottom, transparent, rgba(48,205,215,.25) 8%, … 92%, transparent)`.
- Time column: right-aligned, `padding-right:36px`. Range `.82rem/700` at `rgba(.75)`; duration `.6rem/600`, `ls .1em` at `rgba(.3)`.
- `.tl-event` (1689): `margin-left:40px; padding:16px 24px; radius:12; border:1px`. Hover `translateX(5px)`, name turns teal-light.
- Dot `::before`: `left:-45px`, 9×9, background `--dot-color`, `border:2px solid #003057`, `box-shadow:0 0 0 1px var(--dot-color), 0 0 8px var(--dot-color)`.
- **Left accent bar `::after`**: `left:0; top:16%; bottom:16%; width:3px; radius 2`, `--dot-color`, opacity .6.
- Tints (1715-1720):

| Type | Background | Border | Dot |
|---|---|---|---|
| committee | `rgba(48,205,215,.09)` | `.14` | teal |
| ceremony | `rgba(188,154,110,.11)` | `.16` | `--gold` |
| break | `rgba(180,235,245,.07)` | `.13` | teal-light |
| social | `rgba(30,150,165,.13)` | `.18` | teal-dark |
| meal | `rgba(188,154,110,.08)` | `.13` | `rgba(188,154,110,.6)` |
| dispersal | `rgba(188,154,110,.07)` | `.18` | `#BC9A6E` |

  - Committee hover: `rgba(48,205,215,.14)`, `translateX(7px)`.
- Name `1rem/700`. Tag `.57rem/700`, `ls .14em`, radius 5, `4px 10px`, coloured per type.

**Big faint day number** (1736): `#day-N::before{content:'01'}`, `right:-8px; bottom:-24px; font-size:clamp(140px,20vw,260px)/900; ls -.06em; color:rgba(48,205,215,.045)`.

**Day header**: number `clamp(2.4rem,4vw,3.2rem)` teal at opacity .6, label `.55rem`, date `1rem/800`, `border-bottom:1px solid rgba(48,205,215,.1)`.

**Mobile ≤768**
- The line is hidden. Each `.tl-item` becomes a card: `background:rgba(250,245,237,.025); radius 14; border rgba(.06)`.
- The time row sits on top (`padding:10px 16px 8px; background:rgba(0,0,0,.15); border-bottom`).
- The event fills the width; the accent bar is full height at opacity .7.
- `:has(.type-x)` tints the card border.
- Tabs are full width with `flex:1`, `10px 8px`, `.6rem`.

**JS**
- Clicking a tab swaps `.active`, sets all panels `display:none`, then shows the target. A double rAF adds `.visible` (opacity/translateY 16px, .35s), then each `.tl-item.revealed` is staggered **60ms** (opacity, translateX(-12px), .4s).
- First panel: an IntersectionObserver at .1.

---

## 9. "Committees at a glance" wheel (HTML 3359-3394; CSS 1829-1958, mobile 2283-2290; JS 4160-4229)

**Structure**
- `.ctrl-chains-sticky` (flex) contains `.ctrl-copy` (48% width, `padding-left:150px`, 68vh) and `.ctrl-chain-stage` (54%, 68vh, overflow hidden) → `.ctrl-chain-list` → 16 × `.ctrl-chain` (absolutely positioned, flex, gap 18): `span.ctrl-chain-icon > img` plus `span.ctrl-chain-name`.
- Copy column:
  - Kicker `.65rem/800`, `ls .28em`
  - Title **56px**/800, `ls -.05em`, `lh 1`
  - Subtitle `.95rem` at `rgba(.55)`, max 332
  - Button `.committees-explore`: solid teal (not the gradient), navy text, radius 8, `height:56px; min-width:200px`, `box-shadow:0 0 24px rgba(48,205,215,.3)`

**Positioning (JS, rAF)**
- For item i: `phi = currentAngle + i·2π/16`.
- `x = R(1-cos φ)`, `y = stageH/2 - 24 + R·sin φ`, with `R=280`.
- `opacity = clamp((cos φ + .6)/1.6)`, `scale = .72 + .28·(cos φ+1)/2`.
- Written as `transform: translate3d(x,y,0) scale(s)`.
- The front item sits at x=0 (left edge), vertically centred; items behind drift right and fade.

**Motion**
- `currentAngle` lerps to `targetAngle` at **0.07** per frame.
- Scrolling adds `delta·RAD_PER_PX` (≈0.0033 rad/px).
- While in view, it auto-adds **0.007 rad/frame** in the last scroll direction. That is about 56 frames (~0.93s) per item and ~15s per revolution.
- **No discrete steps, no 2.2s interval, no hover or visibility pause.** The rAF runs forever, even off-screen; it only skips the auto-increment.

**Look**
- Fades: `::before`/`::after` 130px `linear-gradient(navy → transparent)` at top and bottom.
- Circle: **76×76**, `border:2px solid rgba(250,245,237,.15)`, `background:rgba(48,205,215,.18)`, overflow hidden. Mobile **44px**.
- The `.ctrl-chain-logo` rule says 62px, but **every img has inline `width:90px;height:90px;transform:translate(0-1px, 3-10px)`**, so logos are bigger than the circle and cropped (even more at 44px).
- Name: `clamp(2rem,4vw,3.4rem)/800`, `ls -.04em`, nowrap. Mobile `clamp(1.3rem,7vw,2rem)`.
- **Crest watermark**: `.ctrl-chain-watermark` CSS exists (2361; 260px, opacity .04, `grayscale(1) brightness(3)`), but **no element uses it**, so no watermark renders.

---

## 10. "More than debate" (HTML 3397-3428; CSS 2563-2690)

- `.btd-wrapper`: `#001223`. `.btd-section`: max 1100, `80px 40px 90px`.
- Eyebrow: `.5rem/700`, `ls .28em`, teal, opacity .8.
- Heading `.btd-heading`: `clamp(1.8rem,3.5vw,3rem)/900`, `ls -.03em`, `lh 1`. **`em`: `font-style:italic; font-weight:300; color:rgba(250,245,237,.38)`** ("debate.").
- Sub: `clamp(.8rem,1.4vw,1rem)`, `rgba(.5)`, max 520, mb 48.
- Grid: 3 columns, gap 20 (1 column, gap 14 at ≤768).
- `.btd-card` (2604):
  - `background:rgba(0,30,60,.65); border:1px solid rgba(48,205,215,.12); radius:16; padding:32px 28px`
  - `::before` `radial(ellipse at 0 0, rgba(48,205,215,.08), transparent 60%)` fades in on hover
  - Hover: border `.35`, `translateY(-4px)`, `0 16px 48px rgba(0,0,0,.4)`
  - Optional `img.btd-bg` photo at opacity .13 (→ .2 on hover)
  - Accent bar 28→44 × 2px, `linear-gradient(to right, teal, rgba(48,205,215,.2))`
  - Tag **`.4rem`**/700, `ls .24em`
  - Title `clamp(1rem,1.8vw,1.3rem)/800`
  - Description `clamp(.72rem,1.2vw,.88rem)`, `rgba(.42)`, `lh 1.6`
  - Link `.5rem/700`, `ls .12em`, teal, gap 6→10
- **Social Night card `.social-night-card`** (2657-2690):
  - `background:linear-gradient(150deg,#2E1400 0%,#1C0A00 50%,#0F0500 100%); border-color:rgba(255,200,0,.22)`
  - `::before` `radial-gradient(ellipse at 65% 35%, rgba(255,180,0,.18) 0%, transparent 55%)` at opacity 1
  - Hover: border `rgba(255,215,0,.5)`, `box-shadow:0 16px 48px rgba(160,80,0,.4), 0 0 60px rgba(255,180,0,.08)`
  - Accent `linear-gradient(to right,#FFD700,rgba(255,180,0,.15))`; tag `#E8A020`; title `#FFF0A0`; link `#FFD700`
  - Inner orbs: `.sn-glow-a` 220px at top -60/right -40, `rgba(255,200,0,.28)`; `.sn-glow-b` 160px at bottom -40/left 10, `rgba(232,120,10,.22)`

---

## 11. FAQ (HTML 3431-3509; CSS 1963-2084; JS 4021-4036)

- **HTML**: `div.faq-item > div.faq-question > span.faq-q-text + div.faq-toggle > svg(2 lines)` plus `div.faq-answer > p.faq-a-text`. **There are no buttons, no aria-expanded and no keyboard handling.**
- Section: navy, `100px 56px 120px`, radial top glow; inner max 900.
- Heading "FAQ": `clamp(4rem,9vw,8rem)/900`, `ls -.04em`. On reveal it plays a `heading-glow` text-shadow pulse (3s).
- List: gap **10px**.
- Item: `background:rgba(255,255,255,.03); border:1px solid rgba(250,245,237,.08); radius:16px`.
  - Hover: `rgba(48,205,215,.04)` with border `.15`.
  - `.open`: border `rgba(48,205,215,.3)`, background `.05`.
- Question: `padding:24px 28px` (18px on mobile). Text `1rem/600` at `rgba(.85)`, white when open.
- **Toggle**: 34×34 circle, `1.5px solid rgba(250,245,237,.15)`. Open: `background:teal; border teal; transform:rotate(45deg)` with `.35s cubic-bezier(.16,1,.3,1)`. The svg is 13px, stroke `rgba(.55)` → navy.
- **Height technique**: `.faq-answer{height:0;overflow:hidden;transition:height .55s cubic-bezier(.16,1,.3,1)}`. JS sets `style.height = scrollHeight+'px'` on open and `'0'` on close.
  - It is single-open: all other items close first.
  - Answer text: opacity `.4s .08s` and translateY(-8px → 0) `.45s`; `.9rem`, `lh 1.8`, `rgba(.58)`, `padding:0 28px 26px`.
- Items reveal staggered 80ms (IntersectionObserver .08).

---

## 12. Closing banner, sponsors, footer

**CTA banner `.cta-banner`** (CSS 2415-2477, HTML 3514)
- `linear-gradient(160deg,#001223 0%,#001a35 60%,#001223 100%)`, `padding:120px 56px` (80px 20px on mobile), centred.
- `::before` 900px `radial rgba(48,205,215,.14) → transparent 60%`; `::after` top hairline `rgba(48,205,215,.4)`.
- Eyebrow `.65rem/800`, `ls .35em`.
- Title "Ready to<br><em>Delegate?</em>": `clamp(3rem,8vw,6.5rem)/900`, `lh .95`, `text-shadow:0 0 80px rgba(48,205,215,.25)`. The em is teal, not italic.
- Sub `1.05rem`, `rgba(.5)`.
- Button: gradient, radius 12, `22px 60px`, `1rem/800`, `ls .12em`.

**Sponsors `.sponsors-hero`** (949-1040, duplicated in each page's second `<style>`)
- `linear-gradient(180deg,#03080f,#05101f)`, `38px 0 46px`, `::before` 90px top teal wash.
- Heading `clamp(.82rem,1.6vw,1.1rem)/900`, `ls .34em`.
- Featured logo: 120px tall, padding 16, radius 12, `background:rgba(30,150,165,.2)`.
- Marquee: mask `linear-gradient(to right,transparent,#000 3%,#000 97%,transparent)`. Track gap 70 with **3 copies of 6 logos**, `translateX(0 → -100%/3)`, **65s** linear.
- Logos: 100px tall, padding 12, radius 10, `background:rgba(48,205,215,.15)`. Mobile: 50px, gap 50.

**Footer** (index 2093-2165, HTML 3544-3607)
- `background:#001223; padding:72px 56px 0`. `::before` 1px hairline `linear-gradient(to right,transparent,rgba(48,205,215,.3),transparent)`.
- `.footer-top`: `grid-template-columns:300px 1px 1fr 1fr 1fr; gap:0 48px; padding-bottom:64px`. The 1px column is a divider at `rgba(250,245,237,.08)`.
- Brand column: logo 64px white (`brightness(0) invert(1)`, .85), inline wordmark `1.15rem/800`, `ls .12em`, "Chapter XVI" `.72rem/800`, `ls .2em`, description `.82rem`, `lh 1.75`, `rgba(.4)`.
- Columns "Quick Links", "Contact Us", "Event Details":
  - `h4` `.65rem/800`, `ls .2em`, teal, mb 20
  - Links `.85rem/500` at `rgba(.55)` → teal, gap 12
  - Labels `.78rem/700` white; values `.82rem` at `rgba(.4)`
- Social: 36px circle, `border rgba(.12)`; hover teal with background `.08`.
- Bottom row: `border-top:1px solid rgba(250,245,237,.06); padding:24px 0`, flex space-between; `p` `.7rem/500`, `rgba(.25)`, `ls .04em`.
- Mobile: 1 column, gap 36, divider hidden, bottom row stacks (gap 8).
- **committees.html has a different footer** (committees.html:842-970): navy background, `border-top rgba(.1)`, 320px first column, 72px logo, h4 `.72rem/700`, `ls .15em`, links **white** `.85rem/600`, and `border-radius:18px 18px 0 0` on mobile.

---

## 13. committees.html

**Page hero** (CSS 326-430; HTML 1306-1314)
- `min-height:38vh; padding:120px 28px 56px`.
- Line-grid texture: `linear-gradient(rgba(48,205,215,.04) 1px, transparent 1px)` in both axes at 36px.
- Bottom fade 80px to navy; two orbs.
- Eyebrow `.62rem/700`, `ls .28em`, teal, with 24×1.5px rules.
- **Title "Committees"**: `clamp(3rem,7vw,6.5rem)/900`, `ls -.045em`, `lh .88`.
- Sub `clamp(.8rem,1.4vw,.95rem)/500` at `rgba(.45)`.
- Fixed page ambience: a 36px dot grid `rgba(48,205,215,.09)` and three blurred orbs (800/700/500px) drifting 18–26s.

**Filter band and chips**
- `.filters-band`: navy, `box-shadow:0 6px 18px rgba(0,0,0,.35), 0 1px 0 rgba(48,205,215,.06)`, mb 40. Bar `padding:18px 28px`, gap 16.
- "Filter:" label `.68rem` at `rgba(.4)`.
- `.filter-tag` (469-517):
  - `.65rem/700`, `ls .1em`, `rgba(.65)`, **`background:#003d6e; border:1px solid #1a5a90`**, radius 999, `7px 16px`
  - Hover (not active): `translateY(-1px)`, background `rgba(48,205,215,.08)`
  - `.active`: teal background, navy text, `0 4px 16px rgba(48,205,215,.3)`
- **Search pill** (519-540): `.72rem/500`, `background:#003d6e; border:1px solid #1a5a90; radius 999; padding:8px 18px 8px 36px; width:220px`. 14px magnifier at left 14. Focus: teal border, `#004a85` background. Mobile: full width, `font-size:16px`, placed above the chips (`order:-1`).

**Grid** (552)
- 3 columns, `gap:52px 36px`.
- ≤980: `44px 24px`. ≤768: 2 columns, `48px 18px`. ≤480: 1 column, `max-width:310px`, centred.

**Tile** (574-760)
- Markup: `a.committee-card[data-type][data-name][style=--tile-a/--tile-b] > .committee-visual > img.tile-photo + .tile-photo-overlay + span.status + span.committee-ring(hidden) + strong.committee-code(.med/.long)`, followed by `h2.committee-title`.
- `.committee-visual`: `aspect-ratio:1; border-radius:24px` (18 at ≤768, 20 at ≤480).
  - Fallback background: `radial(circle at 18% 16%, rgba(250,245,237,.76) 0 12%, transparent 13%)` + `linear-gradient(135deg,var(--tile-a),var(--tile-b))`.
  - `box-shadow:0 18px 46px rgba(0,48,87,.09)`, `transform-origin:50% 60%`.
  - Transitions transform/box-shadow/filter over `.6s cubic-bezier(.16,1,.3,1)`.
- **Photo treatment: no grayscale.**
  - `object-fit:cover; object-position:center top`.
  - Overlay `linear-gradient(to top, rgba(0,12,36,.82) 0%, rgba(0,20,48,.5) 40%, rgba(0,12,36,.25) 100%)`.
  - An inner frame `::before` at inset 18px, `1px solid rgba(0,48,87,.18)`, radius 18, `rotate(-5deg)`.
- **Hover** (592-647):
  - `.committee-visual`: `transform:translate3d(0,-13px,0) rotate(-1.8deg) scale(1.055)`
  - `box-shadow:0 32px 70px rgba(0,48,87,.22), 0 0 0 1.5px rgba(48,205,215,.45), 0 0 28px rgba(48,205,215,.18)`
  - `filter:saturate(1.08)`
  - Frame `::before` goes to `rotate(1deg) scale(.94)`
  - Photo `scale(1.08) saturate(1.1)` over `.7s cubic-bezier(.16,1,.3,1)`
  - Code `translateY(-4px) scale(1.03)`; title → white and `translateY(-2px)`
- Code sizes: base `clamp(1.7rem,3vw,3.2rem)/900`, `lh .9`, `ls -.05em`, `text-shadow:0 2px 16px rgba(0,0,0,.55)`. `.med` `clamp(1.15rem,2vw,2.1rem)`; `.long` `clamp(.82rem,1.45vw,1.55rem)`. Mobile sizes are larger (`clamp(3.2rem,13vw,4.2rem)` etc.).
- Status label: top 18px, centred, `.56rem/800`, `ls .16em`, `rgba(.7)`.
- Title under the tile: `.78rem/600` at `rgba(.75)`, mt 14.
- **"View committee" pill** is `#cursor-capsule` (796-823). It is a fixed element that **follows the mouse** with a lerp of .09 and a +28px y offset, and shows on card `mouseenter`:
  - Navy background, `.6rem/800`, `ls .14em`, `9px 18px`, radius 100, `border:1.5px solid rgba(250,245,237,.18)`
  - Layered inset and drop shadows
  - Scales `.7 → 1` with opacity over `.2s cubic-bezier(.34,1.56,.64,1)`
- Badges: the IP "Reg. Open" pill uses `backdrop-filter:blur(6px)` with a 1.6s pulsing dot. SOCHUM has a gold "Community Outreach delegates only" pill.

**Filtering JS** (1491-1567)
- Match rule: `activeFilter==='all' || card.dataset.type===activeFilter`, combined with `data-name.toLowerCase().includes(query)`. Search is debounced 80ms.
- Hiding: opacity 0, `scale(.97)` over `.15s`, then `display:none`.
- Showing: only previously hidden cards animate, staggered **28ms** (18ms mobile), `.3s cubic-bezier(.16,1,.3,1)` from translateY(14px).
- An empty-state message appears when nothing matches.
- Initial reveal: IntersectionObserver .02, stagger 22ms.
- Clicking a card triggers a cross-document View Transition (`@view-transition{navigation:auto}`, name `committee-hero`, 750ms). Other cards dim to `.08`, `blur(3px) saturate(.4)`.

---

## 14. committee.html

**Data**
- An inline JS object `const committees = {slug:[name, code, type, subtitle, overview, agenda[], resources[]]}` (1677-1698).
- The key is `?committee=` **or the last path segment** (`/committees/unsc` relies on host rewrites), defaulting to `disec`.
- Further inline maps: `photos`, `bgGuides` (PDF paths), `ebRoles` and `ebMembers` (name, photo, `photoPos`, desc).
- Everything is injected by JS (1700-2030).

**Hero** (CSS 199-310)
- `section.hero`: `min-height:80vh; border-radius:24px; margin:12px; overflow:hidden` (65vh, margin 8, radius 18 on mobile).
- JS prepends `img.hero-bg` (`object-position:center 40%`).
- Overlay: `linear-gradient(to top, rgba(0,5,18,.95) 0%, rgba(0,12,36,.6) 45%, rgba(0,5,18,.22) 100%), linear-gradient(100deg, rgba(0,20,50,.65) 0%, transparent 55%)`.
- Content `padding:108px 64px 72px`, laid out bottom-up: rule 48×2 teal→transparent, kicker `.72rem/800`, `ls .24em` teal, title `clamp(4rem,9vw,8.5rem)/900`, `lh .88`, `ls -.06em`, subtitle `.95rem` at `rgba(.65)`.

**Back pill `.back-link`** (243-276)
- Absolute at `top:108px; left:64px`.
- `linear-gradient(180deg,#30CDD7,#1E96A5)`, navy text, `.65rem/800`, `ls .12em`, radius 100, `padding:9px 16px 9px 12px`.
- **`filter:saturate(.6) brightness(.88)`**, so it is deliberately muted.
- `box-shadow: inset 0 2px 0 rgba(255,255,255,.18), inset 0 -2px 0 rgba(0,0,0,.28), inset 0 0 0 1px rgba(0,0,0,.1)`.
- A data-URI chevron sits in `::before`. Hover `translateX(-2px)`.

**Bento** (390-1000)
- Max 1240, `padding:40px 48px 100px`, 6-column grid, gap 12 (2 columns at ≤980, 1 at ≤768).
- Card base: `rgba(255,255,255,.028)`, `1px solid rgba(250,245,237,.07)`, radius 20, `28px 28px 24px`. Hover: border `rgba(48,205,215,.18)`, `-3px`.
- Card labels: `.56rem/800`, `ls .24em`.
- Overview card: full width, 2 columns, padding 40. Ghost code `clamp(6rem,14vw,11rem)` at `rgba(48,205,215,.045)`.

**Agenda card** (459-560, 1058-1087)
- TBA state: `border-left:3px solid rgba(255,55,80,.55)` with a red tint and a red "To be announced" pill.
- `.has-agenda`:
  - `border-left:4px solid teal`
  - `linear-gradient(135deg, rgba(48,205,215,.09) 0%, rgba(0,30,87,.04) 60%, transparent)`
  - `box-shadow:0 0 0 1px rgba(48,205,215,.18), 0 0 60px rgba(48,205,215,.08), inset 0 0 40px rgba(48,205,215,.03)`
  - Columns `200px 1fr`, padding 44 top and bottom
- List: number `.7rem/900` teal in a 52px column; text `clamp(1.25rem,2.4vw,1.75rem)/800`, `lh 1.4`; rows `padding:20px 0` with hairlines.

**Background guide card `.bento-guide-card`** (692-789)
- Spans 3 columns, `background:#020c14`, `border:1px solid rgba(48,205,215,.18)`, radius 20, `min-height:250px`, `box-shadow:0 6px 32px rgba(0,0,0,.5)`.
- Full-bleed photo, a top fade 80px `rgba(0,5,15,.7)`, and a bottom gradient `rgba(0,5,15,.95) 0 → .75 28% → .3 55% → transparent`.
- Type pill: `.48rem`, `background rgba(0,10,25,.55)`, **blur 10px**.
- Name `1.25rem/900`; topic `.7rem` at `rgba(.45)`; status `.52rem` teal.
- Hover: `-6px`, border `.45`, glow, photo `scale(1.07)` over `.55s`.

**EB cards** (791-930)
- The row is a 2-column grid (set inline by JS). Each card is horizontal: photo panel `width:clamp(220px,32%,320px)`, `max-height:340px`.
- Placeholder gradients by role: chair teal `rgba(48,205,215,.2)→rgba(0,48,87,.55)`, vice gold, rapporteur teal-light.
- Body `20px 22px`: name `.95rem/800`; role `.56rem/800`, `ls .18em`, coloured per role; description `.7rem`, `lh 1.65`, clamped to `max-height:6.6em`.
- "Read more" expands to 2000px over `.9s`.
- Mobile: stacked, photo 220px tall.

---

## 15. secretariat.html

- **Hero**:
  - `min-height:72vh`, eyebrow `.65rem` with 28×1px rules.
  - **Title "Meet the<br><em>Secretariat</em>"**: `clamp(3.2rem,8vw,7.5rem)/900`, `lh .95`, `ls -.04em`, `text-shadow:0 0 80px rgba(48,205,215,.2), 0 0 160px rgba(48,205,215,.08)`. The em is teal and non-italic.
  - Sub `clamp(.85rem,1.5vw,1.05rem)` at `rgba(.55)`.
  - A "Scroll" indicator.
  - Page background: navy plus a 28px dot grid `rgba(48,205,215,.04)` and four large fixed blue orbs.
- **Grid** (344): 3 columns, gap 20, max 1100 (2 columns, gap 12 at ≤768; gap 10 at ≤480).
- **Card `.sec-card`** (411):
  - `aspect-ratio:4/5; border-radius:16px; overflow:hidden`
  - Reveal stagger 50ms (IntersectionObserver .06); hover `translateY(-5px)`
- The front is a pre-designed photo card: `img.card-front-photo{object-fit:contain;background:#001428}`, with the name printed into the image.
- **There is no signature slot** anywhere on the page.
- **Flip** (424-431):
  - `.card-inner{transform-style:preserve-3d; transition:transform .65s cubic-bezier(.4,0,.2,1)}`; `.flipped` sets `rotateY(180deg)`.
  - Both faces have `backface-visibility:hidden`.
  - **There is no `perspective` on `.sec-card`**, so the flip looks flat.
  - The trigger is a **click anywhere on the card (toggle)**. A "✕" on the back closes it, and clicking the Instagram button doesn't flip.
  - The cursor capsule reads "Flip".
  - Divs only, no keyboard support.
- **Back face** (434-450):
  - `linear-gradient(145deg,#001e3c 0%,#002d52 55%,#003566 100%)`, `1px solid rgba(48,205,215,.2)`, centred column, gap 16, padding 24
  - Top 2px hairline `rgba(48,205,215,.6)` centre
  - Name `.95rem/800`; role `.55rem/700`, `ls .18em` teal
- **Instagram button** (452-461): full width, `padding:10px 0; radius 10`, `linear-gradient(135deg,#833ab4 0%,#fd1d1d 50%,#fcb045 100%)`, white `.62rem/800`, `ls .1em`, 13px glyph, label "View Post". Hover opacity .85 and `-1px`.
- Data is an inline `members[]` array (1256) of 19 entries (name, role, photo, ig).

---

## 16. allocations.html

- **Title** (192): "Committee" / "Allocations." on two block lines, the second teal; `clamp(3.8rem,8vw,8rem)/900`, `ls -.05em`, `lh .88`. It sits inside `.alloc-title-wrap{border-left:3px solid rgba(48,205,215,.38);padding-left:28px;margin-left:-31px}`, which hangs the bar outside the text column.
- Meta bar: tag pill `.52rem` teal with background `.08` and radius 6, 1×14 separators, grey text `.52rem` at `rgba(.22)`.
- Description `.9rem` at `rgba(.38)`.
- **Rounds list** (206): `.82rem` at `rgba(.65)`. Each `li` has a 6px teal dot with `box-shadow:0 0 8px rgba(48,205,215,.6)`. `strong` is white with `min-width:110px`. There are four rounds: Priority, First, Second and Third.
- Status pill "Registration Open" (teal outline, glow). Stats bar `1.75rem/900` with `.5rem` labels and 1px dividers.
- **Matrix card** (426-560):
  - The section has a 48px grid-line background (`rgba(48,205,215,.035)`) and a top hairline.
  - `.alloc-cta-wrap`: max 620, `padding:52px 56px`, `background:rgba(48,205,215,.04)`, `border:1px solid rgba(48,205,215,.14)`, radius 24, `box-shadow:0 0 80px rgba(48,205,215,.08), inset 0 1px 0 rgba(48,205,215,.1)`, with a 320×180 radial glow above.
  - Icon tile 60px, radius 16.
  - Title 2rem/900.
  - Button: `linear-gradient(135deg,#30CDD7,#1E96A5)`, radius 14, `16px 36px`, `.82rem/800`, `box-shadow:0 6px 32px rgba(48,205,215,.5)`. It links to SharePoint.

---

## 17. resources.html

- **Title "Resources."** (282): `clamp(3rem,6vw,5rem)/900`, `ls -.03em`, `lh .95`. The hero is a flex row: the left has kicker and sub; the right has "XVI" at 4rem `rgba(.07)` and a pill "All Background Guides Out Now". An animated 1px underline sits below.
- Extras:
  - Marquee strip: 50s, items `.54rem` at `rgba(48,205,215,.4)`, edge fades `#020C16`
  - Stats bar: 4 columns, numbers 2.6rem teal
  - Section numbers "01"–"04" at 4.2rem `rgba(48,205,215,.09)`
- **Filter chips** (857): `.55rem`, background `rgba(48,205,215,.05)`, border `.16`, radius 100. Active: background `.15`, border `.4`, teal text. Counts sit in small badges. Filtering is done with a blur-and-fade JS.
- **Guide cards** (`.guide-card`, 371-490): identical to the committee bento guide card above (photo, gradients, blurred type pill, `-6px` + `scale(1.07)` hover). Grid: 3 columns (2 at ≤900, 1 at ≤768).
  - Status: `.guide-status.ready{color:teal}` / `.soon{rgba(.32)}`. The markup only puts `.ready` on the card, so "Available" actually inherits the ink colour.
- **IP style guide cards**: the same component, "Journalism" (`committee_photos/IP.webp`) and "Photography" (`/ip_photography.webp`).
- **Essential document cards** (`.doc-card`, 500-575):
  - Gold-tinted: `linear-gradient(135deg, rgba(188,154,110,.1), rgba(0,20,50,.3))`, `border rgba(188,154,110,.18)`, radius 20, `32px 28px`, `backdrop-filter:blur(12px)`
  - 56px gold icon tile, "PDF" gold pill, arrow turning teal and `+4px` on hover
  - Grid: 2 columns, max 760
  - Rules of Procedure → `Oakridge MUN Rules.pdf`; Delegation Guidelines → `Oakridge MUN Guidelines New.pdf`; ROP Presentation → `ROP Presentation.pdf`
- **Research links** (gold-tinted `.link-card`, 3 columns, resources.html:1534-1590):
  1. United Nations Official Site: https://www.un.org
  2. UN Research Guides: https://research.un.org
  3. UN Digital Library: https://digitallibrary.un.org
  4. International Law & Justice: https://www.un.org/en/global-issues/international-law-and-justice
  5. UN News: https://news.un.org/en/news
  6. UN Treaty Collection: https://treaties.un.org/pages/showdetails.aspx?objid=0800000280158b1a

---

## 18. social-night.html, and networking-hour.html (yes, it is the "event page" layout)

**Social Night**
- Palette: `--g1 #FFD700`, `--g2 #E8A020`, `--g3 #BC9A6E`, `--g4 #FFF0A0`, `--g5 #C8780A`; backgrounds `#180B00` / `#1E0D00` / `#130800`.
- The nav pill is re-themed: `rgba(20,10,0,.92)`, border `rgba(255,200,0,.13)`, gold "MUN".
- **Hero** (101-168):
  - `min-height:100vh; padding:120px 64px 80px`
  - Background `radial(ellipse at 65% 35%, rgba(255,180,0,.18), transparent 48%), radial(at 15% 75%, rgba(200,120,10,.14), transparent 42%), linear-gradient(150deg,#2E1400,#1C0A00 45%,#0F0500)`
  - `.hero-inner` grid `1fr auto`, gap 60, max 1100
  - Left: back link, kicker (`--g2`), title "Social<br>Night." `clamp(4rem,8vw,7rem)/900`, `lh .9`, then "Golden Solstice" in `clamp(2rem,4.5vw,3.6rem)` with gradient `135deg g4 → g1 40% → g2` plus a breathe animation and a gold drop-shadow, then description and gold pills
  - Right: "SN" outline text `clamp(7rem,14vw,12rem)` with stroke `rgba(255,200,0,.1)`
  - `.sun-ring`: 460px, `1.5px solid rgba(255,200,0,.18)`, spinning 55s, with an inner ring reversing at 35s and a 5s glow pulse. **An inline `style="position:relative"` overrides its `absolute`.**
- **Particles** (755-810): a full-screen fixed `<canvas id="pc">` with 180 particles in 5 gold RGBs.
  - Radius .6–2.8, fall `vy` .25–.95 px/frame, sine sway, opacity .2–.75.
  - Each particle draws a radial halo at r×5 plus a core dot.
  - The rAF runs forever, with **no reduced-motion check**.

**Networking Hour hero** (CSS 102-253; HTML 820-848)
- `min-height:100vh; padding:140px 64px 100px`.
- Background: video `/tnh_video.mp4` at opacity .22, overlay `linear-gradient(135deg, rgba(0,48,87,.75) 0%, rgba(0,48,87,.45) 55%, rgba(0,48,87,.25) 100%)`, and two teal orbs.
- `.hero-inner`: max 1100, **grid `1fr 1fr`, gap 80, align start**.
- Left column:
  - Back link `.6rem` at `rgba(.38)`
  - Kicker `.6rem/700`, `ls .2em` teal, with a 28×2px rule before it
  - **Title "The<br><em>Networking</em><br>Hour."**: `clamp(3rem,6vw,5.2rem)/900`, `ls -.03em`, `lh .95`, with the em teal and upright
  - Description `clamp(.88rem,1.3vw,1rem)`, `lh 1.8`, `rgba(.6)`, max 480
  - Teal outline pill badges
  - **Two buttons**:
    - `.btn-primary`: gradient at **135deg**, radius **14** (not a pill), `14px 28px`, `.72rem/800`; hover `-2px` with `0 12px 32px rgba(48,205,215,.28)`
    - `.btn-ghost`: `1.5px solid rgba(48,205,215,.3)`, radius 14, `13px 26px`, white text
- Right column: **`#globe-container` 480px square** (280px on mobile) with a `::before` radial glow at inset -15%.
  - It is rendered with **Three.js 0.160 + three-globe 2.31.1**, loaded through an importmap (jsdelivr/esm.sh), plus an earth-night texture from unpkg.
  - OrbitControls autorotate is on; rings refresh every 2000ms.
- Mobile: 1 column.

---

## 19. Cross-cutting

- **Fonts**: Google Fonts Montserrat only.
  - index: `ital,wght@0,300…900;1,400;1,700`
  - committees and committee: `wght@300..900` (no italics)
  - others: `+1,400`
  - `font-family:'Montserrat'` is declared with **no fallback** stack.
- **Lenis**: `<script src="https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js">` (the old package name). Options:
  - `new Lenis({lerp:.11, smoothWheel:true, wheelMultiplier:.95, normalizeWheel:true, infinite:false})`, driven by a manual rAF loop.
  - Skipped entirely when `(pointer:coarse)`.
  - Under reduced motion, index skips it and subpages use `{smoothWheel:false}` (index.html:4308-4325).
- **Custom properties** (index.html:60-70, the same in committees): `--navy #003057`, `--teal #30CDD7`, `--teal-dark #1E96A5`, `--teal-light #B4EBF5`, `--red #FF3750`, `--white #FAF5ED`, `--yellow #FFCB00`, `--gold #E1AA28`, `--peach #F0B4A0`.
  - Other pages define **`--gold:#BC9A6E`**.
  - delegation-guidelines adds `--dark:#001223`; social-night has its own `--g1..g5`, `--bg..bg3`.
  - The runtime sets `--nav-bottom`.
- **Breakpoints in use**:
  - `max-width:768` (and the paired `min-width:769`, which also controls `zoom`)
  - 980 (nav condense, committee grid, bento)
  - 1250 / 769–1249 (index nav only)
  - 1024 (hero notifications)
  - 900 (resources grids)
  - 740 (index nav)
  - 600 (committee register card)
  - 480 (committees and secretariat grids)
  - `max-height:700` and `520` (mobile drawer)
- **Reduced motion**: CSS stops the orbs, marquees, sponsor track and globe. The theme section JS shows everything instantly, and Lenis is skipped or unsmoothed. There is **no reduced-motion handling** for the intro morph, the wheel rAF, the cursor capsules, the social-night particles or the networking globe.
- **backdrop-filter**:
  - nav pill 24px; dropdown 32px; mobile drawer 28px (all removed ≤768)
  - hero notifications 18px; countdown tiles 8px (removed on mobile)
  - guide-card type pill 10px; doc and link cards 12px
  - secretariat toast 20px; networking stat pill 20px; IP reg badge 6px; resources PDF modal 18px
- **Smallest type**:
  - `.4rem`: `.btd-card-tag` (index:2631) and the mobile `.cd-label` (2258)
  - `.42rem`: `.cd-label` and the mobile eyebrow/hint text
  - `.44rem`: morph card back label, SOCHUM badge in resources
  - `.47–.49rem`: chip counts and stat labels
  - `.48rem`: guide type pill, reg-closed badge
  - `.4rem` is 6.4px (7.04px with zoom)
- **Body text**: `color:var(--white)` = `#FAF5ED` on navy. Paragraph copy sits at rgba(250,245,237, .38–.82):
  - SG .68 (lead .82); FAQ answers .58; theme caption .7; BTD .42; footer .4–.55; sub-heads .45–.55.

---

## Conflicts with the brief

1. **Wheel auto-advance 2.2s**: wrong. The wheel rotates continuously (0.007 rad/frame, about 0.93s per item, lerp .07) and is scroll-coupled, with no pause conditions. **2.2s is the teal strip's shimmer duration.** The 76px circle is correct (44px on mobile), but the logo images are forced to 90px inside it.
2. **Dropdown 320px**: the "Other" menu (the brief's "More") uses `.nav-drop--events` at **210px**, right-aligned, single column. 320px is the base 3-column variant, which no current menu uses. `rgba(3,10,22,.97)`, radius 16 and the .55s close delay are correct. The blur is 32px, and the mobile background is `rgba(3,12,26,.98)`.
3. **Crest expand "on clicking the crest"**: it is `mouseenter` on `.nav-mark`, only when scrolled, only ≥1250px on index (≥769 on subpages). It collapses on `mouseleave` of the nav. Scroll-up re-expands immediately on any upward delta.
4. **Nav pill padding 8px 10px**: index only. Subpages use `10px 14px` (social-night and networking `10px 14px` too). Scroll threshold 80 is correct except committee.html, which uses **40**.
5. **Overlay gradient**: values match, but the source adds **`mix-blend-mode:multiply`**, and it sits over a video at opacity .35 on `#020810`. Without the blend mode it will look much lighter.
6. **Primary button gradient (180deg)**: correct for nav CTA, hero, tabs, CTA banner and back pill. Other places use **135deg** (allocations button, networking `.btn-primary`, mobile drawer CTA style, popup buttons), and "Explore Committees" uses **solid teal** with radius 8. The networking and allocations buttons use radius 14, not 100px.
7. **Gold**: the brief has none. The source has two: `--gold:#E1AA28` (index, committees) and `#BC9A6E` (all other pages, and every `rgba(188,154,110,…)` tint). The home schedule mixes both: legend and dot use #E1AA28, tints use #BC9A6E.
8. **Breakpoints 1250/980/768/480**: 1250 exists only for index's nav. 980 is barely used. The source also relies on 1024, 900, 740, 600 and the height queries. 769 is a real `min-width` breakpoint because of the zoom.
9. **Secretariat flip .65s and back gradient**: correct (stops 0/55/100 at 145deg). The easing is `cubic-bezier(.4,0,.2,1)`, and there is **no perspective**.
10. **Stats gradient**: correct (stops 0/60/100). The number gradient, tile hover values and Lenis options are all correct; Lenis also sets `normalizeWheel:true` and `infinite:false` and is disabled on coarse pointers.
11. **Logo circles**: confirmed. `public/comm_logos_webp/` holds only `hcc.webp`.
    - The wheel uses **`new_logos/<name> (1).png`** for 15 committees (disec, unsc, unhrc, jcc-1, jcc-2, lok sabha, armageddon, un women, copuos, us senate, unodc, ecofin, fifa, who, ip), URL-encoded as `%20(1).png`, plus `comm_logos_webp/hcc.webp` for HCC.
    - `public/comm_logos/*.png` is **referenced by no page**.
    - new_logos also contains acc, oic, un charter and unga-sochum, all unused.
    - The morph cards use `comm_posts_webp/*` posters.
    - All of these live under `public/` (Vite serves them at root).
12. **Committee photos referenced**: `committee_photos/{disec, unsc, unhrc, jcc-1, jcc-2, hcc, lok_sabha, armageddon, un_woman, copous, us_senate, unodc, ecofin, fifa, who, unga_sochum, IP}.webp`.
    - committees.html:1338-1354 and resources.html:1184-1426 use all of these. committee.html's map omits unga_sochum.
    - Note the misspelled `copous`, `un_woman` and uppercase `IP`.
    - The `.jpg` twins are unused.
13. **Teal top strip**: index only, not site-wide. It is `#1a8899 → #30CDD7 → #1a8899` (90deg), not a flat teal.

## Gotchas / risks

- **`html{zoom:1.1}` ≥769px** on every page. All measurements are 10% bigger on desktop. `zoom` also distorts `getBoundingClientRect`/`clientX` maths in some engines (Firefox only supports it from v126).
- **Removing the intro**: `#heroArcContent` is `opacity:0` in CSS and `.hero-xvi-bg` is `opacity:0` until JS adds `.visible`. Both must be made visible statically. Also drop the body `position:fixed` lock, the hash-link interception and `_skipAnim`.
- Theme section: on `(pointer:coarse)` devices wider than 768px (an iPad in landscape), the JS takes the mobile branch but the CSS keeps the 340vh sticky container, leaving lots of dead scroll. The desktop branch is one-way (it stops at p ≥ .95). Animating `filter:blur()` on gradient-clipped text is expensive.
- SG photo column is a 380px float with **no mobile override**, so it overflows or is clipped on phones (2270 targets a grid that doesn't exist).
- Wheel logos at 90px inside 76px/44px circles are cropped, with per-logo hand-tuned `translate` nudges. The `.ctrl-chain-watermark` crest never renders. The rAF never stops.
- Accessibility:
  - The FAQ and secretariat cards are clickable divs with no aria, roles or keyboard support.
  - The dropdown is hover-only.
  - Nav CTAs are `<button onclick>` used for navigation.
  - Type goes down to .4rem.
- `.mobile-nav-cta` is only styled under `.mobile-reg-accordion`, which doesn't exist in the markup. The drawer's "Get Your QR Code" therefore renders as a plain link.
- The light italic word in "More than *debate.*" asks for italic 300, but index only loads italic 400/700, so it renders as regular italic. Load `ital,wght@1,300` if you want the intended look.
- Committees filter: `data-type="council"` (UNSC) and `"agency"` (WHO) match no chip, so they only appear under "All". Status labels don't always match `data-type`.
- `/committees/<slug>` URLs depend on host rewrites. In Eleventy, generate one page per committee from data instead of the path-parsing JS.
- `content-visibility:auto` and `contain-intrinsic-size` on several home sections can cause scroll-length jumps with Lenis.
- Duplicated per-page CSS has drifted: nav padding, logo colour, z-index, thresholds, footer variant, two `--gold` values, and repeated `@media 768` blocks where later rules override earlier ones (for example the countdown).
- networking-hour shows a full-screen loader with `body{overflow:hidden}` until the WebGL globe renders. If the CDN or WebGL fails, there is no timeout fallback and the page stays locked.
- social-night: the inline `position:relative` breaks the absolutely positioned sun ring, and the particle canvas ignores reduced motion.
- `xvi.svg`, `logo.png`, `sg_signature.svg` and the videos weren't inspected; they are binary or not in the sparse checkout. The XVI watermark is an external SVG, not CSS text.

## CSS worth porting (cleaned, with refs)

- **Tokens**: navy, teal, teal-dark, teal-light, ink `#FAF5ED`, marquee `#27b0bd`, chip `#003d6e`/`#1a5a90`/`#004a85`. Pick one gold (`#BC9A6E` matches all the tints). (index:60-70, committees:469-540)
- **Pill nav**: `.nav-pill` (index:93-105), `.scrolled` collapse via `opacity:0; max-width:0` with `.3–.6s cubic-bezier(.4,0,.2,1)` (357-363), `.nav-drop--events` with a .55s delayed close and the 20px hover bridge (143-176, 256-273), mobile drawer (2188-2223).
- **Primary button**: `linear-gradient(180deg,#30CDD7,#1E96A5)`, navy text, `0 8px 24px rgba(48,205,215,.25)`; hover `-3px`, `0 14px 32px …45`, `brightness(1.05)`. **Ghost button**: `1px rgba(250,245,237,.14)` → `rgba(48,205,215,.4)` (index:816-844).
- **Eyebrow with teal rules**: `::before`/`::after` 28×1.5px, opacity .8, gap 14 (index:767-783).
- **Hero background stack**: overlay with multiply blend (420-431), 36px dot grid (433-440), three 60px-blur orbs with 18/22/26s alternate keyframes (442-482).
- **Glass countdown tile** (850-866).
- **Gradient number text**: `linear-gradient(135deg,#30CDD7 0%,#B4EBF5 55%,#30CDD7 100%)` with clip and `padding:0 .08em .1em 0` (1291-1307). **Stats tile** (1256-1290).
- **Schedule tint system** using `--dot-color` (1689-1756): dot ring, 3px accent bar at 16% inset, big watermark number, and the mobile card conversion with `:has()` (2479-2560).
- **FAQ height accordion** with rotating + toggle (2025-2084, JS 4021-4036). Wrap it in a `<button aria-expanded>`.
- **Committee tile hover** (committees:574-660): `.6s cubic-bezier(.16,1,.3,1)`, ring + glow shadow, rotated inner frame, photo `scale(1.08)` over .7s, bottom-up navy overlay.
- **Cursor capsule** (committees:796-823, plus the lerp .09 loop at 1570-1586).
- **Guide card** (resources:371-490), **gold doc/link cards** (500-646), **matrix CTA card** (allocations:499-561).
- **Secretariat flip** (secretariat:411-461). Add `perspective:1200px` on `.sec-card`.
- **Social Night card** (index:2657-2690) and the **event hero grid** (networking-hour:102-253). Swap the WebGL globe for a lighter circle if you don't need Three.js.
- **Marquee**: two copies, `translateX(-50%)`, 22s linear (index:905-939). **Sponsor track**: three copies, `-100%/3`, 65s, with an edge mask (1003-1040).
