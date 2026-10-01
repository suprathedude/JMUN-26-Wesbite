# Reference frames

Frames from a screen recording of the Oakridge MUN XVI site (oakridgemun.in), captured at about 1918 px wide on a desktop browser. They show the look we're matching: colour, scale, spacing, weight and layout. Match the look, not the exact pixels, and never copy the content in them (people, photos, numbers, agendas, letters, slogans).

Things that appear in many frames and must NOT be copied:
- The teal "Get your QR code" strip and the "Get your QR code" nav button. QR is out of scope. The strip becomes our announcement strip (SPEC 8.1) and the button becomes "Register".
- "Liability form" in the nav. Ours is "Consent form" and is hidden until it has a link.
- The OakMUN crest, "XVI" artwork, and every photo of a student.
- Their numbers (667+, 16, 3, XVI). Ours come from `site.json`.

| File | What it shows | Copy | Change or drop |
| --- | --- | --- | --- |
| `01-home-hero-intro-REPLACE.jpg` | The old intro: rotating committee cards around "CREATE, DEBATE, INNOVATE." | Nothing from the animation. | Replaced by the placard intro (SPEC 10). The slogan breaks anti-slop rule 1. The notice stack on the right is removed. |
| `02-home-hero-main.jpg` | Hero after the intro: full nav pill, "OAKRIDGE / MUN" title, meta line, two buttons, countdown, dark photo behind with a navy wash. | Nav pill, title scale and weight, teal second line, meta line with teal rules, button pair, countdown tiles, faint "XVI" watermark (ours says "XIV"). | No orbiting cards, no notice cards on the right. |
| `03-nav-compact-on-scroll-and-theme-intro.jpg` | After scrolling down: the nav has collapsed to the small crest pill. "Presenting the Conference Theme" fills the screen. | The compact nav state exactly. The theme intro type. | Theme content is TBC; show the "announced soon" band while `theme.enabled` is false. |
| `04-home-theme-reveal.jpg` | Theme words revealed, second line in teal, small italic caption below. | Layout, size and the teal gradient on the highlighted word. | Their theme text. No blur animation. |
| `05-home-marquee-and-stats.jpg` | Teal committee marquee, then four gradient stat tiles, then the top of the SG letter. | Marquee colours and type, stat tile gradient, number gradient, label style. | Their numbers. Add the second, slower navy marquee strip under the teal one (SPEC 9.1, item 3). |
| `06-home-sg-letter.jpg` | Letter from the Secretary-General: portrait left, long letter right. | Two-column layout, portrait proportions, heading style, body text size. | The photo and every word of the letter. Body text must be at least ink .75, brighter than theirs. |
| `07-home-schedule.jpg` | "Conference Schedule": day tabs, legend, big "01", timeline rows tinted by type. | All of it: tabs, legend dots, time column, teal line and dots, tinted rows with left accent bar. | Times and events come from `schedule.json`. |
| `08-home-committees-at-a-glance.jpg` | Left: title, two lines, button. Right: vertical wheel of committee names with circle icons, centre one brightest. | The wheel, the fades, the left column. | Their committee names and logos. Ours come from `committees.json`. |
| `09-home-faq.jpg` | FAQ accordion, first item open. | Item radius, spacing, open state, the round + button. | Their questions. Ours come from `faq.json`. |
| `10-home-more-than-debate.jpg` | "More than debate." with three cards; the middle Social Night card is brown and gold. | Heading treatment, card style, the brown-gold Social Night card as the starting point for our Halloween palette. | We have two cards: Social Night and New to MUN?. |
| `11-sponsors-and-footer.jpg` | "Our Sponsors" logo row, then the four-column footer. | Footer layout, column headings, link style, hairline at the top. | Sponsors section only renders when `sponsors` isn't empty. Their sponsor logos never. |
| `12-committees-page-header.jpg` | Committees page: huge centred title, one line, filter chips, search, first row of tiles. | Title scale, chip row, search pill, tile shape and black-and-white photo treatment. | Their category names; ours are in SPEC 9.2. |
| `13-committees-grid.jpg` | Grid mid-scroll; one tile in its hover state (lifted, tilted, "View committee" pill). | The hover state exactly (SPEC 8.6). Name under each tile. | Their committees. |
| `14-committee-detail-hero.jpg` | DISEC page: back pill, wide photo card with navy wash, "Committee" label, huge code, full name. | Layout and scale. | The photo is one of OakMUN's generic UN-room images, so it may be used as a borrowed placeholder (SPEC 7.4). |
| `15-committee-detail-agenda-guide-eb.jpg` | Agenda card with teal border, background guide card. | Both cards. | Their agenda text. Ours is "Agenda TBC" until released. |
| `16-secretariat-title.jpg` | "Meet the / Secretariat" centred, one line under it. | Title and scale. | Their subtitle ("built by excellence") breaks anti-slop rule 1. Write one plain line. |
| `17-secretariat-cards.jpg` | Grid of 4:5 portrait cards with names top left and signatures bottom right. | Card shape, name and role placement, signature slot. | Every photo, name and signature. Ours use the initials placeholder until photos arrive. |
| `18-secretariat-card-flipped.jpg` | One card flipped to its navy back with name, role and an Instagram button. | The flip and the back face layout. | Their Instagram button uses a pink-orange gradient; ours uses the primary teal button so the page stays blue. |
| `19-allocations.jpg` | "Committee / Allocations." huge and left-aligned, paragraph, rounds list with dots. | Title treatment, rounds list. | Dates come from `site.json`. |
| `20-allocations-matrix.jpg` | Stats strip, then the centred "Allocation Matrix" card with an icon and button. | The matrix card. | The stats strip isn't needed on this page. |
| `21-resources.jpg` | "Resources." left-aligned, one line, a stats strip, the start of "Background Guides". | Title, intro, section heading. | Drop the stats strip here too. |
| `22-resources-guides.jpg` | Grid of guide cards with black-and-white committee photos, status and an open link. | Card layout and status styling. | Their committees. |
| `23-resources-documents.jpg` | IP style guide cards (Journalism, Photography), then "Essential Documents" cards with document icons. | Both card types. | Drop the big faint "03" section number: page sections aren't a sequence. |
| `24-event-page-hero.jpg` | OakMUN's event page: big left-aligned three-line title with teal middle line, small meta, two buttons, large circle on the right. | Hero layout for Social Night (the circle becomes the moon) and New to MUN? (a raised placard in place of the globe). | The globe and their event. |

Missing from the recording, so build from the SPEC alone: the mobile nav sheet, every phone layout, the 404 page.
