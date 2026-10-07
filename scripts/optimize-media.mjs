// npm run media
// Shrinks source images and encodes the hero video, so the repo stays small and
// builds stay fast. eleventy-img makes the responsive avif/webp/jpeg sizes at
// build time; this script only prepares the originals. Safe to run repeatedly.
//
// Images (sharp), anywhere under src/assets/img/:
//   - rotated upright, metadata stripped, capped at 2400 px wide
//   - re-encoded only when resized or larger than 500 KB
//   - src/assets/img/committees/ is converted to black and white (PLAN.md D2)
//   - src/assets/img/logos/ is capped at 320 px (they show at 76 px)
//
// Video (ffmpeg), from src/assets/video/source/ (not committed) to src/assets/video/:
//   <name>.av1.webm (AV1) and <name>.h264.mp4 (H.264, faststart), 720p, max 40 s, no audio,
//   plus a poster frame at src/assets/img/<name>-poster.jpg (not made larger than the video).
import { readdir, stat, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import sharp from "sharp";

const run = promisify(execFile);
const IMG_DIR = "src/assets/img";
const VIDEO_SRC = "src/assets/video/source";
const VIDEO_OUT = "src/assets/video";
const MAX_WIDTH = 2400;
const LOGO_WIDTH = 320;
const MAX_BYTES = 500 * 1024;
const VIDEO_LIMIT = 6 * 1024 * 1024;
// Raised from 20 s on 7 October for the 38 s hero montage; the H.264 CRF went from 27 to 29 to
// keep it under VIDEO_LIMIT (it plays at 22% opacity behind the hero, so the loss doesn't show).
const VIDEO_SECONDS = "40";

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

async function walk(dir, exts) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full, exts)));
    else if (exts.includes(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

async function optimiseImage(file) {
  const parts = file.split(path.sep);
  const isCommittee = parts.includes("committees");
  const isLogo = parts.includes("logos");
  const limit = isLogo ? LOGO_WIDTH : MAX_WIDTH;
  const before = (await stat(file)).size;
  const meta = await sharp(file).metadata();
  const alreadyGrey = meta.channels === 1 || meta.space === "b-w";

  const needsResize = (meta.width ?? 0) > limit;
  const needsGrey = isCommittee && !alreadyGrey;
  if (!needsResize && !needsGrey && before <= MAX_BYTES) return null;

  let pipeline = sharp(file).rotate();
  if (needsResize) pipeline = pipeline.resize({ width: limit, withoutEnlargement: true });
  if (isCommittee) pipeline = pipeline.grayscale().toColourspace("b-w");

  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") pipeline = pipeline.png({ compressionLevel: 9, palette: isLogo });
  else if (ext === ".webp") pipeline = pipeline.webp({ quality: 80 });
  else pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });

  const buffer = await pipeline.toBuffer();
  // Never replace a file with a bigger one unless we resized or desaturated it.
  if (buffer.length >= before && !needsResize && !needsGrey) return null;
  await writeFile(file, buffer);
  return `${file}: ${kb(before)} -> ${kb(buffer.length)}${needsGrey ? " (black and white)" : ""}`;
}

async function hasFfmpeg() {
  try {
    await run("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

async function newer(output, input) {
  try {
    return (await stat(output)).mtimeMs >= (await stat(input)).mtimeMs;
  } catch {
    return false;
  }
}

async function encodeVideo(file) {
  const name = path.basename(file, path.extname(file));
  const av1 = path.join(VIDEO_OUT, `${name}.av1.webm`);
  const h264 = path.join(VIDEO_OUT, `${name}.h264.mp4`);
  const poster = path.join(IMG_DIR, `${name}-poster.jpg`);
  const filters = "scale=-2:720,fps=30";
  const notes = [];

  if (!(await newer(av1, file))) {
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-t", VIDEO_SECONDS, "-an", "-vf", filters,
      "-c:v", "libsvtav1", "-crf", "40", "-preset", "6", "-pix_fmt", "yuv420p", av1]);
    notes.push(`${av1}: ${kb((await stat(av1)).size)}`);
  }
  if (!(await newer(h264, file))) {
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-t", VIDEO_SECONDS, "-an", "-vf", filters,
      "-c:v", "libx264", "-crf", "29", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", h264]);
    notes.push(`${h264}: ${kb((await stat(h264)).size)}`);
  }
  if (!(await newer(poster, file))) {
    await mkdir(IMG_DIR, { recursive: true });
    await run("ffmpeg", ["-y", "-loglevel", "error", "-ss", "0.5", "-i", file, "-frames:v", "1",
      "-vf", "scale=-2:'min(1080,ih)'", "-q:v", "3", poster]);
    notes.push(`${poster}: poster frame`);
  }
  for (const out of [av1, h264]) {
    if ((await stat(out)).size > VIDEO_LIMIT) notes.push(`Warning: ${out} is over 6 MB. Trim the clip or raise the CRF.`);
  }
  return notes;
}

async function main() {
  const images = await walk(IMG_DIR, [".jpg", ".jpeg", ".png", ".webp"]);
  let changed = 0;
  for (const file of images) {
    const note = await optimiseImage(file);
    if (note) {
      console.log(note);
      changed++;
    }
  }
  console.log(`Images: ${images.length} checked, ${changed} optimised.`);

  const videos = await walk(VIDEO_SRC, [".mp4", ".mov", ".m4v", ".webm"]);
  if (videos.length === 0) {
    console.log(`Video: nothing in ${VIDEO_SRC}/.`);
    return;
  }
  if (!(await hasFfmpeg())) {
    console.log(
      "Video: skipped, because ffmpeg isn't installed. Install it (Mac: brew install ffmpeg; " +
        "Windows: winget install ffmpeg; or https://ffmpeg.org/download.html), then run npm run media again.",
    );
    return;
  }
  await mkdir(VIDEO_OUT, { recursive: true });
  for (const file of videos) for (const note of await encodeVideo(file)) console.log(note);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
