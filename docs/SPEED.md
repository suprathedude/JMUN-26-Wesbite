# Speed

How the site stays quick, what was fixed on 16 October, and how to check it.

## Check it

`npm run build`, then `npm run perf` (or `npm run perf -- /committees/ --phone`). It opens each page
on a processor slowed 4 times, like an ordinary school laptop, and prints:

| Column | Good |
| --- | --- |
| FCP, LCP | when the first text and the largest picture show; under a second here |
| loader | when the loading screen went (it only shows after 0.6 s) |
| TBT | how long the page was too busy to answer a click while loading; under 200 ms |
| CLS | how much the page jumped while loading; under 0.1 |
| idle | work done per second while nobody touches the page; near 0 |
| scroll | slow frames while scrolling the whole page |
| click | time from a click in the nav to the next page being usable |

There's no graphics chip in the cloud test machine, so real laptops do better than these numbers.
Compare runs with each other.

## What was fixed (16 October)

Measured before and after on the slowed processor:

| | Before | After |
| --- | --- | --- |
| Work while idle, Committees | 305 ms a second | 16 ms |
| Work while idle, Home | 152 ms a second | 28 ms |
| Work while idle, Resources and Allocations | about 975 ms a second | 3 and 18 ms |
| Busy while loading, Resources | 971 ms | 114 ms |
| Page jump while loading, Resources | 0.15 | 0 |

- **Hidden animations.** The phone menu's shiny button kept turning while the menu was closed,
  the top bar's flashing dot kept pulsing while its message was hidden, and the glow in Home's
  "More than debate" kept drifting while the browser was skipping that section. A browser can't
  hand a hidden animation to the graphics chip, so it restyled the whole page 60 times a second for
  each of them, on every device. They now hold still while hidden.
- **The moving grid** on Resources and Allocations was a full-screen picture redrawn 60 times a
  second. It's now CSS that the graphics chip moves, and looks the same.
- **Smooth scrolling (Lenis)** asked for a new frame 60 times a second even when the page was
  still. It now sleeps until the wheel turns.
- **The loading screen** waited for every photo, so it flashed up on most clicks. It now goes as
  soon as the page's text, styles, scripts and font are in; photos fade in as they arrive.
- **Pages open at once.** Resting the pointer on a link makes Chrome and Edge build that page in
  the background (speculation rules in `src/_includes/layouts/base.njk`), so the click shows it
  straight away. The homepage, Social Night and Doomsday (video, 3D) are only fetched ahead, not
  built. Entrance animations wait until the page is actually opened.
- **Video.** The background videos use AV1 only where the device decodes it with its graphics
  chip; elsewhere (most laptops from before 2020) H.264, which every graphics chip decodes.
  Decoding AV1 on the processor made pages stutter.
- **A glow on Resources** was placed by the page's height, so it moved while the page was still
  arriving and counted as the page jumping. It's placed by its own section now.

## Opening a committee (16 October)

From a click on a committee to its page being open took 1.6 to 2.5 seconds (measured in Chrome
with the page held back half a second, as GoDaddy does). The time went on the page-to-page
animation (view transitions): the crossfade, and the committee's photo growing into the page's
header. The browser held the new page back about 0.3 s to set it up, then played it for 0.8 s.
Both are gone: the next page shows the moment it's ready.

| From a click on a committee to its page open | Before | After |
| --- | --- | --- |
| Page held back half a second (GoDaddy, nothing kept by Cloudflare) | 1.6 to 2.5 s | 0.6 s |
| Page answered at once (Cloudflare keeping it) | 1.2 s | 0.1 s |

In Chrome and Edge, resting the pointer on a committee for a moment also builds its page in the
background (speculation rules), so it opens at once even from GoDaddy. Test tools turn that off,
so the table doesn't count it. On phones, and for a quick click, the half second of waiting for
GoDaddy is what's left; the Cloudflare **Cache pages** rule (docs/CLOUDFLARE.md) removes it.

`npm run perf -- --delay 500` runs the speed check with every page held back half a second.

## Keep it fast

- No page-to-page animations (view transitions): they hold every new page back.
- Animate only `transform` and `opacity` (CLAUDE.md). Anything that animates inside something
  hidden (`visibility: hidden`, a closed menu, a message that isn't showing) needs
  `animation-play-state: paused` while hidden.
- Don't animate inside a section with `content-visibility: auto` (on Home: the committee ring, More
  than debate, FAQ, sponsors).
- Don't redraw a canvas every frame for something CSS can do.
- Never place a decoration by a percentage of a long page's height.
- Big scripts load only when needed (the 3D intro, the committee ring, the Social Night portal).
- After a change, run `npm run perf` and compare with the table above.

## What only the site's owners can do

- Cloudflare: the **Cache pages** rule, the purge token, Smart Tiered Caching, HTTP/3, and Rocket
  Loader off (docs/CLOUDFLARE.md). Pages then come from Cloudflare in India in a few tens of
  milliseconds instead of GoDaddy's server in Singapore (about half a second).

## Not done yet

- The 3D intro's script is 1.1 MB (React and the whole of Three.js). Rewritten in plain
  Three.js, it would be about half that. It only loads on the first homepage visit of a session.
