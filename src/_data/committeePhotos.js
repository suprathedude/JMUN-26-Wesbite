// Card-sized photos for the committee ring on the homepage (6 October): each committee's
// photo from committees.json as a 560 px WebP, keyed by slug. The ring's cards are drawn by
// script, so their pictures don't go through the <img> transform the rest of the site uses.
// The paths have no leading slash: ring.js resolves them against the page.
import { readFile } from "node:fs/promises";
import Image from "@11ty/eleventy-img";

export default async function () {
  const committees = JSON.parse(await readFile("src/_data/committees.json", "utf8"));
  const photos = {};
  for (const c of committees) {
    if (!c.image) continue;
    try {
      const meta = await Image(`src/${c.image}`, {
        widths: [560],
        formats: ["webp"],
        sharpWebpOptions: { quality: 72 },
        outputDir: "_site/img/",
        urlPath: "img/",
      });
      photos[c.slug] = meta.webp[0].url;
    } catch {
      // A missing photo is reported by the data check; the card shows the navy tile instead.
    }
  }
  return photos;
}
