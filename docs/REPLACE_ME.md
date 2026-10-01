# Replace me

Everything on the site that's a placeholder, and what should replace it. Search the project for "TBC" to find every placeholder value in `src/_data/`. Task 10 finishes this list; each task adds what it introduces.

## Placeholder assets (made for this site)

| What | Where | Replace with |
| --- | --- | --- |
| Crest: teal ring with "XIV" (PLAN.md D7) | `src/_includes/partials/crest.njk`, shown in the nav and footer | The OakJMUN crest as an SVG. Put it in `src/assets/` and set `"crest"` in `src/_data/site.json` to its path. |
| Favicon: teal ring on navy | `src/assets/favicon.svg` | The crest, simplified to read at 16 px. |

## Borrowed from OakMUN

None yet. Task 5 adds the committee photos and logo circles allowed by SPEC 7.4.

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
