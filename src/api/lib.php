<?php
// Shared by the QR page's pass lookup (docs/QR.md).
//
// Since 18 October the passes come from the check-in app, a separate private app on its own
// address: this website asks it for a delegate's pass on the visitor's behalf. Its address and
// key are in the folder "oakjmun-private" next to the website's folder, never inside it, so no
// web address reaches them and they're never in GitHub: checkin.json, uploaded by the
// Secretariat. The folder also holds the lookup counters (limits/).
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

// True once site.json → qrPage → open is on, from settings.php, which the build makes. A missing
// file counts as off.
function passes_open(): bool
{
    $file = __DIR__ . '/settings.php';
    if (is_file($file)) {
        require_once $file;
    }
    return defined('PASSES_OPEN') && PASSES_OPEN === true;
}

// Cloudflare's addresses (cloudflare.com/ips). A visitor's own address in CF-Connecting-IP is
// believed only from these, so nobody can send a made-up one to get round the lookup limit.
const CLOUDFLARE = [
    '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
    '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
    '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
    '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
    '2a06:98c0::/29', '2c0f:f248::/32',
];

function in_range(string $ip, string $cidr): bool
{
    [$net, $bits] = explode('/', $cidr);
    $a = @inet_pton($ip);
    $b = @inet_pton($net);
    if ($a === false || $b === false || strlen($a) !== strlen($b)) {
        return false;
    }
    $bits = (int) $bits;
    $whole = intdiv($bits, 8);
    if (strncmp($a, $b, $whole) !== 0) {
        return false;
    }
    $rest = $bits % 8;
    if ($rest === 0) {
        return true;
    }
    $mask = (0xff << (8 - $rest)) & 0xff;
    return (ord($a[$whole]) & $mask) === (ord($b[$whole]) & $mask);
}

function client_ip(): string
{
    $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $ip = $remote;
    // Through Cloudflare, the connection comes from Cloudflare and the visitor's own address is
    // passed on in CF-Connecting-IP.
    $passed = (string) ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? '');
    if ($passed !== '' && filter_var($remote, FILTER_VALIDATE_IP)) {
        foreach (CLOUDFLARE as $cidr) {
            if (in_range($remote, $cidr)) {
                $ip = filter_var($passed, FILTER_VALIDATE_IP) ? $passed : $remote;
                break;
            }
        }
    }
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

// The check-in app's address and key, from checkin.json: { "url": "https://…", "key": "…" }.
// Null until the file is uploaded, which keeps the QR page saying passes aren't open yet.
function checkin_app(): ?array
{
    $file = private_path('checkin.json');
    $app = is_readable($file) ? json_decode((string) file_get_contents($file), true) : null;
    $url = rtrim((string) ($app['url'] ?? ''), '/');
    $key = trim((string) ($app['key'] ?? ''));
    $local = preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $url) === 1; // for testing on a laptop
    if ((!str_starts_with($url, 'https://') && !$local) || strlen($key) < 32) {
        return null;
    }
    return ['url' => $url, 'key' => $key];
}

// POSTs JSON and returns [status, decoded body]; [0, []] if the app couldn't be reached.
function post_json(string $url, array $data, array $headers): array
{
    $payload = json_encode($data);
    $headers = array_merge(['Content-Type: application/json', 'Accept: application/json'], $headers);
    $text = false;
    $status = 0;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_FOLLOWLOCATION => false,
        ]);
        $text = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    } else {
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $payload,
            'timeout' => 12,
            'ignore_errors' => true,
            'follow_location' => 0,
        ]]);
        $text = @file_get_contents($url, false, $context);
        $lines = function_exists('http_get_last_response_headers') ? (http_get_last_response_headers() ?? []) : ($http_response_header ?? []);
        foreach ($lines as $line) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $line, $m)) {
                $status = (int) $m[1];
            }
        }
    }
    if (!is_string($text) || $status === 0) {
        return [0, []];
    }
    $body = json_decode($text, true);
    return [$status, is_array($body) ? $body : []];
}
