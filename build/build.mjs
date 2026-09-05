/* MN Landscapes — static site generator.
   Emits clean-URL directories at the repo root plus sitemap.xml and robots.txt,
   and a single self-contained file in artifact/ for sharing as one page.
   Links are depth-relative, so the output serves correctly from a root domain
   or from a subpath such as /MN-Landscapes/. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = new URL('..', import.meta.url).pathname;
const read = f => readFileSync(join(ROOT, f), 'utf8');

const SITE = {
  name: 'MN Landscapes',
  tel: '07387 085952',
  telHref: '+447387085952',
  email: 'chris@mnlandscapes.com',
  hours: 'Mon–Fri, 8am–5pm',
  origin: 'https://www.mnlandscapes.co.uk',
};

const CSS = read('assets/site.css');
const PHOTOS = JSON.parse(read('build/photos.json'));

/* A responsive <picture>. WebP first, JPEG fallback, explicit dimensions so
   nothing shifts as images arrive, and lazy except where told otherwise. */
function photo(rel, name, alt, { className = '', sizes = '(max-width:900px) 100vw, 50vw', eager = false } = {}) {
  const p = PHOTOS[name];
  if (!p) throw new Error(`unknown photo: ${name}`);
  const widths = Object.keys(p.jpg).map(Number).sort((a, b) => a - b);
  const set = (map) => widths.map(w => `${rel}${map[w]} ${w}w`).join(', ');
  const largest = widths[widths.length - 1];
  return `<picture class="${('shot ' + className).trim()}">
  <source type="image/webp" srcset="${set(p.webp)}" sizes="${sizes}">
  <img src="${rel}${p.jpg[largest]}" srcset="${set(p.jpg)}" sizes="${sizes}"
    width="${p.width}" height="${p.height}" alt="${alt}"
    loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>
</picture>`;
}
/* Content hash in the stylesheet URL. Without it a CSS-only change is
   invisible to anyone holding a cached copy — which is most returning
   visitors, and every phone that has already loaded the site. */
const CSS_HASH = createHash('sha1').update(CSS).digest('hex').slice(0, 10);
const JS  = read('build/parts/site.js');
const HOME_MAIN = read('build/parts/home-main.html');

/* ── shared chrome ──────────────────────────────────────────────────── */
const NAV = [
  { label: 'Our work',       href: 'projects/' },
  { label: 'What we do',     href: 'services/' },
  { label: 'Garden design',  href: 'garden-design/' },
  { label: 'Meet Chris',     href: '#chris', home: true },
  { label: 'Reviews',        href: '#reviews', home: true },
  { label: 'How it works',   href: '#process', home: true, extra: true },
  { label: 'Areas we cover', href: 'areas-we-cover/', extra: true },
];

const ICON = {
  phone: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  arrow: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  tick: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  star: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
};
const STARS = `<span class="stars" aria-hidden="true">${ICON.star.repeat(5)}</span>`;

const relOf = out => '../'.repeat(out.split('/').length - 1);

/* The single-file build has no sibling pages, so every page path collapses to
   the equivalent anchor on the one page it ships. */
const SINGLE = {
  'projects/': '#work', 'services/': '#services', 'garden-design/': '#design',
  'areas-we-cover/': '#areas', 'free-quote/': '#quote',
  'patios-and-paving/': '#services', 'driveways/': '#services',
  'walls-and-steps/': '#services', 'decking-and-fencing/': '#services',
  'planting-lawns-and-lighting/': '#services',
};
let single = false;
const setSingle = v => { single = v; };
/* resolve a site path for a page at depth `rel`; hash links go to the home page */
const link = (rel, href) => {
  if (single) return SINGLE[href] || (href.startsWith('#') ? href : '#top');
  return href.startsWith('#') ? `${rel || './'}${href}` : `${rel}${href}`;
};

const header = (rel, { landing = false, current = '', section = '' } = {}) => {
  if (landing) return `<header><div class="wrap bar">
    <a class="mark" href="${single ? '#top' : rel}"><b>MN&nbsp;LANDSCAPES</b><span>Norfolk &middot; Est. 1997</span></a>
    <a class="tel" href="tel:${SITE.telHref}">${ICON.phone}<span>${SITE.tel}<small>${SITE.hours}</small></span></a>
  </div></header>`;
  const items = NAV.map(n =>
    `        <li${n.extra ? ' class="navextra"' : ''}><a href="${link(rel, n.href)}"${n.href === current ? ' aria-current="page"' : (n.href === section ? ' aria-current="true"' : '')}>${n.label}</a></li>`).join('\n');
  return `<header>
  <div class="wrap bar">
    <a class="mark" href="${single ? '#top' : (rel || '#top')}"><b>MN&nbsp;LANDSCAPES</b><span>Norfolk &middot; Est. 1997</span></a>
    <button id="menubtn" class="btn btn--ghost btn--sm" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav id="nav" aria-label="Main">
      <ul>
${items}
      </ul>
    </nav>
    <a class="tel" href="tel:${SITE.telHref}">${ICON.phone}<span>${SITE.tel}<small>${SITE.hours}</small></span></a>
    <a class="btn btn--sm" href="${link(rel, 'free-quote/')}" style="flex:0 0 auto">Get a free quote</a>
  </div>
</header>`;
};

const footer = rel => `<footer class="site"><div class="wrap">
  <div class="cols">
    <div>
      <a class="mark" href="${single ? '#top' : (rel || '#top')}" style="margin-bottom:1.2rem"><b>MN&nbsp;LANDSCAPES</b><span>Norfolk &middot; Est. 1997</span></a>
      <p style="max-width:34ch">Garden design, landscape construction and planting across Norfolk and Suffolk. Owner-run &mdash; you deal with Chris from the first visit to the last plant.</p>
    </div>
    <div>
      <h4>Contact</h4>
      <ul>
        <li><a href="tel:${SITE.telHref}">${SITE.tel}</a></li>
        <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
        <li>${SITE.hours}</li>
        <li>Wymondham, Norfolk</li>
      </ul>
    </div>
    <div>
      <h4>What we do</h4>
      <ul>
        <li><a href="${link(rel,'garden-design/')}">Garden design</a></li>
        <li><a href="${link(rel,'patios-and-paving/')}">Patios &amp; paving</a></li>
        <li><a href="${link(rel,'driveways/')}">Driveways</a></li>
        <li><a href="${link(rel,'walls-and-steps/')}">Walls &amp; steps</a></li>
        <li><a href="${link(rel,'decking-and-fencing/')}">Decking &amp; fencing</a></li>
        <li><a href="${link(rel,'planting-lawns-and-lighting/')}">Planting, lawns &amp; lighting</a></li>
      </ul>
    </div>
    <div>
      <h4>More</h4>
      <ul>
        <li><a href="${link(rel,'projects/')}">Our projects</a></li>
        <li><a href="${link(rel,'areas-we-cover/')}">Areas we cover</a></li>
        <li><a href="${link(rel,'free-quote/')}">Get a free quote</a></li>
      </ul>
      <h4 style="margin-top:1.5rem">Accredited by</h4>
      <ul>
        <li>APL &middot; BALI &middot; TrustMark</li>
      </ul>
    </div>
  </div>
  <p class="legal">
    MN Landscapes Limited &middot; Registered in England &amp; Wales, company no. 15210988 &middot; Wymondham, Norfolk<br>
    &copy; 2026 MN Landscapes Limited
  </p>
</div></footer>`;

const actionbar = rel => `<div id="actionbar">
  <a class="call" href="tel:${SITE.telHref}">${ICON.phone} Call us</a>
  <a class="quo" href="${link(rel, 'free-quote/')}">Get a free quote</a>
</div>`;

const crumbs = (rel, trail) => `<div class="wrap"><ol class="crumbs">
  <li><a href="${rel || './'}">Home</a></li>
${trail.map((t, i) => `  <li>${i === trail.length - 1 || !t.href ? `<span aria-current="page">${t.label}</span>` : `<a href="${rel}${t.href}">${t.label}</a>`}</li>`).join('\n')}
</ol></div>`;

const asideCard = (rel, heading, body) => `<aside class="aside-card">
  <h3>${heading}</h3>
  <p>${body}</p>
  <a class="btn btn--onfield" href="${link(rel, 'free-quote/')}">Get a free quote ${ICON.arrow}</a>
  <a class="tel-big" href="tel:${SITE.telHref}">${SITE.tel}</a>
  <p style="text-align:center;margin:.5rem 0 0;font-size:.95rem">${SITE.hours}</p>
</aside>`;

/* ── page shell ─────────────────────────────────────────────────────── */
function shell({ out, title, description, body, jsonld = [], bodyClass = '', inlineCss = false, script = true, singleFile = false, current = '', section = '' }) {
  const rel = relOf(out);
  setSingle(singleFile);
  const css = inlineCss
    ? `<style>\n${CSS}\n</style>`
    : `<link rel="stylesheet" href="${rel}assets/site.css?v=${CSS_HASH}">`;
  const ld = jsonld.length
    ? jsonld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')
    : '';
  const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${SITE.origin}/${out.replace(/index\.html$/, '')}">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Petrona:ital,wght@0,400..700;1,400..600&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap">
${css}
${ld}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${header(rel, { landing: bodyClass.includes('landing'), current, section })}
${body}
${footer(rel)}
${actionbar(rel)}
${script ? `<script>\n${JS}\n</script>` : ''}
</body>
</html>
`;
  setSingle(false);
  return html;
}

export { SITE, CSS, CSS_HASH, JS, PHOTOS, photo, HOME_MAIN, ICON, STARS, relOf, link, shell, crumbs, asideCard, header, footer, actionbar, ROOT };
