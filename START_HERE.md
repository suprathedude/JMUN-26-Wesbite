# Start here

This pack builds the OakJMUN 2026 website with Claude Code. You don't write the code; you run one task at a time, look at the screenshots it shows you, and say what to change.

## What's in the pack

| File | What it's for |
| --- | --- |
| `CLAUDE.md` | Short rules Claude Code reads automatically at the start of every session. Keep it short. |
| `SPEC.md` | The full brief: colours, type, every page, the placard intro, speed rules and the task list. |
| `reference/` | 24 frames of the OakMUN XVI site, plus `README.md` saying what to copy and what to drop in each. |
| `START_HERE.md` | This file. |

## One-time setup (about 15 minutes)

1. **Install Node.js 22 LTS** from nodejs.org. Check it in a terminal: `node -v` should print `v22...`.
2. **Install Git** from git-scm.com (on Windows this also gives Claude Code a Bash shell, which it works better with).
3. **Install Claude Code.**
   - Mac or Linux: `curl -fsSL https://claude.ai/install.sh | bash`
   - Windows PowerShell: `irm https://claude.ai/install.ps1 | iex`
   - Open a new terminal and check `claude --version`.
   - It needs a paid Claude plan (Pro or Max) or a Console account. The free plan doesn't include Claude Code.
   - Prefer buttons to a terminal? The Claude desktop app has a Code tab that does the same thing.
4. **Make the project folder** and put the pack in it:
   ```bash
   mkdir oakjmun-site
   cd oakjmun-site
   # unzip the pack here so CLAUDE.md, SPEC.md, START_HERE.md and reference/ sit at the top level
   git init
   ```
5. **Start Claude Code** inside that folder: `claude`. The first time, it opens a browser to log in.

## How to run each task

1. Start a fresh session (or type `/clear`), so the last task's chat doesn't crowd this one.
2. For **Task 0 only**, switch to plan mode first: press **Shift+Tab** until the bottom bar says plan mode. Plan mode reads and plans but doesn't change files.
3. Type: **`Read SPEC.md and do Task 0.`** (then Task 1, Task 2, and so on).
4. When it asks permission to run commands like `npm install` or `npm run build`, allow them.
5. At the end of each task it shows you screenshots and a short report. Compare them with the matching `reference/` frames yourself. If something's off, say exactly what: "the stat numbers are too small", "the nav pill is wider than reference/02". You can drag a screenshot into the terminal or give its path.
6. If a change goes wrong, press **Esc** to stop it. Press Esc twice (or type `/rewind`) to go back to an earlier point.
7. When you're happy, move on to the next task in a new session.

## Two-day plan for the draft

| When | Tasks | Result |
| --- | --- | --- |
| Day 1 morning | Task 0 (plan), Task 1 (scaffold), Task 2 (content files) | Nav, footer and all the placeholder content in place |
| Day 1 afternoon | Task 3 (homepage) | Full homepage without the intro |
| Day 1 evening | Deploy (below) | A link the Secretariat can open on their phones |
| Day 2 morning | Task 5 (committees), Task 6 (Secretariat, Allocations, Resources) | The pages people use most |
| Day 2 afternoon | Task 4 (placard intro), Task 7 (New to MUN?, Social Night, 404) | The parts that make it feel new |
| After the Secretariat's review | Tasks 8, 9 and 10 | Speed, accessibility, a fresh review against the brief, and the handover docs |

Tasks 8 to 10 still matter before the site goes public. They're just not needed for a review draft.

## Putting the draft online early (Cloudflare Pages, free)

Task 10 writes the full guide, but you can deploy as soon as Task 3 is done. Ask Claude Code: "Push this project to a new GitHub repo and tell me exactly how to connect it to Cloudflare Pages." In short:

1. Push the project to a GitHub repo (private is fine).
2. Make a free Cloudflare account. In the dashboard go to Workers & Pages, create a Pages project, choose to connect to Git, and pick the repo.
3. Build command `npm run build`, output directory `_site`.
4. You get a `something.pages.dev` link. Every push to GitHub rebuilds it in about a minute.

Updating later (background guides, EB names, the schedule) is a small edit to a file in `src/_data/`, done on GitHub's website, even from a phone. Task 10 writes `docs/HOW_TO_UPDATE.md` with the exact steps.

## Things to collect for the real version

Everything below shows as a "TBC" placeholder until you have it. A search for "TBC" in the project finds them all.

- OakJMUN crest (SVG if possible) and the Oakridge school logo, from the school's brand files.
- A hero photo or short video of the MPH or a committee room, and photos with parental consent for anything that shows students.
- The register link and the consent form link.
- The final committee list, agendas, EB names, and background guide PDFs as they're released.
- The theme (if there is one), the final schedule times, the Social Night time and costume rules.
- Secretariat photos and Instagram handles (optional).
- The contact email.
