# QR passes and desk check-in

Since 18 October the QR system has two halves:

- **This website** gives each delegate their QR pass on the QR page (`/qr/`): they type the email
  they registered with and get their QR code, their name, committee, allocation and a link to
  their committee's page, and can save the pass as an image or download it as a PDF to print.
- **The check-in app**, a separate private app on Vercel (the `oakjmun-checkin` repo), keeps the
  delegate list and is where the Organising Committee scans passes at the registration desk.
  Its own `README.md` and `SETUP.md` explain it and how to set it up.

Nothing about delegates is in this repo or on the public website, and the website never shows the
check-in app's address.

## How a pass is looked up

1. The QR page (`src/qr.njk`, `src/js/qr.js`) sends the email to this website's own server,
   `/api/pass.php`.
2. `pass.php` asks the check-in app for that delegate's pass, using the app's address and key in
   GoDaddy's private folder (below), and passes the answer back. The visitor's browser only ever
   talks to oakridgejmun.in.
3. The QR page draws the code. It holds `OAKJMUN:` and a 20-character code, never a web address:
   a phone's own camera app shows a meaningless code, and only the check-in app's scanner can use
   it. The code is a signature of the delegate's email, so it can't be guessed, and it never
   changes when the delegate sheet is uploaded again.
4. **One email, more than one delegate** (brothers and sisters on a parent's address, 22 October):
   the check-in app keeps each of them with their own code, and the QR page shows a button for
   each name; choosing one shows that delegate's pass. `qrPage.messages.choose` is the line above
   the buttons.
5. **Save as image** saves the pass as a picture (their name, committee · allocation, and the code on a cream card, 21 October); **Download PDF** makes a one-page A4 pass with
   their details and the code (`src/js/pass-pdf.js`, loaded only when it's tapped).

| Part | File |
| --- | --- |
| QR page | `src/qr.njk`, `src/js/qr.js`, `src/js/pass-pdf.js`, text in `site.json` → `qrPage` (the PDF's words under `pdf`) |
| Asks the check-in app (PHP on GoDaddy) | `src/api/pass.php`, shared code in `src/api/lib.php` |
| QR drawing | `qrcode-generator` (MIT licence), copied to `/js/vendor/` |

## Connecting the website to the check-in app

Once the check-in app is running (its `SETUP.md`):

1. cPanel > **File Manager**. Open your home folder (the one that holds `public_html`), then
   `oakjmun-private` (make it if it isn't there). Never put it inside `public_html`.
2. **+ File**, name it `checkin.json`, then **Edit** it:

   ```json
   { "url": "https://the-check-in-app-address", "key": "the PASS_KEY from Vercel" }
   ```

3. On the check-in app's admin page, turn **QR passes on the website** on.
4. Look yourself up on the QR page with an email that's on the delegate sheet.

## Turning QR passes on

Passes are given out only when all three are on, so nothing opens by accident:

1. **The website's switch:** `site.json` → `qrPage` → `"open": true` (21 October; it's `false`
   until the Secretariat says go). While it's off, the QR page stays in the nav but its email box
   and button are greyed out under `qrPage.closedNote` ("QR codes open soon"), and
   `/api/pass.php` refuses every lookup as well: the build writes the switch into
   `/api/settings.php` (`src/api-settings.njk`), so the page and the server always agree.
2. `checkin.json` in GoDaddy's private folder (above).
3. **QR passes on the website** on the check-in app's admin page.

With any of them off, a delegate sees "QR codes aren't open yet" (`qrPage.messages.closed`). To
close passes again quickly on the day, switch them off on the admin page: that's instant, with no
commit. `qrPage.note` is the line under the email box once passes are open.

Tested end to end on 21 October with the check-in app running locally and its dummy sheet: the
lookup (with capitals and spaces in the email), the code on screen and in the saved image both
decoding to the delegate's code, the PDF, a Lok Sabha delegate's extra details, an unknown email,
then the desk app scanning the pass through a camera (green, then amber on a second scan).

## Privacy and limits

- Someone who knows a delegate's email can see their name, committee and allocation on the QR
  page, which the public allocation matrix shows anyway. They can't check anyone in: that needs an
  OC email on the check-in app's list and the PIN.
- One connection can look up 60 emails in 10 minutes, here and again in the check-in app. A whole
  school network shares one connection, so the limit is generous.
- The visitor's address comes from the connection itself. Only when the connection comes from
  Cloudflare's own addresses (the list in `src/api/lib.php`, from cloudflare.com/ips) is the
  address Cloudflare passes on believed, so nobody can get round the limit by sending a made-up
  one. If Cloudflare ever adds addresses, add them to that list.
- `oakjmun-private` refuses web requests anyway (it holds a `.htaccess` that says so). If the
  website ever moves into a folder inside `public_html`, the private folder must move next to the
  website's own folder.
