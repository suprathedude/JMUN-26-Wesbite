# Replace me

Everything on the site that's a placeholder, and what should replace it. [HOW_TO_UPDATE.md](HOW_TO_UPDATE.md) shows how to make each change on GitHub's website.

Two ways to find what's left:
- **Search for `TBC`** in `src/_data/`. Every placeholder value contains it; there were 35 at the last count (3 October).
- **Look for `""`.** An empty value means "not set yet": a photo, a link, a name or a PDF that doesn't exist yet. The site handles each one: a "Photo TBC" tile, initials, "EB announced soon", "Coming soon", or a hidden button.

## Before launch

The few that matter most on day one:

| What | Where |
| --- | --- |
| The registration link (Register buttons don't link anywhere until it's set) | `site.json` → `nav.register.url` |
| The consent form link (the "Consent form" button stays hidden until it's set) | `site.json` → `nav.secondary.url`, or the PDF in `resources.json` → `documents` |
| The announcement bar | `site.json` → `announcement.text` |
| The HTTPS switch, once oakridgejmun.com has its SSL certificate | `src/.htaccess` ([DEPLOY.md](DEPLOY.md), step 6) |

## Placeholder assets made for this site

| What | Where | Replace with |
| --- | --- | --- |
| Crest: a teal ring with "XIV" (PLAN.md D7) | `src/_includes/partials/crest.njk`, shown in the nav and footer | The OakJMUN crest as an SVG. Put it in `src/assets/` and set `"crest"` in `site.json` to its path. |
| Favicon: a teal ring on navy | `src/assets/favicon.svg` | The crest, simplified so it reads at 16 px |
| "Photo TBC" tiles | Wherever a photo field is `""` | Real photos (see the tables below) |

## Borrowed from OakMUN

SPEC 7.4 allows generic UN-room photos and committee logo circles from `srijai-k/FINAL-OAKMUN` (MIT licence; a copy is in `docs/OAKMUN-LICENSE.txt`). The footer credits the original design. Replace these with OakJMUN's own when they exist.

| What | Our file | OakMUN source | Notes |
| --- | --- | --- | --- |
| Hero background (PLAN.md D4) | `src/assets/img/hero/hero-placeholder.jpg` | `public/committee_photos/unsc.jpg` | The General Assembly hall, cropped, black and white, softened. Replace it with a photo or short video of the MPH or a committee room. **Photo:** upload it and set `hero.image` in `site.json`. **Video (20 s or less):** this needs a laptop. Save it as `src/assets/video/source/hero.mp4` and run `npm run media`, which makes `src/assets/video/hero.av1.webm`, `hero.h264.mp4` and a poster image. Commit those, then set `hero.video` to `assets/video/hero` and `hero.image` to `assets/img/hero-poster.jpg`. |
| Committee photos (6) | `src/assets/img/committees/<slug>.jpg` | `public/committee_photos/` (`unsc`, `disec`, `unhrc`, `lok_sabha`, `who`, `unodc`) | Made black and white (PLAN.md D2). UNCSW, UNICEF, FCC, COPUOS and Doomsday have none and show "Photo TBC". |
| International Press photo | `src/assets/img/resources/ip.jpg` | `public/committee_photos/IP.jpg` | Microphones held out to a speaker, no faces. On the Style guides card on Resources. |
| Committee logo circles (6) | `src/assets/img/logos/<slug>.png` | `public/new_logos/<name> (1).png` | Trimmed to the emblem and resized to 320 px. DISEC, UNSC and UNODC all use the plain UN emblem. UNCSW, UNICEF, FCC, COPUOS and Doomsday show a globe icon instead. |
| Research link list | `resources.json` → `researchLinks` | OakMUN's Resources page | Six public UN websites. Keep, change or add to them. |

## Placeholder values, file by file

### `site.json`

| Field | Now | Needed |
| --- | --- | --- |
| `announcement.text` | "Registration opens soon (TBC)" | Kept for now; change it as news comes out |
| `nav.register.url` | "TBC" | The registration link |
| `nav.secondary.url` | `""` (button hidden) | The consent form link; the "Consent form" button appears once it's set |
| `crest` | `""` | The crest's path (see "Placeholder assets") |
| `hero.video` | `""` | Optional (see the hero row above) |
| `theme` | `enabled: false`, words and caption "TBC" | The theme words, which one is highlighted, the caption, then `"enabled": true` |
| `sgLetter` | One placeholder paragraph; `photo` and `signature` `""` | Vihaan's letter, photo and signature |
| `sponsors` | `[]` | Sponsors, if any; the strip appears with the first one |
| `allocations` | One round, "Date TBC (for registrations received by TBC)"; `status` "Registration opens soon (TBC)"; `matrixUrl` `""`, so the button reads "Opens with Round 1 (TBC)"; `intro` and `matrixText` end "TBC" | The real rounds (name, date, note each), the status, the matrix link, and the two texts without "TBC" |
| `intro.countries` | 24 placeholder countries for the homepage intro | To be reworked |

Done on 3 October: `url` (https://oakridgejmun.com), `contact.email` (jmun@oakridge.in), `contact.instagram` (oakjmun), `chapter` (XIV, confirmed), the conference times (7:45 am on 30 October to 7:30 pm on 31 October).

### `committees.json` (11 committees)

| Field | Now | Needed |
| --- | --- | --- |
| `agenda` | "Agenda TBC" (all 11) | Each agenda |
| `image`, `logo` | `""` for UNCSW, UNICEF, FCC, COPUOS and Doomsday; borrowed for the rest | OakJMUN photos and logo circles |
| `guide.file` | `""` (all 11), shown as "Coming soon" | Each background guide PDF |
| `eb` | Three roles per committee with `name`, `photo` and `bio` all `""`, shown as "EB announced soon" | Each chair's name, photo and bio |

The overviews are final. FCC's and Doomsday's say the scenario is announced with the agenda; update them then.

### `secretariat.json` (14 people)

| Field | Now | Needed |
| --- | --- | --- |
| `photo`, `signature` | `""` for everyone; cards show initials in a teal ring | Photos (and signatures, if you want them on the cards) |
| `blurb` | `""` for everyone, shown as "Profile TBC." (the text is `secretariatPage.blurbTBC` in `site.json`) | One short line each |
| `instagram` | `""` for everyone; the back of a card has no Instagram button | Handles, if they want them shown |

### `schedule.json`

Final as of 3 October: both days, with times.

### `faq.json`

| Question | Now |
| --- | --- |
| How do I register? | "Registration details TBC..." |
| What's the dress code? | "Western formals on Day one and traditional wear on Day two (TBC)." Remove "(TBC)" once confirmed. |

### `resources.json`

| Field | Now | Needed |
| --- | --- | --- |
| `documents` (Rules of Procedure, Delegation Guidelines, Consent Form) | Descriptions end "(TBC)"; `file` `""`, shown as "Coming soon" | The PDFs, and the descriptions checked |
| `ip.guides` (Journalism, Photography) | Descriptions end "(TBC)"; `file` `""`, shown as "Coming soon" | The PDFs, and the descriptions checked |

### `socialNight.json`

| Field | Now | Needed |
| --- | --- | --- |
| `dressCode` | "Costumes TBC" | The costume rules |
| `expect` | Ends "Programme TBC." | The programme, briefly |
| `photoBooth`, `photoBoothImage` | `""`, so the photo booth section is hidden | A sentence about the booth and a photo of it, if it's confirmed |
| `faq` | "Do I have to wear a costume?" is "Costume rules TBC." | The costume rules |

### `newToMun.json`

| Field | Now | Needed |
| --- | --- | --- |
| `onTheDay` | "The exact phone rule is TBC."; registration "(place TBC)" | The phone rule, and where registration is |
