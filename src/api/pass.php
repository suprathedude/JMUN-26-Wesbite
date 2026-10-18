<?php
// The QR page asks here for a delegate's pass by the email they registered with (docs/QR.md).
// The passes are kept by the check-in app: this asks it on the visitor's behalf, with the key in
// oakjmun-private/checkin.json, so the visitor's browser never learns the app's address or key.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$in = read_post();
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

if ($status === 200 && preg_match('/^OAKJMUN:[0-9a-f]{20}$/', (string) ($body['qr'] ?? ''))) {
    $text = fn (string $k) => is_string($body[$k] ?? null) ? $body[$k] : '';
    respond(200, [
        'name' => $text('name'),
        'committee' => $text('committee'),
        'code' => $text('code'),
        'allocation' => $text('allocation'),
        'detail' => $text('detail'),
        'qr' => $body['qr'],
    ]);
}
// The app's answers the QR page has words for; anything else (or no answer) is "error".
$known = ['closed' => 503, 'unknown' => 404, 'email' => 400, 'busy' => 429];
$error = (string) ($body['error'] ?? '');
if (!isset($known[$error])) {
    respond(502, ['error' => 'error']);
}
respond($known[$error], ['error' => $error]);
