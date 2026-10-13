# QR codes and desk check-in

Built on 13 October. A delegate types the email they registered with on the QR page
(`/qr/`) and gets their QR code, with their name, committee, allocation and a link to their
committee's page. At the registration desk, volunteers scan the code with their phone's camera
and the delegate is marked as arrived. The arrivals list downloads as a spreadsheet.

Nothing about delegates is in GitHub or on the public website. The list lives in a private
folder on GoDaddy that no web address reaches, and only the Secretariat uploads it.

## How it works

| Part | File |
| --- | --- |
| QR page | `src/qr.njk`, `src/js/qr.js`, text in `site.json` → `qrPage` |
| Check-in page for volunteers, `/qr/check/` (not in the menu or search engines) | `src/qr-check.njk`, `src/js/qr-check.js`, text in `site.json` → `qrCheck` |
| Lookup, check-in and arrivals download (PHP on GoDaddy) | `src/api/pass.php`, `checkin.php`, `arrivals.php`, shared code in `lib.php` |
| QR drawing | `qrcode-generator` (MIT licence), copied to `/js/vendor/` |

The QR holds a link to the check-in page with a code after the `#`. The code is a signature of
the delegate's email, so it can't be guessed or made up, and it says nothing about them by
itself.

## Opening QR codes (once every allocation is out)

1. **Make the delegate list.** In the allocation spreadsheet, keep one row per delegate with
   these column headings: `Email`, `Name`, `Committee`, `Allocation`. Other columns are ignored.
   Write the committee as it is on the site, by its short name (`UNSC`, `Lok Sabha`) or full
   name, so "Your link" opens the right page. Then save it as CSV: in Excel, **File > Save a
   copy (or Export) > CSV UTF-8**.
2. **Upload it.** cPanel > **File Manager**. Open your home folder (the one that holds
   `public_html`). Make a folder called `oakjmun-private` if it isn't there, open it, upload the
   CSV and rename it `delegates.csv`. Never put it inside `public_html`.
3. **Set the volunteer PIN.** In the same folder, **+ File** > `pin.txt`, then edit it and type
   the PIN on the first line: at least 8 letters and numbers. Give it to volunteers in person,
   not in a group chat.
4. **Test it.** Add a row for yourself, look up your email on the QR page, then scan the code
   with your phone and check in on the page that opens.
5. **Change the note** on the QR page: `site.json` → `qrPage.note` (it says codes open once
   every allocation is out).

To change allocations later, upload a new `delegates.csv` over the old one. QR codes don't
change: they depend on the email only.

Don't delete `key.txt` in that folder (it's made automatically): it signs the codes, and
without it every code already given out stops working.

## On the day

1. Each volunteer opens `https://oakridgejmun.in/qr/check/` once and enters the PIN. It stays on
   that phone until they tap **Forget PIN**.
2. Scan a delegate's QR code with the phone's camera and tap the link. The page shows:
   - **Checked in**, with the delegate's name, committee and allocation;
   - **Already checked in at** a time, if they've been checked in before;
   - **Not on the delegate list**: send them to the Secretariat desk.
3. No phone or no code? Type the delegate's email under **Check in by email**.
4. **Download arrivals** saves the list so far as a spreadsheet, with the time of each
   check-in.

## After the conference

Download the arrivals, then delete `delegates.csv`, `arrivals.csv` and `pin.txt` from
`oakjmun-private`.

## Privacy and limits

- Someone who knows a delegate's email can see their name, committee and allocation on the QR
  page, which the public allocation matrix shows anyway. They can't check anyone in or see the
  arrivals list without the PIN.
- One connection can look up 60 emails in 10 minutes; a phone that types 10 wrong PINs in 10
  minutes has to wait. A whole school network shares one connection, so the limit is generous.
- If the website ever moves into a folder inside `public_html`, `oakjmun-private` must move
  next to the website's own folder. The folder refuses web requests anyway (it holds a
  `.htaccess` that says so).
