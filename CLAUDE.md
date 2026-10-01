# OakJMUN 2026 website

Static site for Oakridge Junior MUN 2026 (30 and 31 October 2026, Oakridge International School, Gachibowli). The full brief is in `SPEC.md`; read the task you're given there before acting. Reference screenshots of the site we're matching (Oakridge MUN XVI) are in `reference/`.

## Stack and commands
- Eleventy 3 (Nunjucks templates), vanilla JS (ES modules), plain CSS. No client-side framework, no Tailwind.
- `npm run dev`: local server at http://localhost:8080
- `npm run build`: production build into `_site/`
- `npm run shots`: Playwright screenshots of every page at 390x844 and 1440x900 into `screenshots/`
- `npm run media`: optimise images and video in `src/assets/` (sharp + ffmpeg)
- `npm run check`: build, then check every internal link in `_site/`
- Deploys to Cloudflare Pages: build command `npm run build`, output `_site`.

## Rules that always apply
- All changeable content lives in `src/_data/*.json`. Never hard-code names, dates, agendas or links in templates.
- Nav, footer and announcement bar exist once, in `src/_includes/partials/`.
- Main colour is OakMUN navy `#003057`, with the OakMUN blue shade ramp in `src/css/tokens.css`. Use tokens, never raw hex values in component CSS.
- IMPORTANT: Follow the anti-slop rules in SPEC.md section 4. No invented slogans, no buzzwords, no lorem ipsum, no emoji icons, no fade-up on every card.
- Animate only `transform` and `opacity`. Respect `prefers-reduced-motion`. Smooth scrolling (Lenis) only on fine-pointer devices.
- Minimum text size: 11px for labels, 16px for body text on phones.
- Every placeholder value contains "TBC" so it can be found with a search.
- British English. No em dashes in any visible copy.
- After every task: run `npm run build` and `npm run shots`, compare the screenshots with the matching files in `reference/`, fix the differences that matter, then commit. Show me the screenshots.
- Don't copy OakMUN's people, photos of students, bios, agendas or letters. Borrowed placeholder assets are listed in `docs/REPLACE_ME.md`.
