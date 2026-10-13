<?php
// Shared by the QR pass and the desk check-in (13 October, docs/QR.md).
//
// Everything private lives in the folder "oakjmun-private" next to the website's folder, never
// inside it, so no web address reaches it: the delegate list (delegates.csv, uploaded by the
// Secretariat), the volunteer PIN (pin.txt), the arrivals list (arrivals.csv), the key that signs
// QR codes (key.txt, made on first use) and the attempt counters (limits/).
declare(strict_types=1);

ini_set('display_errors', '0');
date_default_timezone_set('Asia/Kolkata');

const PRIVATE_DIR = 'oakjmun-private';

function private_path(string $name): string
{
    $dir = dirname(__DIR__, 2) . '/' . PRIVATE_DIR;
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    // In case the folder ever ends up inside a web folder: refuse every request for it.
    if (is_dir($dir) && !is_file($dir . '/.htaccess')) {
        @file_put_contents($dir . '/.htaccess', "Require all denied\n");
    }
    return $dir . '/' . $name;
}

function respond(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
    exit;
}

// The JSON body of a POST request. Anything else is refused.
function read_post(): array
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        respond(405, ['error' => 'method']);
    }
    $data = json_decode((string) file_get_contents('php://input', false, null, 0, 4096), true);
    return is_array($data) ? $data : [];
}

function client_ip(): string
{
    // Visitors arrive through Cloudflare, which passes on their own address.
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
}

// True while this visitor has made fewer than $max attempts of this kind in the last $window
// seconds. $record adds this attempt to the count.
function within_limit(string $kind, int $max, int $window, bool $record = true): bool
{
    $dir = private_path('limits');
    if (!is_dir($dir)) {
        @mkdir($dir, 0700);
    }
    $fh = @fopen($dir . '/' . $kind . '-' . substr(hash('sha256', client_ip()), 0, 32), 'c+');
    if (!$fh) {
        return true; // a file problem never locks everyone out
    }
    flock($fh, LOCK_EX);
    $now = time();
    $times = array_filter(
        array_map('intval', explode(',', (string) stream_get_contents($fh))),
        fn (int $t) => $t > $now - $window
    );
    $ok = count($times) < $max;
    if ($ok && $record) {
        $times[] = $now;
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, implode(',', $times));
    flock($fh, LOCK_UN);
    fclose($fh);
    return $ok;
}

// The delegate list: the allocation sheet saved as CSV. Its columns are found by their headings:
// Email, Name, Committee, and Allocation (or Country, Portfolio, Delegation). Null until the
// file is uploaded, which is what keeps QR codes closed.
function delegates(): ?array
{
    $file = private_path('delegates.csv');
    if (!is_readable($file)) {
        return null;
    }
    $fh = fopen($file, 'r');
    $head = fgetcsv($fh, null, ',', '"', '') ?: [];
    $head = array_map(fn ($h) => strtolower(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string) $h))), $head);
    $find = function (array $words, array $skip = []) use ($head): ?int {
        foreach ([true, false] as $exact) {
            foreach ($words as $word) {
                foreach ($head as $i => $h) {
                    $hit = $exact ? $h === $word : str_contains($h, $word);
                    foreach ($skip as $s) {
                        $hit = $hit && !str_contains($h, $s);
                    }
                    if ($hit) {
                        return $i;
                    }
                }
            }
        }
        return null;
    };
    $col = [
        'email' => $find(['email', 'e-mail']),
        'name' => $find(['name', 'full name', 'delegate'], ['school', 'parent', 'guardian', 'email']),
        'committee' => $find(['committee']),
        'allocation' => $find(['allocation', 'country', 'portfolio', 'delegation']),
    ];
    if ($col['email'] === null) {
        fclose($fh);
        return [];
    }
    $list = [];
    while (($row = fgetcsv($fh, null, ',', '"', '')) !== false) {
        $get = fn (string $k) => $col[$k] === null ? '' : trim((string) ($row[$col[$k]] ?? ''));
        $email = strtolower($get('email'));
        if ($email !== '' && !isset($list[$email])) {
            $list[$email] = [
                'email' => $email,
                'name' => $get('name'),
                'committee' => $get('committee'),
                'allocation' => $get('allocation'),
            ];
        }
    }
    fclose($fh);
    return $list;
}

// The code inside a delegate's QR: a signature of their email, so it can't be guessed or made
// up, and says nothing about them by itself.
function token_for(string $email): string
{
    static $key = null;
    if ($key === null) {
        $file = private_path('key.txt');
        $key = is_readable($file) ? trim((string) file_get_contents($file)) : '';
        if (strlen($key) < 32) {
            $key = bin2hex(random_bytes(32));
            file_put_contents($file, $key, LOCK_EX);
            @chmod($file, 0600);
        }
    }
    return substr(hash_hmac('sha256', $email, $key), 0, 20);
}

// The volunteer PIN, or null if pin.txt hasn't been made.
function volunteer_pin(): ?string
{
    $file = private_path('pin.txt');
    $pin = is_readable($file) ? trim((string) file_get_contents($file)) : '';
    return $pin === '' ? null : $pin;
}

// Stops with an error unless the request carries the right PIN. Wrong PINs are counted: ten in
// ten minutes and that phone has to wait.
function require_pin(array $in): void
{
    $pin = volunteer_pin();
    if ($pin === null) {
        respond(503, ['error' => 'nopin']);
    }
    if (!within_limit('pin', 10, 600, false)) {
        respond(429, ['error' => 'busy']);
    }
    if (!hash_equals($pin, (string) ($in['pin'] ?? ''))) {
        within_limit('pin', 10, 600);
        respond(403, ['error' => 'pin']);
    }
}

// A spreadsheet cell that can't be read as a formula when the arrivals list is opened in Excel.
function cell(string $value): string
{
    return preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
}
