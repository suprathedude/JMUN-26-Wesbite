<?php
// The arrivals list as a spreadsheet (CSV), for volunteers with the PIN (docs/QR.md).
declare(strict_types=1);
require __DIR__ . '/lib.php';

$in = read_post();
require_pin($in);
$file = private_path('arrivals.csv');
http_response_code(200);
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="oakjmun-arrivals.csv"');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
echo "\xEF\xBB\xBF"; // so Excel reads names as UTF-8
if (is_readable($file)) {
    readfile($file);
} else {
    echo "Time,Email,Name,Committee,Allocation\n";
}
