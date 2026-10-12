<?php
// The custom 404 page with a real 404 status (12 October). GoDaddy's Apache answers missing
// addresses with its own one-line "404 Not Found" and ignores ErrorDocument in .htaccess, so
// .htaccess sends missing addresses here instead, and this sends 404.html (src/404.njk).
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
readfile(__DIR__ . '/404.html');
