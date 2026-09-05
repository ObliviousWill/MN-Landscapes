/* Derives responsive variants from assets/photos/*.jpg and writes a manifest.
   Sources are 960px wide, so nothing is upscaled: 960 is the largest size. */
import { readdirSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/tmp/claude-0/-home-user-field-notes/bb0817b5-339f-58a3-9fa2-4010b1f48246/scratchpad/');
const sharp = require('sharp');

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'assets/photos');
const OUT = join(SRC, 'r');
mkdirSync(OUT, { recursive: true });

const WIDTHS = [480, 720, 960];
const manifest = {};

for (const file of readdirSync(SRC).filter(f => /\.jpe?g$/i.test(f))) {
  const name = basename(file, extname(file));
  const raw = await sharp(join(SRC, file)).metadata();

  /* Several sources are portrait photographs letterboxed into a landscape
     canvas. Trim the flat border, but only accept a trim that actually
     removes bars rather than eating into the picture. */
  let src = join(SRC, file);
  let meta = raw;
  try {
    const trimmed = await sharp(src).trim({ threshold: 12 }).toBuffer({ resolveWithObject: true });
    const t = trimmed.info;
    const keptArea = (t.width * t.height) / (raw.width * raw.height);
    if (keptArea < 0.98 && keptArea > 0.35) {
      src = trimmed.data;
      meta = { width: t.width, height: t.height };
      console.log(`  trimmed ${name}: ${raw.width}x${raw.height} -> ${t.width}x${t.height}`);
    }
  } catch {}
  const img = sharp(src);
  const entry = { width: meta.width, height: meta.height, jpg: {}, webp: {} };
  entry.portrait = meta.height > meta.width;
  for (const w of WIDTHS) {
    if (w > meta.width) continue;
    const h = Math.round((meta.height / meta.width) * w);
    await sharp(src).resize(w, h, { fit: 'cover' })
      .jpeg({ quality: 78, mozjpeg: true }).toFile(join(OUT, `${name}-${w}.jpg`));
    await sharp(src).resize(w, h, { fit: 'cover' })
      .webp({ quality: 74 }).toFile(join(OUT, `${name}-${w}.webp`));
    entry.jpg[w] = `assets/photos/r/${name}-${w}.jpg`;
    entry.webp[w] = `assets/photos/r/${name}-${w}.webp`;
  }
  manifest[name] = entry;
  const sizes = Object.keys(entry.jpg).join('/');
  console.log(`${name.padEnd(30)} ${meta.width}x${meta.height} -> ${sizes}`);
}
writeFileSync(join(ROOT, 'build/photos.json'), JSON.stringify(manifest, null, 2));
const total = readdirSync(OUT).reduce((n, f) => n + statSync(join(OUT, f)).size, 0);
console.log(`\n${Object.keys(manifest).length} photos, ${readdirSync(OUT).length} derived files, ${(total/1024).toFixed(0)} KB total`);
