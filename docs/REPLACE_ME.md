# Replace me

Everything on the site that's a placeholder, and what should replace it. [HOW_TO_UPDATE.md](HOW_TO_UPDATE.md) shows how to make each change on GitHub's website.

Two ways to find what's left:
- **Search for `TBC`** in `src/_data/`. Every placeholder value contains it; there were 36 at the last count (3 October).
- **Look for `""`.** An empty value means "not set yet": a photo, a link, a name or a PDF that doesn't exist yet. The site handles each one: a "Photo TBC" tile, initials, "EB announced soon", "Coming soon", or a hidden button.

## Before launch

The few that matter most on day one:

| What | Where |
| --- | --- |
| The consent form link (the "Consent form" button stays hidden until it's set) | `site.json` → `nav.secondary.url`, or the PDF in `resources.json` → `documents` |
| The announcement bar | `site.json` → `announcement.items` |
| ~~The HTTPS switch~~ Done 8 October: Cloudflare gives the padlock and sends `http://` to `https://` ("Always Use HTTPS"). Leave the `.htaccess` lines switched off | [CLOUDFLARE.md](CLOUDFLARE.md) |

## Placeholder assets made for this site

| What | Where | Replace with |
| --- | --- | --- |
| ~~Crest~~ Done 4 October: the OakJMUN logo (`src/assets/img/crest.png`, `site.json` → `crest`) | Nav, footer, loading screen | Rebuilt 4 October from your SVG export (a 792 × 842 picture with a transparency mask inside), and served at 64, 128 and 192 px so it stays sharp on high-resolution screens. A true vector file (paths, not an embedded picture) would be sharper still. Was: the OakJMUN crest as an SVG. Put it in `src/assets/` and set `"crest"` in `site.json` to its path. |
| Browser-tab icon: the OakJMUN logo on a navy square (4 October) | `src/assets/favicon.png` | A simplified version, if the tree is hard to see at 16 px |
| "Photo TBC" tiles | Wherever a photo field is `""` | Real photos (see the tables below) |
| Moving grid on Allocations and Resources (11 October) | `src/js/backdrops.js`, `components.css` ("Backdrops") | Adapted from the 21st.dev community component "noise-dark-blue-gradient-with-squares" (rewritten without React). Reuse approved on 21st.dev (13 October). |
| ~~Gallery photos (homepage intro)~~ Done 7 October | `src/assets/img/gallery/oakjmun-01.webp` to `-13.webp`, listed in `site.json` → `gallery.images` | 13 photos from past JMUNs (sent 7 October), 1200 px on the long side. Check the school's photo consent covers the students in them. Was: colour versions of the committee photos. |

## Borrowed from OakMUN

SPEC 7.4 allows generic UN-room photos and committee logo circles from `srijai-k/FINAL-OAKMUN` (MIT licence; a copy is in `docs/OAKMUN-LICENSE.txt`). Srijai Kodali agreed on 3 October that the footer no longer needs to credit the original design; the licence copy stays. Replace these with OakJMUN's own when they exist.

| What | Our file | OakMUN source | Notes |
| --- | --- | --- | --- |
| ~~Hero background (PLAN.md D4)~~ Done 7 October: your 38 s montage (`src/assets/video/hero.av1.webm`, `hero.h264.mp4`), with the frame at 12.5 s (placards up) as `src/assets/img/hero-poster.jpg`, shown until the video starts. Phones get `hero-tall.*` (8 October), a portrait cut from the middle | Was `src/assets/img/hero/hero-placeholder.jpg` | `public/committee_photos/unsc.jpg` | To change it again: **Photo:** upload it and set `hero.image` in `site.json`. **Video (40 s or less):** this needs a laptop. Save it as `src/assets/video/source/hero.mp4` and run `npm run media`, which makes `src/assets/video/hero.av1.webm`, `hero.h264.mp4`, the phone cut `hero-tall.av1.webm` and `hero-tall.h264.mp4`, and a poster image. Commit those, then set `hero.video` to `assets/video/hero` and `hero.image` to `assets/img/hero-poster.jpg`. |
| Research link list | `resources.json` → `researchLinks` | OakMUN's Resources page | Six public UN websites. Keep, change or add to them. |

## Marvel footage on the Doomsday page

The Doomsday committee page opens with the Marvel Studios intro, then a clip of Doctor Doom (PLAN.md F28). Both are Marvel's footage, taken (as you asked, 7 October) from Toshit Sai's fan project, github.com/ToshitSai/Avengers-DoomsDay-, which has no licence. Doom's clip was replaced on 8 October with the 4K copy you sent, and re-encoded sharper from it on 9 October (2560 px wide, and a 998 px wide centre cut for phones). The Marvel intro stays at 1180 px: no larger copy of it is available. They're used at the school's discretion; if Marvel, Disney or the project's author asks, take them down.

| What | Where | To remove it |
| --- | --- | --- |
| The Marvel Studios intro, Doom's clip (wide and tall cuts) and their stills | `src/assets/video/doomsday/` | Delete `"cinematic"` from Doomsday in `committees.json`: the page goes back to the usual photo header. Then delete the folder. |

## Placeholder values, file by file

### `site.json`

| Field | Now | Needed |
| --- | --- | --- |
| `announcement.items` | Since 13 October two messages take turns: "Registrations are open!" (registration form) and "Allocation Round 1 is out!" (`/allocations/`) | Change them as news comes out |
| `nav.secondary.url` | `""` (button hidden) | The consent form link; the "Consent form" button appears once it's set |
| `crest` | `""` | The crest's path (see "Placeholder assets") |
| `hero.video` | `assets/video/hero` (7 October) | Done |
| `theme` | On since 7 October: "Bridge the Divide, / Let the Truth Guide" (`lines`), Bridge and Guide in teal (`highlight`). The `caption` was drafted by Claude at your request | The Secretariat's own caption, if they want one |
| `sgLetter` | Done on 11 October: Vihaan's letter and his portrait (`assets/img/secretariat/vihaan-tallamraju-letter.jpg`); `signature` `""` | Nothing, unless you want his signature under the letter |
| `sponsors` | `[]` | Sponsors, if any; the strip appears with the first one |
| `allocations` | 13 October: Round 1 "Released", Round 2 "Coming soon" (each round has `status`, `label`, and optional `date` and `note`); `matrixUrl` is the public matrix on SharePoint | Round 2's release (set its `status` to `released` and `label` to `Released`), and any later rounds |

Done on 3 October: `url` (https://oakridgejmun.com; changed to https://oakridgejmun.in on 7 October, as the .com is taken), `contact.email` (jmun@oakridge.in; changed to j.mun@oakridge.in on 7 October), `contact.instagram` (oakjmun), `chapter` (XIV, confirmed), the conference times (7:45 am on 30 October to 7:30 pm on 31 October).

### `committees.json` (11 entries: 10 committees and International Press; COPUOS removed 27 October)

| Field | Now | Needed |
| --- | --- | --- |
| `agenda` | Set for every committee (DISEC, UNODC and UNCSW added 15 October, UNHRC 16 October) | Nothing |
| `image` | Supplied 4 October for 11 committees (FCC uses the file named "armageddon"); UNICEF's added 6 October (a UNICEF press photo of two children with UNICEF backpacks) | Nothing, if you're happy using UNICEF's photo; otherwise one of your own |
| `logo` | Supplied 4 October for all 12 | Nothing |
| `guide.file` | `""` (all 12), shown as "Coming soon" | Each background guide PDF |
| `eb` | Three roles per committee with `name`, `photo` and `bio` all `""`, shown as "EB announced soon" | Each chair's name, photo and bio |

The overviews are final. FCC's and Doomsday's say the scenario is announced with the agenda; update them then.

### `secretariat.json` (14 people)

| Field | Now | Needed |
| --- | --- | --- |
| `photo`, `photoLabelled` | Done on 11 October: each card shows the person's Secretariat post (`assets/img/secretariat/`), with the name, role, crest and signature already on it, so `photoLabelled` keeps the card's own name for screen readers only. Three names were changed to match the posts: Prateek Kumar Mishra, Naga Krishiv Anantha, Aadya Reddy | Nothing. For a plain photo instead, set `photoLabelled` to `false` and the card prints the name and role over it |
| `quote` | Done for ten of the fourteen (Raaghav's added 13 October) | Aryan, Ridha, Aadya and Aishani have none, by choice for now (their backs show no quote) |
| `post` | Done on 12 October: everyone's button says "View post" and opens their own Secretariat post | Nothing |
| `instagram` | `""` for everyone | Handles, if they want them shown under the role |

### `schedule.json`

Final as of 3 October: both days, with times.

### `faq.json`

| Question | Now |
| --- | --- |
| What's the dress code? | Confirmed 13 October: "Western formals on Day one and traditional wear on Day two." |

### `resources.json`

| Field | Now | Needed |
| --- | --- | --- |
| `documents` | Rules of Procedure and its slides added 14 October (`assets/docs/`); Consent Form ends "(TBC)", `file` `""`, shown as "Coming soon" (Delegate Guidelines removed 23 October: JMUN has no delegations) | The Consent Form PDF, and its description without "(TBC)" |
| `ipGuides` (IP Journalism, IP Photography) | Descriptions end "(TBC)"; `file` `""`, shown as "Coming soon"; IP Photography's photo supplied 4 October | The PDFs, and the descriptions checked |

### `socialNight.json`

| Field | Now | Needed |
| --- | --- | --- |
| `dressCode` | Done 13 October: any costume | Nothing |
| `expect` | Done 13 October: music, dancing, friends, then dinner | Nothing |
| `photoBooth`, `photoBoothImage` | Done 15 October: a group photo from a past Social Night (`assets/img/social/photo-booth.webp`, description in `photoBoothAlt`) | A photo of this year's booth, after the event, if you want it |
| `faq` | Done 13 October: any costume, nothing elaborate | Nothing |
| The moon (`src/assets/img/social/moon.webp`) | Drawn by `scripts/make-moon.mjs`, not a photo | Optional: a photo of the full moon you have the rights to, square, cropped to the disc, transparent or black round it, same file name |

### `newToMun.json`

| Field | Now | Needed |
| --- | --- | --- |
| `onTheDay` | Phones allowed (13 October); registration "(place TBC)" | Where registration is |
| `checklist` (lead-in) | Online, 29 October; "The time and the meeting link are TBC." | The time and the link |
| `training` | 16, 21 and 26 October, 6:00 pm. Session 1 done, with its recording (Google Drive) and slides (Canva) since 16 October; sessions 2 and 3 have `recording` and `slides` `""`, shown as "Recording coming later" and "Slides coming later" (on New to MUN and Resources) | The recording and slides for sessions 2 and 3 |
| `intro.photo` | A delegate raising a placard (`src/assets/img/ntm/delegate.webp`, sent 7 October): a past Oakridge delegate, cut out. | Check the school's photo consent covers this student. To swap it, use a cut-out (transparent background) cropped at the desk, same file name, and update `alt` |
