<?php
// Desk check-in (docs/QR.md). A volunteer's phone sends the code from a delegate's QR (or the
// delegate's email) with the volunteer PIN; the delegate is added to arrivals.csv once.
// With "check": "pin" it only tests the PIN and returns the count so far.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$in = read_post();
require_pin($in);
$list = delegates();
if ($list === null) {
    respond(503, ['error' => 'closed']);
}

$fh = fopen(private_path('arrivals.csv'), 'c+');
if (!$fh) {
    respond(500, ['error' => 'server']);
}
flock($fh, LOCK_EX);
$arrived = [];
while (($row = fgetcsv($fh, null, ',', '"', '')) !== false) {
    if (isset($row[1]) && $row[0] !== 'Time') {
        $arrived[strtolower($row[1])] = $row[0];
    }
}
$count = function () use (&$arrived, $list): array {
    return ['arrived' => count($arrived), 'total' => count($list)];
};

if (($in['check'] ?? '') === 'pin') {
    flock($fh, LOCK_UN);
    respond(200, $count());
}

$d = null;
$token = (string) ($in['token'] ?? '');
if ($token !== '') {
    foreach ($list as $row) {
        if (hash_equals(token_for($row['email']), $token)) {
            $d = $row;
            break;
        }
    }
} else {
    $d = $list[strtolower(trim((string) ($in['email'] ?? '')))] ?? null;
}
if ($d === null) {
    flock($fh, LOCK_UN);
    respond(404, ['error' => 'unknown'] + $count());
}

$already = $arrived[$d['email']] ?? null;
if ($already === null) {
    $now = date('Y-m-d H:i');
    fseek($fh, 0, SEEK_END);
    if (ftell($fh) === 0) {
        fputcsv($fh, ['Time', 'Email', 'Name', 'Committee', 'Allocation'], ',', '"', '');
    }
    fputcsv($fh, [$now, cell($d['email']), cell($d['name']), cell($d['committee']), cell($d['allocation'])], ',', '"', '');
    fflush($fh);
    $arrived[$d['email']] = $now;
}
flock($fh, LOCK_UN);
fclose($fh);

respond(200, [
    'name' => $d['name'],
    'committee' => $d['committee'],
    'allocation' => $d['allocation'],
    'already' => $already !== null,
    'at' => substr($already ?? $arrived[$d['email']], 11, 5),
] + $count());
