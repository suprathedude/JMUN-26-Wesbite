#!/usr/bin/env bash
# Checks the live site after a deploy (and on every other build, since it only reads the site):
# the homepage answers, a missing address gets the custom 404 page with a 404 status, and the
# server rules in .htaccess are in force (web.config is refused). Problems show as warnings in
# the Actions run; they never fail the build. SITE_URL defaults to the live address.
set -uo pipefail
URL="${SITE_URL:-https://oakridgejmun.in}"
tmp="$(mktemp -d)"

echo "Homepage: $(curl -sS -o /dev/null -w '%{http_code}' "$URL/")"

missing="$URL/no-such-page-$(date +%s)"
echo "Missing page ($missing):"
curl -sS -o "$tmp/404.html" -D "$tmp/404.headers" "$missing"
sed -n '1p;/^[Ss]erver:/p;/^[Cc]ontent-[Tt]ype:/p;/^[Cc]f-[Cc]ache/p' "$tmp/404.headers"
status="$(sed -n '1s/^HTTP[^ ]* \([0-9]*\).*/\1/p' "$tmp/404.headers")"
if grep -q '<?php' "$tmp/404.html"; then
  echo "::warning::A missing address gets the source of 404.php: PHP isn't running for the site (cPanel > MultiPHP Manager)."
elif grep -q 'class="nf"' "$tmp/404.html"; then
  echo "Custom 404 page: yes (status $status)"
  [ "$status" = "404" ] || echo "::warning::The 404 page came back with status $status, not 404."
else
  echo "::warning::A missing address doesn't get the custom 404 page. The server sent:"
  head -c 600 "$tmp/404.html"; echo
fi

# Every stylesheet, script and photo the live homepage uses, compared byte for byte with this
# build (12 October: a page loaded during an upload came out unstyled, and Cloudflare keeps these
# files for a year). Their names carry their content, so a file with the same name must match.
if [ -d _site ]; then
  checked=0; differ=0
  for a in $(curl -sS "$URL/" | grep -oE '(href|src|srcset)="/(css|js|img)/[^" ,]+' | sed -E 's/^[a-z]+="//' | sort -u); do
    [ -f "_site$a" ] || continue
    checked=$((checked + 1))
    live="$(curl -sS "$URL$a" | wc -c | tr -d ' ')"
    built="$(wc -c < "_site$a" | tr -d ' ')"
    if [ "$live" != "$built" ]; then
      differ=$((differ + 1))
      echo "::warning::$a is $live bytes on the live site but $built in the build. Purge Cloudflare's cache (Caching > Configuration > Purge Everything)."
    fi
  done
  echo "Homepage files checked against the build: $checked, differing: $differ"
fi

echo "web.config (should be refused, 403): $(curl -sS -o /dev/null -w '%{http_code}' "$URL/web.config")"
echo "404.html itself: $(curl -sS -o /dev/null -w '%{http_code}' "$URL/404.html")"

# Straight to GoDaddy's server, past Cloudflare, which hides the server's name. ORIGIN_IP is
# the cPanel Shared IP Address; its certificate is self-signed, hence -k.
ORIGIN_IP="${ORIGIN_IP:-118.139.181.170}"
host="${URL#https://}"
for path in "/no-such-page-$(date +%s)"; do
  echo "Origin, $path:"
  curl -sSk -o "$tmp/o.html" -D "$tmp/o.headers" --resolve "$host:443:$ORIGIN_IP" "https://$host$path"
  sed -n '1p;/^[Ss]erver:/p;/^[Cc]ontent-[Tt]ype:/p;/^[Xx]-/p' "$tmp/o.headers"
  head -c 300 "$tmp/o.html"; echo
done
rm -rf "$tmp"
exit 0
