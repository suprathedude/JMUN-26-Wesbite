// Draws the Social Night moon (src/assets/img/social/moon.webp), 7 October. Run it once with
// `node scripts/make-moon.mjs`; the image is committed, so builds don't need it.
//
// The moon is rendered, not photographed: the seas (maria) sit where they are on the real
// near side, with Tycho's, Copernicus's and Kepler's ray systems, a few thousand craters with
// rims and bowls, fine grain, and light from just beside the viewer (a nearly full moon), so
// the relief shows towards one edge. Replace it with a photo any time: same path, square,
// transparent round the disc.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SIZE = 1000;
const R = SIZE / 2 - 1; // disc radius in pixels (the page clips the edge round, see .sn-moon)
const C = SIZE / 2;
const OUT = "src/assets/img/social/moon.webp";

// Seeded random numbers, so every run draws the same moon.
let seed = 20261030;
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 3D value noise on the sphere (no seam), and fractal sums of it.
const PERM = Uint8Array.from({ length: 512 }, (_, i) => i % 256);
for (let i = 255; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [PERM[i], PERM[j]] = [PERM[j], PERM[i]];
}
for (let i = 0; i < 256; i++) PERM[i + 256] = PERM[i];
const VALUES = Float32Array.from({ length: 256 }, () => random() * 2 - 1);
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
function noise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const X = xi & 255, Y = yi & 255, Z = zi & 255;
  const v = (a, b, c) => VALUES[PERM[PERM[PERM[X + a] + Y + b] + Z + c]];
  const u = fade(xf), w = fade(yf), s = fade(zf);
  return lerp(
    lerp(lerp(v(0, 0, 0), v(1, 0, 0), u), lerp(v(0, 1, 0), v(1, 1, 0), u), w),
    lerp(lerp(v(0, 0, 1), v(1, 0, 1), u), lerp(v(0, 1, 1), v(1, 1, 1), u), w),
    s,
  );
}
function fbm(x, y, z, octaves, scale) {
  let sum = 0, amp = 0.5, f = scale;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * f + i * 17.3, y * f - i * 9.1, z * f + i * 4.7);
    f *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

// Selenographic longitude and latitude (degrees) to a unit vector: x right, y up, z to us.
const toVec = (lon, lat) => {
  const a = (lon * Math.PI) / 180, b = (lat * Math.PI) / 180;
  return [Math.cos(b) * Math.sin(a), Math.sin(b), Math.cos(b) * Math.cos(a)];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const angle = (a, b) => (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI;

// The near side's seas: [longitude, latitude, radius in degrees, darkness 0 to 1]. Several
// blobs make up the irregular ones.
const MARIA = [
  [-57, 22, 17, 0.9], [-52, 2, 15, 0.9], [-64, 38, 11, 0.85], [-44, 12, 10, 0.9], [-60, -6, 9, 0.85], // Oceanus Procellarum
  [-16, 33, 17, 1], [-28, 40, 8, 0.95], // Imbrium, Sinus Iridum
  [18, 28, 10, 0.8], // Serenitatis
  [31, 8, 12, 1], [24, 2, 6, 0.95], // Tranquillitatis
  [59, 17, 7.5, 1], // Crisium
  [51, -6, 9, 0.85], [55, -14, 6, 0.8], // Fecunditatis
  [35, -15, 5.5, 0.85], // Nectaris
  [-17, -21, 10, 0.85], [-23, -10, 6, 0.8], // Nubium, Cognitum
  [-39, -24, 6, 0.9], // Humorum
  [4, 13, 4.5, 0.75], [1, 2, 3.5, 0.7], // Vaporum, Sinus Medii
  [-31, 7, 7, 0.8], // Insularum
  [-36, 56, 5, 0.75], [-14, 57, 6, 0.8], [6, 58, 6, 0.8], [26, 56, 5, 0.7], // Frigoris
  [86, 2, 5, 0.6], [80, 13, 4, 0.6], // Smythii and Marginis, on the edge
].map(([lon, lat, r, dark]) => ({ v: toVec(lon, lat), r: r * 1.15, dark }));

// Young craters with bright rays: [longitude, latitude, crater radius, ray length, rays].
const RAYED = [
  [-11.4, -43.3, 1.4, 55, 14], // Tycho
  [-20.1, 9.6, 1.6, 22, 12], // Copernicus
  [-38, 8.1, 0.9, 16, 10], // Kepler
  [-47.4, 23.7, 0.7, 9, 7], // Aristarchus
  [-61, -24, 0.5, 7, 6], // Byrgius A
].map(([lon, lat, r, length, count]) => ({
  v: toVec(lon, lat),
  r,
  length,
  rays: Array.from({ length: count * 2 }, () => ({ bearing: random() * 360, width: 3 + random() * 8, reach: 0.3 + random() * 0.7 })),
}));

// Craters, many small and few large, scattered over the near side; [vector, radius°, age].
const craters = [];
for (let i = 0; i < 6000; i++) {
  const z = random(), phi = random() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  const v = [s * Math.cos(phi), s * Math.sin(phi), z];
  const r = 0.18 + 5 * Math.pow(random(), 8); // degrees
  craters.push({ v, r, young: r < 1.2 && random() < 0.1 });
}
for (const ray of RAYED) craters.push({ v: ray.v, r: ray.r, young: true });

// Height and extra brightness, built crater by crater over the pixels each one covers.
const height = new Float32Array(SIZE * SIZE);
const glow = new Float32Array(SIZE * SIZE);
const pixelVec = (px, py) => {
  const x = (px + 0.5 - C) / R, y = (C - py - 0.5) / R;
  const r2 = x * x + y * y;
  return r2 >= 1 ? null : [x, y, Math.sqrt(1 - r2)];
};
for (const { v, r, young } of craters) {
  const cx = C + v[0] * R, cy = C - v[1] * R;
  const reach = Math.ceil(((r * 2.6 * Math.PI) / 180) * R) + 2;
  const depth = 0.5 + 0.5 * (young ? 1 : random());
  for (let py = Math.max(0, Math.floor(cy - reach)); py < Math.min(SIZE, cy + reach); py++) {
    for (let px = Math.max(0, Math.floor(cx - reach)); px < Math.min(SIZE, cx + reach); px++) {
      const p = pixelVec(px, py);
      if (!p) continue;
      const t = angle(p, v) / r;
      if (t > 2.6) continue;
      const i = py * SIZE + px;
      // A bowl, a raised rim, then the blanket of rubble fading out.
      const bowl = t < 1 ? (t * t - 1) * 0.9 : 0;
      const rim = 0.45 * Math.exp(-(((t - 1) / 0.22) ** 2));
      const blanket = t > 1 ? 0.12 * Math.exp(-(t - 1) * 2.4) : 0;
      height[i] += depth * r * (bowl + rim + blanket);
      if (young) glow[i] += t < 1.1 ? 0.12 : 0.08 * Math.exp(-(t - 1.1) * 3.5);
    }
  }
}

const light = (() => {
  const l = [-0.3, 0.1, 0.95];
  const n = Math.hypot(...l);
  return l.map((c) => c / n);
})();

const rgba = Buffer.alloc(SIZE * SIZE * 4);
for (let py = 0; py < SIZE; py++) {
  for (let px = 0; px < SIZE; px++) {
    const o = (py * SIZE + px) * 4;
    const x = (px + 0.5 - C) / R, y = (C - py - 0.5) / R;
    const dist = Math.sqrt(x * x + y * y);
    const edge = Math.max(0, Math.min(1, (1 - dist) * R + 0.5));
    if (edge <= 0) continue;
    const p = [x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y))];

    // Seas, with ragged edges.
    // Each sea is a soft blob; together they melt into one field, and noise roughs up where
    // that field crosses into the highlands.
    let field = 0;
    for (const m of MARIA) {
      const d = angle(p, m.v) / m.r;
      if (d < 3) field += m.dark * Math.exp(-d * d * 1.1);
    }
    const ragged = field + 0.32 * fbm(p[0], p[1], p[2], 5, 4.5);
    const f = Math.max(0, Math.min(1, (ragged - 0.3) / 0.42));
    const sea = f * f * (3 - 2 * f) * Math.min(1, 0.55 + field * 0.5);

    // Highlands are bright and busy, seas darker and smoother.
    const rough = fbm(p[0], p[1], p[2], 5, 7);
    const fine = fbm(p[0], p[1], p[2], 3, 48);
    const highland = 0.74 + 0.22 * rough + 0.08 * fine;
    const mare = 0.35 + 0.14 * fbm(p[0], p[1], p[2], 4, 2.6) + 0.04 * fine;
    let albedo = highland * (1 - sea) + mare * sea;

    // Rays.
    for (const ray of RAYED) {
      const d = angle(p, ray.v);
      if (d > ray.length) continue;
      // A bright collar round the crater; the rays themselves start a little way out.
      albedo += 0.12 * Math.exp(-(((d - ray.r * 1.6) / (ray.r * 1.2)) ** 2));
      const start = Math.max(0, Math.min(1, (d - ray.r * 1.5) / (ray.r * 4)));
      if (!start) continue;
      // Bearing from the crater, on the tangent plane.
      const north = [-ray.v[0] * ray.v[1], 1 - ray.v[1] * ray.v[1], -ray.v[2] * ray.v[1]];
      const nl = Math.hypot(...north) || 1;
      const east = [ray.v[1] * north[2] - ray.v[2] * north[1], ray.v[2] * north[0] - ray.v[0] * north[2], ray.v[0] * north[1] - ray.v[1] * north[0]];
      const el = Math.hypot(...east) || 1;
      const bearing = (Math.atan2(dot(p, east) / el, dot(p, north) / nl) * 180) / Math.PI;
      let s = 0;
      for (const r of ray.rays) {
        const diff = ((bearing - r.bearing + 540) % 360) - 180;
        const along = d / (ray.length * r.reach);
        if (along > 1) continue;
        s += Math.exp(-((diff / r.width) ** 2)) * (1 - along) ** 1.2;
      }
      // Patchy along their length, like the real ones.
      albedo += Math.min(0.2, s * 0.08) * (0.75 + 0.6 * rough) * start;
    }

    const i = py * SIZE + px;
    albedo += glow[i];

    // Relief: tilt the surface normal by the height's slope, then light it almost from the
    // front (Lommel-Seeliger, the moon's own law: barely any darkening towards the edge).
    const h = (dx, dy) => height[Math.min(SIZE - 1, Math.max(0, py + dy)) * SIZE + Math.min(SIZE - 1, Math.max(0, px + dx))];
    const k = 0.07;
    const gx = (h(1, 0) - h(-1, 0)) * k, gy = (h(0, -1) - h(0, 1)) * k;
    let n = [p[0] - gx, p[1] - gy, p[2]];
    const nl = Math.hypot(...n);
    n = n.map((c) => c / nl);
    const mu0 = Math.max(0, dot(n, light));
    const mu = Math.max(0.05, n[2]);
    const shade = (2 * mu0) / (mu0 + mu);

    let value = albedo * shade * 0.98;
    value = Math.max(0, Math.min(1, value));
    // Warm, like the site's moon: cream highlands, slightly cooler seas.
    const warm = 1 - sea * 0.6;
    rgba[o] = Math.round(255 * Math.min(1, value * 1.0));
    rgba[o + 1] = Math.round(255 * Math.min(1, value * (0.965 + 0.02 * (1 - warm))));
    rgba[o + 2] = Math.round(255 * Math.min(1, value * (0.9 + 0.06 * (1 - warm))));
    rgba[o + 3] = Math.round(255 * edge);
  }
}

mkdirSync("src/assets/img/social", { recursive: true });
await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } })
  .webp({ quality: 90, alphaQuality: 100, effort: 6 })
  .toFile(OUT);
console.log(`Wrote ${OUT}`);
