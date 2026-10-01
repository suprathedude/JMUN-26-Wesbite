// A tiny static server for _site, used by the screenshot script. It mirrors how
// Cloudflare Pages resolves URLs: /path/ -> /path/index.html, unknown -> /404.html.
import { createServer } from "node:http";
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

export function serve(dir, port = 0) {
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
    const body = await readFile(file);
    res.writeHead(status, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    res.end(body);
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` });
    });
  });
}
