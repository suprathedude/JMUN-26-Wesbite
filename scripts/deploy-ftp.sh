#!/usr/bin/env bash
# Uploads the built site (_site/) to GoDaddy over FTPS (FTP with encryption). See
# docs/DEPLOY.md. GitHub Actions runs this after every successful build of main
# (.github/workflows/deploy.yml); you can also run it yourself once lftp is installed:
#
#   FTP_HOST=... FTP_USER=... FTP_PASSWORD=... bash scripts/deploy-ftp.sh
#
# Settings (environment variables):
#   FTP_HOST, FTP_USER, FTP_PASSWORD   from cPanel > FTP Accounts (required)
#   FTP_DIR        the folder the site goes in, as the FTP account sees it. Default: the
#                  account's own folder, which is right for the FTP account docs/DEPLOY.md sets
#                  up (it opens straight into public_html). With cPanel's main login, use public_html.
#   FTP_PORT       default 21
#   FTP_INSECURE   set to 1 to skip checking the server's certificate (still encrypted)
#   FTP_CA_FILE    a certificate file to trust (for testing against a local server)
#
# It uploads new files first, then the pages, then deletes files the new build no longer
# has (old CSS and JS versions), so visitors never get a page pointing at a missing file.
# Files already live are only replaced if their size changed; pages always are.
# Because it deletes, it refuses to touch a folder that holds anything it didn't put there.
set -euo pipefail

: "${FTP_HOST:?Set FTP_HOST (see docs/DEPLOY.md)}"
: "${FTP_USER:?Set FTP_USER (see docs/DEPLOY.md)}"
: "${FTP_PASSWORD:?Set FTP_PASSWORD (see docs/DEPLOY.md)}"
DIR="${FTP_DIR:-.}"
DIR="${DIR%/}"
[ -n "$DIR" ] || DIR="."
PORT="${FTP_PORT:-21}"
SITE="_site"
MARKER=".deployed-from-github"
# Things GoDaddy keeps in public_html: SSL certificate checks, scripts, logs. Never touched.
KEEP=(".well-known" "cgi-bin" ".ftpquota" "error_log" "$MARKER")

[ -f "$SITE/index.html" ] || { echo "No $SITE/index.html. Run npm run build first." >&2; exit 1; }
command -v lftp > /dev/null || { echo "lftp isn't installed (sudo apt-get install lftp, or brew install lftp)." >&2; exit 1; }

settings="set ftp:ssl-force true; set ftp:ssl-protect-data true; set net:max-retries 3; set net:timeout 30; set net:reconnect-interval-base 5; set mirror:parallel-transfer-count 4"
if [ "${FTP_INSECURE:-}" = "1" ]; then settings="$settings; set ssl:verify-certificate no"; fi
if [ -n "${FTP_CA_FILE:-}" ]; then settings="$settings; set ssl:ca-file \"$FTP_CA_FILE\""; fi

# The password goes through the environment, so no character in it needs escaping.
export LFTP_PASSWORD="$FTP_PASSWORD"
ftp() { lftp --env-password -u "$FTP_USER" -p "$PORT" -e "$settings; $1; bye" "$FTP_HOST"; }

# 1. Safety check: what's in the folder now?
echo "Checking $DIR on $FTP_HOST"
listing="$(ftp "cls -1a \"$DIR/\"" 2>&1)" || {
  if grep -qi "no such file" <<< "$listing"; then
    listing="" # a new folder (a subdomain's, say): the upload creates it
  else
    echo "Couldn't open $DIR on $FTP_HOST:" >&2
    echo "$listing" >&2
    exit 1
  fi
}
foreign=()
seen_marker=0
while IFS= read -r entry; do
  name="${entry%/}"
  name="${name##*/}"
  # "." and ".." are the folder itself and its parent, which GoDaddy's server lists too.
  case "$name" in "" | "." | "..") continue ;; esac
  [ "$name" = "$MARKER" ] && seen_marker=1
  keep=0
  for k in "${KEEP[@]}"; do [ "$name" = "$k" ] && keep=1; done
  [ "$keep" = 1 ] || foreign+=("$name")
done <<< "$listing"
if [ "$seen_marker" = 0 ] && [ "${#foreign[@]}" -gt 0 ]; then
  echo "Stopped: $DIR already has files that weren't uploaded by this deploy:" >&2
  printf '  %s\n' "${foreign[@]:0:20}" >&2
  echo "The deploy replaces everything in $DIR, so it won't run over another site." >&2
  echo "Download a backup, delete those files in cPanel's File Manager, then run it again." >&2
  echo "(docs/DEPLOY.md, step 6.)" >&2
  exit 1
fi

# The marker tells later deploys this folder is theirs to manage.
printf 'This folder is replaced by the GitHub deploy (scripts/deploy-ftp.sh) on every push to main.\nFiles added here by hand are deleted. See docs/DEPLOY.md.\n' > "$SITE/$MARKER"

excludes=""
for k in "${KEEP[@]}"; do
  [ "$k" = "$MARKER" ] && continue
  excludes="$excludes --exclude-glob \"$k\" --exclude-glob \"$k/\""
done

# 2. Everything except the pages: only files that are new or have changed size (--ignore-time).
#    The build gives every file a new date, so comparing dates re-uploaded all of them each time,
#    writing over live stylesheets while visitors loaded them (12 October: a page caught mid-upload
#    came out unstyled, and Cloudflare keeps stylesheets for a year). CSS, JS and photos have their
#    content in their names, so a changed one is a new file and never overwrites a live one.
echo "Uploading new files"
ftp "mirror --reverse --no-perms --ignore-time --exclude-glob *.html $excludes \"$SITE/\" \"$DIR/\""

# 3. The pages and server settings, every time: an edit can leave a page the same size (a new
#    stylesheet name is as long as the old one), so these never rely on the size check.
echo "Uploading pages"
always="$(cd "$SITE" && find . -type f \( -name '*.html' -o -name '*.xml' -o -name '*.txt' -o -name '*.php' -o -name '.htaccess' -o -name 'web.config' -o -name "$MARKER" \) -printf '"%P" ')"
ftp "lcd \"$SITE\"; mput -d -O \"$DIR\" $always"

# 4. Remove what the new build no longer has, except old stylesheets, scripts and photos
#    (css/, js/, img/): a page Cloudflare is still holding (up to 10 minutes) or open in someone's
#    browser may still ask for them. They're small, and their names never come back.
echo "Removing old files"
ftp "mirror --reverse --no-perms --ignore-time --delete $excludes --exclude-glob css/ --exclude-glob js/ --exclude-glob img/ \"$SITE/\" \"$DIR/\""

rm -f "$SITE/$MARKER"
echo "Done: $(find "$SITE" -type f | wc -l | tr -d ' ') files are live in $DIR on $FTP_HOST."
