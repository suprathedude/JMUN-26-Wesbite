// A tiny static server for _site, used by the screenshot script and for local speed checks.
// It resolves URLs the way the live server does (src/.htaccess: /path/ -> /path/index.html,
// unknown -> /404.html) and compresses text with brotli or gzip.
import { createServer } from "node:http";
import zlib, { brotliCompressSync, gzipSync } from "node:zlib";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

async function isFile(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

// Compressed once per file and kept, as a real server or Cloudflare does: compressing the 1 MB
// gallery script on every request held up everything behind it (16 October, npm run perf).
const packed = new Map();
async function compressed(file, body, encoding) {
  const { mtimeMs } = await stat(file);
  const key = `${encoding} ${file}`;
  const hit = packed.get(key);
  if (hit?.mtimeMs === mtimeMs) return hit.body;
  const out =
    encoding === "br"
      ? brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
      : gzipSync(body);
  packed.set(key, { mtimeMs, body: out });
  return out;
}

// htmlDelay (ms) holds every page back that long before answering, like a slow web host
// (npm run perf; GoDaddy takes about half a second, docs/CLOUDFLARE.md).
export function serve(dir, port = 0, { htmlDelay = 0 } = {}) {
  const root = path.resolve(dir);
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
    else if (!(await isFile(file)) && (await isFile(file + ".html"))) file += ".html";
    else if (!(await isFile(file)) && (await isFile(path.join(file, "index.html")))) {
      res.writeHead(308, { Location: url.pathname + "/" }).end();
      return;
    }
    let status = 200;
    if (!(await isFile(file))) {
      file = path.join(root, "404.html");
      status = 404;
    }
    let body = await readFile(file);
    const type = TYPES[path.extname(file)] ?? "application/octet-stream";
    const headers = { "Content-Type": type, Vary: "Accept-Encoding" };
    const accepts = String(req.headers["accept-encoding"] ?? "");
    if (/^(text\/|application\/json|image\/svg)/.test(type)) {
      const encoding = accepts.includes("br") ? "br" : accepts.includes("gzip") ? "gzip" : "";
      if (encoding) {
        body = await compressed(file, body, encoding);
        headers["Content-Encoding"] = encoding;
      }
    }
    if (htmlDelay && type.startsWith("text/html")) await new Promise((r) => setTimeout(r, htmlDelay));
    res.writeHead(status, headers);
    res.end(body);
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` });
    });
  });
}
