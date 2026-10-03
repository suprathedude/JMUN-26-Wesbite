# Putting the site online (GoDaddy)

The website is a set of plain files (HTML, CSS, JavaScript and images). GitHub builds those files from the project every time something changes on the `main` branch and uploads them to your GoDaddy hosting. After the one-time setup below, nobody needs to upload anything by hand: save a change on GitHub and the live site updates about two minutes later.

```
edit on GitHub  →  GitHub Actions builds and checks the site  →  uploads it to GoDaddy over FTPS  →  live
```

If a build fails (a typo in a data file, a missing photo), nothing is uploaded and the live site stays as it was.

The one-time setup takes about half an hour. You need:
- a login to the GoDaddy account that holds the hosting;
- admin access to the GitHub repository (to add the FTP password as a secret);
- the domain or subdomain the site should live at.

**For OakJMUN 2026** the address is **oakridgejmun.com**, and the school's IT team manages the domain. Before starting, ask them:
1. Is oakridgejmun.com on GoDaddy, and is there a GoDaddy **hosting** plan as well, not just the domain? If so, which product does **My Products** list for it (step 1)?
2. Can they either give a Secretariat member access to that hosting's cPanel, or do steps 3 and 4 themselves and send back the FTP Server and FTP Username? The password should go straight into GitHub (step 5), not into a chat or an email.
3. Can they switch on the free SSL certificate for oakridgejmun.com (step 3)?

---

## 1. Check which GoDaddy product you have

In GoDaddy, open **My Products** and look at the hosting product.

| What it says | Works? |
| --- | --- |
| **Web Hosting** with a **cPanel Admin** button (Linux) | Yes. This guide is written for it. |
| **Web Hosting** for **Windows** (Plesk) | Yes. The site includes a `web.config` for Windows hosting. Steps 3 and 6 differ a little: Plesk calls it "FTP Access", and the HTTPS switch is in Plesk's "Hosting Settings". |
| **Websites + Marketing** or **Website Builder** | No. That's a page builder, which can't host a site like this. You'd need Web Hosting (cPanel) instead. |
| **WordPress Hosting** | Not recommended. It's built for WordPress; ask GoDaddy whether the plan allows FTP uploads of a plain HTML site. |

## 2. Put the code on the `main` branch

The deploy runs from the `main` branch of `suprathedude/jmun-26-wesbite`. While the site was being built, the work was on the branch `claude/new-session-smmq0m`. On GitHub, open a pull request from that branch into `main` and merge it, or ask Claude to open one. From then on, everything merged into `main` goes live.

## 3. Decide where the site lives, and turn on SSL

In GoDaddy, open **My Products → Web Hosting → Manage → cPanel Admin**.

**The site's folder.** If the site is your hosting's main domain, its folder is `public_html`. If it's a subdomain (for example `jmun.example.org`), go to **Domains** in cPanel, create the subdomain, and note the folder cPanel gives it (for example `public_html/jmun` or `jmun.example.org`).

**If the domain is managed somewhere else** (by the school's IT, say), they need to add one DNS record that points the address at your hosting: an **A record** with the IP address cPanel shows on its home page as "Shared IP Address".

**SSL (the padlock).** In cPanel, open **Security → SSL/TLS Status**, tick the domain and click **Run AutoSSL**. Most GoDaddy hosting plans include a free certificate; if yours doesn't, it's under **My Products → SSL Certificates**. It can take up to a few hours to appear. You'll switch on the HTTPS redirect in step 6, once it's working.

## 4. Create an FTP account for the deploy

In cPanel, open **Files → FTP Accounts** and add an account:
- **Log in:** `deploy` (cPanel adds `@yourdomain` to it).
- **Password:** use the generator and copy the password somewhere safe for the next step.
- **Directory:** the site's folder from step 3, for example `public_html`. cPanel fills in something like `public_html/deploy` by default; change it to the site's folder itself.
- **Quota:** Unlimited.

Then, in the list of FTP accounts, click **Configure FTP Client** next to the new account. It shows the **FTP Username** (for example `deploy@example.org`) and the **FTP Server** (for example `ftp.example.org`). You need both.

## 5. Give GitHub the FTP login

On GitHub, open the repository, then **Settings → Secrets and variables → Actions**. Under **Repository secrets**, click **New repository secret** three times:

| Name | Value |
| --- | --- |
| `FTP_HOST` | the FTP Server from step 4, for example `ftp.example.org` |
| `FTP_USER` | the FTP Username, for example `deploy@example.org` |
| `FTP_PASSWORD` | the password from step 4 |

Secrets are hidden once saved; even admins can't read them back. They're never shown in build logs.

Two optional settings go under the **Variables** tab on the same page (not Secrets):

| Name | When to add it |
| --- | --- |
| `FTP_DIR` | Only if the FTP account doesn't open straight into the site's folder. For example, with cPanel's main login, set it to `public_html`. |
| `FTP_INSECURE` | Only if the deploy fails with a certificate error (see Troubleshooting). Set it to `1`. The upload stays encrypted. |

## 6. Empty the folder, then run the first deploy

The deploy makes the site's folder an exact copy of the built site. Anything else in that folder is deleted, apart from what GoDaddy needs (`.well-known`, `cgi-bin`, `.ftpquota` and `error_log`). So that it can never wipe another site by mistake, it refuses to start if the folder already holds anything it didn't put there.

1. In cPanel, open **Files → File Manager** and go to the site's folder. GoDaddy often leaves a placeholder page there (`index.html` or `default.html`). If there's anything you want to keep, download it first. Then delete everything except `.well-known` and `cgi-bin`. (Tick **Show Hidden Files** in File Manager's settings to see them.)
2. On GitHub, open **Actions → Build and deploy → Run workflow**, choose the `main` branch and click **Run workflow**.
3. Click the run to watch it. After about two minutes every step has a green tick, and the last one, "Upload to GoDaddy", ends with a line like `Done: 140 files are live`.
4. Open your address. The site is live.

**Turn on HTTPS** once `https://` shows the padlock: in the repository, open `src/.htaccess`, find the five lines at the bottom under "Send every visitor to the https:// address", remove the `#` at the start of each, and commit. Every `http://` address then forwards to `https://`.

**The site's address** is set in `src/_data/site.json` as `"url": "https://oakridgejmun.com"`. Search engines and link previews use it, and so do `sitemap.xml` and `robots.txt`. Change it only if the address changes.

## 7. Day to day

- **Every change merged into `main` goes live on its own.** The Actions tab shows each run: a yellow dot while it's working, a green tick when it's live, a red cross if something was wrong and nothing was uploaded.
- **Other branches and pull requests** are built and checked but never uploaded, so a mistake shows up before it reaches `main`. GoDaddy has no preview links; to look at a change before it goes live, run `npm run dev` on a laptop (see "Working on a laptop").
- **A run failed.** Open it and click the red step. The message names the file and the problem, for example `src/_data/site.json has a typo near line 26, column 5`. [HOW_TO_UPDATE.md](HOW_TO_UPDATE.md) explains the common ones. Fix the file and commit again; the live site isn't touched in the meantime.
- **Undo a change that went live.** Fix or undo the edit on GitHub and commit; the next run puts things right. In a hurry, open an earlier green run in the Actions tab and click **Re-run all jobs**: it rebuilds and uploads that older version. The next commit to `main` replaces it again.
- **Visitors see the old version.** Pages are sent with "check for a newer version" every time, so a normal refresh shows the update. CSS, JavaScript and photos are cached for a year, which is safe because their file names change whenever they do (for example `site.0846a8fe.css`).

## 8. Troubleshooting

| What you see | What to do |
| --- | --- |
| A yellow warning: "The site built fine but wasn't uploaded" | The FTP secrets from step 5 are missing. Add all three, then run the workflow again. |
| `Login failed: 530` | The username or password is wrong. The username includes `@yourdomain`. Reset the password in cPanel's FTP Accounts and update `FTP_PASSWORD`. |
| `Certificate verification` or `certificate subject name does not match` | GoDaddy's FTP certificate is for the server's own name rather than `ftp.yourdomain`. Put the server's full host name in `FTP_HOST` (GoDaddy support can tell you it; cPanel's General Information panel shows the short form), or add the variable `FTP_INSECURE` = `1`. |
| `Stopped: . already has files that weren't uploaded by this deploy` | Step 6.1: the folder isn't empty. Back up and delete the files it lists, or check that `FTP_DIR` points at the right folder. |
| `Couldn't open ... No route to host` or a timeout | Check `FTP_HOST`. Some hosting accounts block FTP from abroad; GoDaddy support can allow it. |
| The live site shows "500 Internal Server Error" | The server rejected a line in `.htaccess`. In File Manager, rename `.htaccess` to `htaccess-off` to bring the site back, then ask Claude or GoDaddy support which line the server doesn't allow. |
| Photos or the font don't load on Windows hosting | Check that `web.config` is in the site's folder (it's uploaded with the site). |

## Working on a laptop

You only need this for bigger changes; GitHub's website is enough for content edits.

1. Install [Node.js](https://nodejs.org) 22 and [Git](https://git-scm.com).
2. Clone the repository, then in its folder run `npm ci` once.
3. `npm run dev` shows the site at http://localhost:8080 and refreshes as you edit.
4. Before merging a big change, run the checks:
   - `npm run check`: builds the site and checks every internal link;
   - `npm run a11y`: accessibility checks on every page;
   - `npm run shots`: screenshots of every page in `screenshots/`.
5. `npm run media` shrinks new photos, makes committee photos black and white, and encodes the hero video. The GitHub build does the photo part automatically, but not the video, so a hero video has to be encoded on a laptop (see REPLACE_ME.md).

**Uploading by hand** works too, if GitHub Actions is ever unavailable:
- **With lftp installed:** run `npm run build`, then `FTP_HOST=… FTP_USER=… FTP_PASSWORD=… bash scripts/deploy-ftp.sh`.
- **Without it:** run `npm run build`, zip the contents of `_site/` (including the hidden `.htaccess`), upload the zip in cPanel's File Manager and extract it in the site's folder.

## What's where

| File | What it does |
| --- | --- |
| `.github/workflows/deploy.yml` | The GitHub Actions workflow: prepare photos, build, check links, upload. |
| `scripts/deploy-ftp.sh` | The upload: new files first, then pages, then removes old files. Includes the empty-folder safety check. |
| `src/.htaccess` | Server settings for Linux hosting: the 404 page, file types, compression, caching, the optional HTTPS redirect. |
| `src/web.config` | The same settings for Windows hosting. |
| `.nvmrc` | The Node.js version (22) the build uses. |
| `scripts/lib/validate-data.mjs` | Checks the data files before every build and explains any mistake it finds. |
