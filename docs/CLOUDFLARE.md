# The padlock (HTTPS) with Cloudflare

**Set up and live since 8 October 2026** (Cloudflare account: Supratiik's; nameservers `jimmy.ns.cloudflare.com` and `piper.ns.cloudflare.com`; encryption mode Full; Always Use HTTPS on; `ftp` and `_domainconnect` DNS only). The steps below are kept for reference, or for setting it up again.

GoDaddy's hosting for oakridgejmun.in only has a self-signed certificate, which browsers show as "Not secure", and AutoSSL is switched off on the plan. Cloudflare's free plan fixes that: it gives the site a real certificate that renews itself, and it serves the photos, video, CSS and JavaScript from its own servers, so the GoDaddy server sees far less traffic at busy times.

The domain stays registered at GoDaddy and the website stays on GoDaddy's hosting. Only the domain's **nameservers** move to Cloudflare, which means DNS records are edited in Cloudflare from then on. The GitHub upload is unchanged.

It takes about 15 minutes, plus waiting (usually under an hour, at most a day).

## 1. Add the domain to Cloudflare

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) with the school or Secretariat email, so the account doesn't depend on one person.
2. Click **Add a domain**, type `oakridgejmun.in`, keep "Quick scan for DNS records" on, and continue.
3. Choose the **Free** plan.

## 2. Check the DNS records

Cloudflare copies the records it finds. Check these; the IP is the cPanel **Shared IP Address** (cPanel home page, General Information), `118.139.181.170` at the time of writing.

| Type | Name | Content | Proxy status |
| --- | --- | --- | --- |
| A | `@` (oakridgejmun.in) | `118.139.181.170` | **Proxied** (orange cloud) |
| CNAME | `www` | `oakridgejmun.in` | **Proxied** (orange cloud) |
| A | `ftp` | `118.139.181.170` | **DNS only** (grey cloud) |

- **`ftp` must be grey (DNS only).** Cloudflare doesn't pass FTP through, so with an orange cloud the GitHub upload fails. Click the cloud to switch it.
- If you see records for `mail`, `webmail`, `cpanel`, `autodiscover` or MX, keep them and set them to **DNS only** too.
- Leave TXT records (such as `_dmarc`) and `_domainconnect` as they are.

Click **Continue**. Cloudflare then shows **two nameservers**, for example `anna.ns.cloudflare.com` and `bob.ns.cloudflare.com`. Keep that page open.

## 3. Point the domain at Cloudflare (in GoDaddy)

1. In GoDaddy, open **Domains → oakridgejmun.in → DNS → Nameservers → Change nameservers**.
2. Choose **I'll use my own nameservers**, paste the two Cloudflare nameservers (one per box), and save. Confirm the warning.
3. If GoDaddy says **DNSSEC** is on for the domain, turn it off first (same DNS page), then change the nameservers.

Back in Cloudflare, click **Check nameservers now**. It emails you when the domain is **Active**.

## 4. Turn on HTTPS

Once Cloudflare says **Active**:

1. **SSL/TLS → Overview**: set the encryption mode to **Full**.
   - Not "Flexible": that sends visitors round in a redirect loop with GoDaddy's settings.
   - Not "Full (strict)": GoDaddy's certificate is self-signed, so strict mode refuses it.
2. **SSL/TLS → Edge Certificates**:
   - **Always Use HTTPS**: On. This sends every `http://` visitor to `https://`, so the `.htaccess` redirect in `src/.htaccess` stays switched off.
   - **Automatic HTTPS Rewrites**: On.
   - **Minimum TLS Version**: 1.2.
3. Open `https://oakridgejmun.in`. The padlock should be there. If the browser still says "Not secure", wait 15 minutes, then try a private window.

## 5. Caching (leave the defaults)

- **Caching → Configuration → Browser Cache TTL**: **Respect Existing Headers**. The site already tells browsers to keep CSS, JavaScript, fonts and photos for a year (their file names change when they change) and to check pages every time.
- Pages (HTML) aren't cached by Cloudflare by default, so a change goes live as soon as the GitHub upload finishes. Leave it that way.
- If a change doesn't show up, use **Caching → Configuration → Purge Everything**.

## 6. Check the upload still works

Push or merge any change to `main` and watch the Actions run. If "Upload to GoDaddy" fails with "Name or service not known" or a timeout, the `ftp` record is orange: make it grey (DNS only).

## Video on the free plan

Cloudflare's terms ask that its free plan not be used mainly to deliver video. This site has two short clips (the homepage background and Doom's clip, about 3 to 5 MB each) on an otherwise ordinary website. If Cloudflare ever contacts you about it, the clips can be made smaller, or turned off in `site.json` (`hero.video` set to `""`) and `committees.json` (remove `cinematic`).

## How many visitors can it take?

The site is plain files: no database, no logins, no code running on the server for each visit. A page is 15 to 60 KB of HTML; the rest (CSS, JavaScript, fonts, photos, the hero video) is the same for everyone. With Cloudflare in front, those shared files come from Cloudflare's servers in India after the first request, and GoDaddy only sends the small HTML pages. Hundreds of people on the site at once is a light load for that set-up.

Nothing online can be promised never to go down. The parts outside this project are GoDaddy's server, Cloudflare and the Microsoft Forms registration page, and each of those has its own (rare) outages. To keep an eye on it during a busy moment, open cPanel's **Resource Usage** page; if it ever shows limits being hit, GoDaddy can move the hosting to a bigger plan.
