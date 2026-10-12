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
if grep -q 'class="nf"' "$tmp/404.html"; then
  echo "Custom 404 page: yes"
else
  echo "::warning::A missing address doesn't get the custom 404 page. The server sent:"
  head -c 600 "$tmp/404.html"; echo
fi

echo "web.config (should be refused, 403): $(curl -sS -o /dev/null -w '%{http_code}' "$URL/web.config")"
echo "404.html itself: $(curl -sS -o /dev/null -w '%{http_code}' "$URL/404.html")"

# Straight to GoDaddy's server, past Cloudflare, which hides the server's name. ORIGIN_IP is
# the cPanel Shared IP Address; its certificate is self-signed, hence -k.
ORIGIN_IP="${ORIGIN_IP:-118.139.181.170}"
host="${URL#https://}"
for path in "/no-such-page-$(date +%s)" "/no-such-file.html" "/no-such-folder/"; do
  echo "Origin, $path:"
  curl -sSk -o "$tmp/o.html" -D "$tmp/o.headers" --resolve "$host:443:$ORIGIN_IP" "https://$host$path"
  sed -n '1p;/^[Ss]erver:/p;/^[Cc]ontent-[Tt]ype:/p;/^[Xx]-/p' "$tmp/o.headers"
  head -c 300 "$tmp/o.html"; echo
done
rm -rf "$tmp"
exit 0
