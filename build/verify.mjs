import { chromium } from '/tmp/claude-0/-home-user-field-notes/bb0817b5-339f-58a3-9fa2-4010b1f48246/scratchpad/node_modules/playwright-core/index.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
const ROOT = process.cwd();
const pages = globSync('**/index.html', { cwd: ROOT }).filter(p => !p.startsWith('artifact/'));

// 1. static link check
let broken = [], titles = new Map();
for (const p of pages) {
  const html = readFileSync(join(ROOT, p), 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (titles.has(title)) broken.push(`DUPLICATE TITLE "${title}": ${p} and ${titles.get(title)}`);
  titles.set(title, p);
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const h = m[1];
    if (/^(https?:|tel:|mailto:|#|data:)/.test(h)) continue;
    const target = resolve(join(ROOT, dirname(p)), h.split('#')[0].split('?')[0]);
    const candidates = [target, join(target, 'index.html')];
    if (!candidates.some(existsSync)) broken.push(`BROKEN LINK in ${p}: ${h}`);
  }
}
console.log(broken.length ? broken.join('\n') : `link check: OK (${pages.length} pages, all titles unique)`);

// 2. render check
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
let bad = 0;
for (const w of [390, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 1000 }, isMobile: w < 500, hasTouch: w < 500 });
  for (const p of pages) {
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error' && !/net::ERR|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await pg.goto('file://' + join(ROOT, p), { waitUntil: 'load' });
    await pg.waitForTimeout(320);
    const r = await pg.evaluate(() => {
      const vw = document.documentElement.clientWidth, o = [];
      document.querySelectorAll('*').forEach(el => {
        const q = el.getBoundingClientRect();
        if (!q.width && !q.height) return;
        if (q.right > vw + 0.5 || q.left < -0.5) o.push(el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : ''));
      });
      return { doc: document.documentElement.scrollWidth, vw, o: [...new Set(o)].slice(0, 3),
        styled: getComputedStyle(document.body).fontFamily.includes('Source Sans'),
        h1: document.querySelectorAll('h1').length };
    });
    const issues = [];
    if (r.doc > r.vw + 1) issues.push(`overflow ${r.doc}>${r.vw} [${r.o.join(', ')}]`);
    if (!r.styled) issues.push('CSS NOT APPLIED');
    if (r.h1 !== 1) issues.push(`${r.h1} h1 tags`);
    if (errs.length) issues.push('JS: ' + errs[0]);
    if (issues.length) { bad++; console.log(`  ${w}px ${p}: ${issues.join(' | ')}`); }
    await pg.close();
  }
  await ctx.close();
}
console.log(bad ? `\n${bad} page/width issues` : '\nrender check: OK at 390px and 1440px — no overflow, CSS applied, one h1, no JS errors');
await b.close();
