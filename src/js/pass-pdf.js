// The QR pass as a one-page A4 PDF, to save or print (18 October). Written by hand: the PDF's
// own Helvetica (no font to download), the QR drawn as squares so it prints sharp at any size,
// and a page that's mostly white so it doesn't eat printer ink. Loaded by qr.js only when
// "Download PDF" is tapped.

const W = 595.28; // A4, in points
const H = 841.89;
const NAVY = "0 0.188 0.341";
const GREY = "0.35 0.38 0.42";

// Helvetica's character widths (thousandths of the font size) for " " to "~"; anything else
// is taken as 556, about the width of a letter.
const WIDTHS = {
  F1: "278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584",
  F2: "278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584",
};
const widths = Object.fromEntries(Object.entries(WIDTHS).map(([k, v]) => [k, v.split(",").map(Number)]));
const textWidth = (text, font, size) =>
  [...text].reduce((w, ch) => {
    const code = ch.charCodeAt(0);
    return w + (code >= 32 && code <= 126 ? widths[font][code - 32] : 556);
  }, 0) * (size / 1000);

// The PDF's standard fonts know Windows-1252 letters only: Latin-1 as it is, a few marks from
// beyond it, and "?" for anything else.
const BEYOND = { "€": 0x80, "‚": 0x82, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "™": 0x99 };
const pdfString = (text) =>
  "(" +
  [...String(text)]
    .map((ch) => {
      const c = ch.charCodeAt(0);
      const b = c < 256 ? c : (BEYOND[ch] ?? 63);
      if (b === 40 || b === 41 || b === 92) return "\\" + ch;
      if (b < 32 || b > 126) return "\\" + b.toString(8).padStart(3, "0");
      return String.fromCharCode(b);
    })
    .join("") +
  ")";

// One line of text, centred, made smaller until it fits the page.
function centred(text, { font = "F1", size, y, color = "0 0 0", min = 10 }) {
  if (!text) return "";
  let s = size;
  while (s > min && textWidth(text, font, s) > W - 112) s -= 1;
  const x = (W - textWidth(text, font, s)) / 2;
  return `BT /${font} ${s} Tf ${color} rg ${x.toFixed(2)} ${y.toFixed(2)} Td ${pdfString(text)} Tj ET\n`;
}

// The QR's dark squares, joined into runs along each row.
function qrSquares(qr, x, y, size) {
  const n = qr.getModuleCount();
  const quiet = 4;
  const cell = size / (n + quiet * 2);
  let out = `1 1 1 rg ${x} ${y} ${size} ${size} re f\n0 0 0 rg\n`;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue;
      let run = 1;
      while (c + run < n && qr.isDark(r, c + run)) run++;
      const px = x + (quiet + c) * cell;
      const py = y + size - (quiet + r + 1) * cell;
      out += `${px.toFixed(3)} ${py.toFixed(3)} ${(run * cell).toFixed(3)} ${cell.toFixed(3)} re\n`;
      c += run - 1;
    }
  }
  return `${out}f\n`;
}

// pass: { name, committee, allocation, detail }, qr: a made qrcode-generator code,
// words: the texts from site.json → qrPage.pdf, plus the conference's name, dates and venue.
export function passPdf({ pass, qr, words }) {
  const qrSize = 270;
  const qrY = 250;
  let page = "";
  page += centred(words.site, { font: "F2", size: 13, y: H - 78, color: NAVY });
  page += centred(words.title, { size: 11, y: H - 98, color: GREY });
  page += `${NAVY} RG 0.8 w 56 ${H - 118} m ${W - 56} ${H - 118} l S\n`;
  page += centred(pass.name, { font: "F2", size: 30, y: H - 172, min: 14 });
  page += centred(pass.committee, { size: 15, y: H - 204, color: NAVY });
  page += centred(pass.allocation, { font: "F2", size: 15, y: H - 226 });
  page += centred(pass.detail, { size: 12, y: H - 246, color: GREY });
  page += qrSquares(qr, (W - qrSize) / 2, qrY, qrSize);
  page += centred(words.instruction, { size: 12, y: qrY - 34 });
  page += centred(words.when, { size: 11, y: qrY - 56, color: GREY });
  page += centred(words.note, { size: 9, y: 70, color: GREY });

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${page.length} >>\nstream\n${page}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Title ${pdfString(`${words.site}: ${pass.name}`)} /Producer (oakridgejmun.in) >>`,
  ];
  let pdf = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  // Every character above is a single byte (text is escaped to octal), so offsets are bytes.
  return new Blob([Uint8Array.from(pdf, (ch) => ch.charCodeAt(0))], { type: "application/pdf" });
}
