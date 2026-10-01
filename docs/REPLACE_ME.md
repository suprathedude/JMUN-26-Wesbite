# Replace me

Everything on the site that's a placeholder, and what should replace it. Search the project for "TBC" to find every placeholder value in `src/_data/`. Task 10 finishes this list; each task adds what it introduces.

## Placeholder assets (made for this site)

| What | Where | Replace with |
| --- | --- | --- |
| Crest: teal ring with "XIV" (PLAN.md D7) | `src/_includes/partials/crest.njk`, shown in the nav and footer | The OakJMUN crest as an SVG. Put it in `src/assets/` and set `"crest"` in `src/_data/site.json` to its path. |
| Favicon: teal ring on navy | `src/assets/favicon.svg` | The crest, simplified to read at 16 px. |

## Borrowed from OakMUN

Allowed by SPEC 7.4 (generic UN-room photos and committee logo circles), taken from `srijai-k/FINAL-OAKMUN` (MIT licence, copy in `docs/OAKMUN-LICENSE.txt`). Replace them with OakJMUN's own when they exist.

| What | Our file | OakMUN source | Notes |
| --- | --- | --- | --- |
| Hero background (PLAN.md D4) | `src/assets/img/hero/hero-placeholder.jpg` | `public/committee_photos/unsc.jpg` | The General Assembly hall, cropped, black and white, softened. Replace with a photo or short video of the MPH or a committee room, then set `hero.image` (or `hero.video`) in `site.json`. |
| Committee photos (9) | `src/assets/img/committees/<slug>.jpg` | `public/committee_photos/` (`disec`, `unga_sochum`, `unhrc`, `unsc`, `who`, `unodc`, `lok_sabha`, `jcc-1`, `IP`) | Converted to black and white by `npm run media` (PLAN.md D2). ECOSOC, UNEP and UNICEF have none and show "Photo TBC". |
| Committee logo circles (9) | `src/assets/img/logos/<slug>.png` | `public/new_logos/<name> (1).png` | Trimmed to the emblem and resized to 320 px. DISEC, UNSC and UNODC all use the plain UN emblem. ECOSOC, UNEP and UNICEF show a globe icon instead. |

## Placeholder values in `src/_data/site.json`

| Field | Now | Needed |
| --- | --- | --- |
| `chapter` | "XIV" (`chapterNote`: "Chapter number TBC") | Confirm the chapter number. |
| `url` | "https://TBC" | The live address once the domain is set up. |
| `announcement.text` | "Registration opens soon (TBC)" | The real announcement. |
| `nav.register.url` | "TBC" | The registration link. Until it's set, Register buttons show but don't link anywhere. |
| `nav.secondary.url` | empty (button hidden) | The consent form link. The "Consent form" button appears once it's set. |
| `contact.email` | "TBC" | The conference email address. |
| `theme` | disabled, "TBC" | The theme words, the highlighted word and the caption, then `"enabled": true`. |
| `sgLetter` | one placeholder paragraph, no photo or signature | Vihaan's letter, photo and signature. |
| `allocations` | one round, dates TBC | The real rounds and the allocation matrix link. |
| `intro.countries` | 24 placeholder countries | Optional: names from the real allocation matrix. |

## Placeholder values in the other data files

| File | What's TBC |
| --- | --- |
| `committees.json` | Every agenda. The two-sentence overviews are factual but need the Secretariat's check (each ends "(Overview TBC)"). Photos and logo circles (Task 5 adds borrowed ones for 9 committees; ECOSOC, UNEP and UNICEF have none). Background guides. EB names, photos and bios. |
| `secretariat.json` | Every photo and Instagram handle, and the second USG of Technology's name. |
| `schedule.json` | Every start and end time, and whether the closing ceremony comes before or after Social Night. |
| `faq.json` | How to register, the dress code, and the contact email. |
| `resources.json` | The Rules of Procedure, Delegation Guidelines and Consent Form files; both International Press style guides and their photos. |
| `socialNight.json` | Start and finish time, costume rules, the programme, the photo-booth picture, and three of the four FAQ answers. |
