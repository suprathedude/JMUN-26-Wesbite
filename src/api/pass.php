<?php
// The QR page asks here for a delegate's pass by the email they registered with (docs/QR.md).
declare(strict_types=1);
require __DIR__ . '/lib.php';

$in = read_post();
if (!within_limit('pass', 60, 600)) {
    respond(429, ['error' => 'busy']);
}
$list = delegates();
if ($list === null) {
    respond(503, ['error' => 'closed']);
}
$email = strtolower(trim((string) ($in['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, ['error' => 'email']);
}
$d = $list[$email] ?? null;
if ($d === null) {
    respond(404, ['error' => 'unknown']);
}
respond(200, [
    'name' => $d['name'],
    'committee' => $d['committee'],
    'allocation' => $d['allocation'],
    'token' => token_for($email),
]);
