# Security

The site is plain files, plus the small QR system (13 October, `docs/QR.md`): no database, no
logins, and no API keys in the code or in the pages. The only data the server reads is the
delegate list the Secretariat uploads to a private folder outside the website's folder, and the
only thing it writes is the arrivals list next to it, behind a volunteer PIN. Registration is a Microsoft Forms link. Checked on
12 October: no keys, passwords or tokens anywhere in the repository or its history.

## The one secret

The FTP login GitHub uses to upload the site. It lives only in the repository's secrets
(Settings > Secrets and variables > Actions: `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`), never in a
file. GitHub hides it in logs, and builds of pull requests from other people's copies of the
repository never see it. Never paste it into a file, an issue, a chat or a screenshot. If it ever
is, change it in cPanel > FTP Accounts > Change Password, then update the secret.

If you add the optional Cloudflare token (`CLOUDFLARE_API_TOKEN`, docs/CLOUDFLARE.md), it can
only clear this site's cache on Cloudflare, nothing else. Treat it the same way; if it leaks,
delete it in Cloudflare > your profile > API Tokens and make a new one.

## What the server sends (src/.htaccess)

| Rule | What it stops |
| --- | --- |
| `Content-Security-Policy` | Scripts, styles, fonts, photos, video and requests from any other site, except Cloudflare's visitor statistics. An injected script can't load code from elsewhere or send data out. |
| `X-Frame-Options` and `frame-ancestors` | Other sites showing this one inside a frame to trick people into clicking (clickjacking). |
| `Strict-Transport-Security` | Browsers using `http://` for this site for a year after a visit. |
| `Permissions-Policy` | Microphone, location, payment and USB access. The camera is allowed for this site only, for the desk check-in scanner (`/qr/check/`); the browser still asks the volunteer first. |
| `X-Content-Type-Options`, `Referrer-Policy` | Files being run as a different type; full page addresses being sent to other sites. |
| `web.config`, `.htaccess` | Refused to visitors. |

If you add something from another site (an embedded map or video, a font from Google), it is
blocked until its address is added to the `Content-Security-Policy` line. `npm run a11y` and the
browser's console (F12) show what was blocked.

`scripts/check-live.sh` runs after every deploy and warns if these rules stop being sent.

## Settings only you can change (do these once)

1. **Two-step sign-in on every account that controls the site:** GitHub, GoDaddy, Cloudflare,
   and the email accounts they send password resets to. This is the most important item: the
   likeliest way a small site gets taken over is a reused password.
2. **GitHub > Settings (your account) > Emails > Keep my email addresses private**, and turn on
   "Block command line pushes that expose my email". New commits then show a no-reply address.
3. **GitHub > the repository > Settings > Advanced Security** (or Code security): turn on
   **Secret scanning** and **Push protection**, so GitHub refuses a push that contains a password
   or key.
4. **GitHub > the repository > Settings > Branches > Add rule for `main`:** require a pull
   request before merging. Nothing reaches the live site without a pull request you merge.
5. **Cloudflare > SSL/TLS > Edge Certificates:** HSTS is sent by the site itself, so leave
   Cloudflare's HSTS off unless you remove it from `.htaccess`. "Always Use HTTPS" stays on.
6. **Cloudflare > SSL/TLS > Origin Server > Create Certificate**, then install it in
   **cPanel > SSL/TLS > Manage SSL Sites** for oakridgejmun.in, then set Cloudflare's encryption
   mode to **Full (strict)**. Today the link between Cloudflare and GoDaddy is encrypted but
   GoDaddy's certificate is self-signed, so Cloudflare can't check it is talking to the real
   server. (Ask Claude to walk through it: it takes about ten minutes.)

## The upload connection

The deploy uses FTPS (FTP over TLS). `FTP_INSECURE=1` (a repository variable) skips checking
GoDaddy's certificate, because the certificate isn't issued for `ftp.oakridgejmun.in`. The
connection is still encrypted, but not checked. The live check prints the names the upload
server's certificate is for; on 12 October that was `*.prod.sin2.secureserver.net` (GoDaddy's
Singapore servers). To switch the check back on:

1. cPanel > **Server Information**: note the **Server Name** (it looks like `sg2plcpnl0123`).
2. Set the `FTP_HOST` secret to that name plus `.prod.sin2.secureserver.net`, for example
   `sg2plcpnl0123.prod.sin2.secureserver.net`.
3. Delete the `FTP_INSECURE` variable (Settings > Secrets and variables > Actions > Variables).

If the next deploy fails at "Upload", put `FTP_INSECURE` back (value `1`) and the old `FTP_HOST`.
