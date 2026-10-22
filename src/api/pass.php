<?php
// The QR page asks here for a delegate's pass by the email they registered with (docs/QR.md).
// The passes are kept by the check-in app: this asks it on the visitor's behalf, with the key in
// oakjmun-private/checkin.json, so the visitor's browser never learns the app's address or key.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$in = read_post();
// The switch in site.json → qrPage → open (docs/QR.md): until it's on, no pass is given out,
// whatever the check-in app says.
if (!passes_open()) {
    respond(503, ['error' => 'closed']);
}
if (!within_limit('pass', 60, 600)) {
    respond(429, ['error' => 'busy']);
}
$email = strtolower(trim((string) ($in['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, ['error' => 'email']);
}
$app = checkin_app();
if ($app === null) {
    respond(503, ['error' => 'closed']);
}

[$status, $body] = post_json($app['url'] . '/api/pass', ['email' => $email, 'visitor' => client_ip()], ['X-Pass-Key: ' . $app['key']]);

// One delegate's pass, with only the fields the QR page shows; null if it isn't a pass.
function pass_of(mixed $p): ?array
{
    if (!is_array($p) || !preg_match('/^OAKJMUN:[0-9a-f]{20}$/', (string) ($p['qr'] ?? ''))) {
        return null;
    }
    $text = fn (string $k) => is_string($p[$k] ?? null) ? $p[$k] : '';
    return [
        'name' => $text('name'),
        'committee' => $text('committee'),
        'code' => $text('code'),
        'allocation' => $text('allocation'),
        'detail' => $text('detail'),
        'qr' => $p['qr'],
    ];
}

if ($status === 200) {
    // Brothers and sisters on one email (22 October): the app sends each one's pass, and the QR
    // page shows a button for each name.
    if (is_array($body['people'] ?? null)) {
        $people = array_values(array_filter(array_map('pass_of', array_slice($body['people'], 0, 6))));
        if (count($people) > 1) {
            respond(200, ['people' => $people]);
        }
        if (count($people) === 1) {
            respond(200, $people[0]);
        }
    } elseif (($one = pass_of($body)) !== null) {
        respond(200, $one);
    }
}
// The app's answers the QR page has words for; anything else (or no answer) is "error".
$known = ['closed' => 503, 'unknown' => 404, 'email' => 400, 'busy' => 429];
$error = (string) ($body['error'] ?? '');
if (!isset($known[$error])) {
    respond(502, ['error' => 'error']);
}
respond($known[$error], ['error' => $error]);
