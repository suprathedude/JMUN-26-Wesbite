# Replace me

Everything on the site that's a placeholder, and what should replace it. [HOW_TO_UPDATE.md](HOW_TO_UPDATE.md) shows how to make each change on GitHub's website.

Two ways to find what's left:
- **Search for `TBC`** in `src/_data/`. Every placeholder value contains it; there were 87 at the last count (2 October).
- **Look for `""`.** An empty value means "not set yet": a photo, a link, a name or a PDF that doesn't exist yet. The site handles each one: a "Photo TBC" tile, initials, "EB announced soon", "Coming soon", or a hidden button.

## Before launch

The few that matter most on day one:

| What | Where |
| --- | --- |
| The registration link (Register buttons don't link anywhere until it's set) | `site.json` → `nav.register.url` |
| The contact email | `site.json` → `contact.email`, and the last answer in `faq.json` |
| The announcement bar | `site.json` → `announcement.text` |
| The chapter number ("XIV" is a placeholder) | `site.json` → `chapter`; then remove the note in `chapterNote` |
| The site's real address | `site.json` → `url`, plus the HTTPS switch in `src/.htaccess` ([DEPLOY.md](DEPLOY.md), step 6) |

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
| Committee logo circles (6) | `src/assets/img/logos/<slug>.png` | `public/new_logos/<name> (1).png` | Trimmed to the emblem and resized to 320 px. DISEC, UNSC and UNODC all use the plain UN emblem. UNCSW, UNICEF, FCC, COPUOS and Doomsday show a globe icon instead. |
| Research link list | `resources.json` → `researchLinks` | OakMUN's Resources page | Six public UN websites. Keep, change or add to them. |

## Placeholder values, file by file

### `site.json`

| Field | Now | Needed |
| --- | --- | --- |
| `chapter`, `chapterNote` | "XIV", "Chapter number TBC" | The real chapter number |
| `url` | "https://TBC" | The live address |
| `announcement.text` | "Registration opens soon (TBC)" | The real announcement |
| `nav.register.url` | "TBC" | The registration link |
| `nav.secondary.url` | `""` (button hidden) | The consent form link; the "Consent form" button appears once it's set |
| `contact.email`, `contact.instagram` | "TBC", `""` | The conference email and Instagram |
| `crest` | `""` | The crest's path (see "Placeholder assets") |
| `hero.video` | `""` | Optional (see the hero row above) |
| `theme` | `enabled: false`, words and caption "TBC" | The theme words, which one is highlighted, the caption, then `"enabled": true` |
| `sgLetter` | One placeholder paragraph; `photo` and `signature` `""` | Vihaan's letter, photo and signature |
| `sponsors` | `[]` | Sponsors, if any; the strip appears with the first one |
| `allocations` | One round, "Date TBC (for registrations received by TBC)"; `status` "Registration opens soon (TBC)"; `matrixUrl` `""`, so the button reads "Opens with Round 1 (TBC)"; `intro` and `matrixText` end "TBC" | The real rounds (name, date, note each), the status, the matrix link, and the two texts without "TBC" |
| `intro.countries` | 24 placeholder countries for the homepage intro | Optional: names from the real allocation matrix |

### `committees.json` (11 committees)

| Field | Now | Needed |
| --- | --- | --- |
| `agenda` | "Agenda TBC" (all 11) | Each agenda |
| `overview` | Two factual sentences ending "(Overview TBC)" (all 11). FCC's and Doomsday's only say they're crisis committees. | The Secretariat's check, then remove "(Overview TBC)"; the crisis premise for FCC and Doomsday |
| `name` of Doomsday | "Doomsday Committee (name TBC)", category Crisis | Its full name, and its category if it isn't a crisis committee |
| `image`, `logo` | `""` for UNCSW, UNICEF, FCC, COPUOS and Doomsday; borrowed for the rest | OakJMUN photos and logo circles |
| `guide.file` | `""` (all 11), shown as "Coming soon" | Each background guide PDF |
| `eb` | Three roles per committee with `name`, `photo` and `bio` all `""`, shown as "EB announced soon" | Each chair's name, photo and bio |

### `secretariat.json` (14 people)

| Field | Now | Needed |
| --- | --- | --- |
| `name` of person 14 | "Name TBC" (the second USG of Technology) | Their name |
| `photo`, `signature` | `""` for everyone; cards show initials in a teal ring | Photos (and signatures, if you want them on the cards) |
| `blurb` | `""` for everyone, shown as "Profile TBC." (the text is `secretariatPage.blurbTBC` in `site.json`) | One short line each |
| `instagram` | `""` for everyone; the back of a card has no Instagram button | Handles, if they want them shown |

### `schedule.json`

| Field | Now | Needed |
| --- | --- | --- |
| `start`, `end` | "TBC" for all 14 events | The times, written like "8:00 am" |
| `note` | "Times TBC. The order of the closing ceremony and Social Night is also TBC." | Update or set to `""` once final; reorder the two Day 2 events if needed |

### `faq.json`

| Question | Now |
| --- | --- |
| How do I register? | "Registration details TBC..." |
| What's the dress code? | "Dress code TBC." |
| Who do I contact? | "Email the Secretariat. Address TBC." |

### `resources.json`

| Field | Now | Needed |
| --- | --- | --- |
| `documents` (Rules of Procedure, Delegation Guidelines, Consent Form) | Descriptions end "(TBC)"; `file` `""`, shown as "Coming soon" | The PDFs, and the descriptions checked |

### `socialNight.json`

| Field | Now | Needed |
| --- | --- | --- |
| `time` | "TBC" | Start and finish time |
| `dressCode` | "Costumes TBC" | The costume rules |
| `expect` | Ends "Programme TBC." | The programme, briefly |
| `photoBoothImage` | `""`, shown as "Photo TBC" | A photo of the 3D photo booth |
| `faq` answers | All four contain "TBC" | Costume rules, times, whether parents can come, how photos are sent |

### `newToMun.json`

| Field | Now | Needed |
| --- | --- | --- |
| `checklist` item 4 | Position papers "(TBC)" | Whether committees ask for one |
| `onTheDay` | Laptops "(TBC)", the phone rule "TBC", registration place and time "TBC" | The real rules and place |
| `note` | "Procedure may differ slightly at OakJMUN. Check with USG Policy (TBC)." | USG Policy checks the steps, phrases and glossary against OakJMUN's rules of procedure, then updates or removes the note |
