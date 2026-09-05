import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SITE, HOME_MAIN, ICON, STARS, relOf, link, shell, crumbs, asideCard, photo, ROOT } from './build.mjs';
import { SERVICES, PROJECTS, TOWNS } from './content.mjs';

/* Only projects with photographs are built. */
const LIVE = PROJECTS.filter(p => p.photos && p.photos.length);
const shot = (rel, p, i = 0, opts = {}) => photo(rel, p.photos[i], p.alt, opts);

const svc = s => SERVICES.find(x => x.slug === s);
const out = [];
const emit = (path, content) => {
  const full = join(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  out.push(path);
};

const plate = (cls, tag, no, extra = '') =>
  `<div class="plate ${cls} ${extra}"><span class="plate__no">${no}</span><span class="plate__tag">${tag}</span></div>`;

const rating = txt => `<p class="rating">${STARS}<span>${txt}</span></p>`;

const ctaPair = rel => `<div class="phero__cta">
      <a class="btn" href="${link(rel, 'free-quote/')}">Get a free quote ${ICON.arrow}</a>
      <a class="btn btn--ghost" href="tel:${SITE.telHref}">${ICON.phone} Call ${SITE.tel}</a>
    </div>`;

const faqBlock = faqs => `<h2>Common questions</h2>
<div class="faq">
${faqs.map(([q, a], i) => `  <details${i === 0 ? ' open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
</div>`;

const faqSchema = faqs => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map(([q, a]) => ({
    '@type': 'Question', name: q,
    acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
  })),
});

const breadcrumbSchema = (trail) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE.origin + '/' },
    ...trail.map((t, i) => ({ '@type': 'ListItem', position: i + 2, name: t.label,
      item: t.href ? `${SITE.origin}/${t.href}` : undefined }))],
});

const localBusiness = {
  '@context': 'https://schema.org', '@type': 'LandscapingBusiness',
  name: SITE.name, telephone: SITE.tel, email: SITE.email, foundingDate: '1997',
  url: SITE.origin + '/', priceRange: '££',
  address: { '@type': 'PostalAddress', addressLocality: 'Wymondham',
    addressRegion: 'Norfolk', addressCountry: 'GB' },
  areaServed: TOWNS.map(t => ({ '@type': 'City', name: t })),
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
    opens: '08:00', closes: '17:00' }],
};

const related = (rel, slugs, heading = 'Related services') => `<section class="section" style="background:var(--sage-2)"><div class="wrap">
  <div class="head"><div><p class="eyebrow">Next</p><h2>${heading}</h2></div></div>
  <div class="related">
${slugs.map(s => { const x = svc(s); return `    <a href="${rel}${x.slug}/"><b>${x.nav}</b><span>${x.lede.split('.')[0]}.</span></a>`; }).join('\n')}
  </div>
</div></section>`;

/* ── home ───────────────────────────────────────────────────────────── */
{
  let main = HOME_MAIN;
  const rel = '';
  const featured = LIVE[0];
  const rest = LIVE.slice(1);

  // hero: the strongest photograph, loaded eagerly
  main = main.replace(/<div class="plate p-lawn frame hero__plate">[\s\S]*?<\/div>/,
    photo(rel, 'modern-porcelain-garden-01',
      'A modern Norfolk garden in large-format grey porcelain, with a horizontal cedar screen, slate-faced raised beds and clipped evergreen planting.',
      { className: 'hero__shot', eager: true, sizes: '(max-width:900px) 100vw, 50vw' }));

  // featured project, built from data; the before/after toggle goes until
  // there is a real "before" photograph to put behind it
  {
    const a = main.indexOf('<div class="feature frame">');
    const b = main.indexOf('<div class="projects">');
    if (a === -1 || b === -1) throw new Error('home: feature or projects block not found');
    main = main.slice(0, a) + `<div class="feature frame">
    <div class="feature__media">
      ${shot(rel, featured, 0, { sizes: '(max-width:860px) 100vw, 55vw' })}
    </div>
    <div class="feature__pad">
      <p class="eyebrow">Featured project</p>
      <h3 style="font-size:clamp(1.4rem,2.2vw,1.85rem);margin:.7rem 0 1.1rem">${featured.name}</h3>
      <p style="color:var(--ink-2)">${featured.blurb}</p>
      <ul class="spec">
        <li><b>Where</b><span>${featured.location}</span></li>
        <li><b>Materials</b><span>${featured.materials.join(', ')}</span></li>
        <li><b>On site</b><span>${featured.weeks}</span></li>
      </ul>
      <div style="margin-top:1.5rem">
        <a class="btn btn--ghost btn--sm" href="projects/${featured.slug}/">See this project ${ICON.arrow}</a>
      </div>
    </div>
  </div>

  ` + main.slice(b);
  }

  // card grid, generated from the remaining live projects
  {
    const a = main.indexOf('<div class="projects">');
    const b = main.indexOf('<div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center;margin-top:');
    if (a === -1 || b === -1) throw new Error('home: projects grid bounds not found');
    main = main.slice(0, a) + `<div class="projects">
${rest.map(p => `    <a class="proj" href="projects/${p.slug}/" style="text-decoration:none">
      ${shot(rel, p, p.photos.length > 1 ? 1 : 0, { sizes: '(max-width:620px) 100vw, (max-width:1040px) 50vw, 33vw' })}
      <div class="proj__pad"><h3>${p.name}</h3><p class="proj__loc">${p.location}</p><p>${p.blurb}</p>
        <div class="chips">${p.materials.slice(0, 2).map(m => `<span class="chip">${m}</span>`).join('')}</div>
        <span class="more" style="padding-top:.7rem;font-weight:600;color:var(--field)">See the project ${ICON.arrow}</span></div>
    </a>`).join('\n')}
  </div>

  ` + main.slice(b);
  }
  // service tiles become links to their own pages
  const tileRe = /    <article><span class="num">([^<]*)<\/span><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/article>/g;
  let i = 0;
  main = main.replace(tileRe, (_m, num, h3, p) => {
    const s = SERVICES[i++];
    return `    <a class="svc" href="${s.slug}/"><span class="num">${num}</span><h3>${h3}</h3><p>${p}</p><span class="more">More about ${s.nav.toLowerCase()} ${ICON.arrow}</span></a>`;
  });
  if (i !== SERVICES.length) throw new Error(`home service tiles: matched ${i}, expected ${SERVICES.length}`);
  // portfolio and areas links now go to real pages
  const before = main;
  main = main.replace('<a class="btn btn--ghost" href="#work">See all our projects',
                      '<a class="btn btn--ghost" href="projects/">See all our projects');
  if (main === before) throw new Error('home: portfolio link not rewritten');
  main = main.replace('</ul>\n</div></section>', '</ul>\n</div></section>');
  main = main.replace(
    /(<p class="lede" style="max-width:56ch">[\s\S]*?<\/p>)/,
    `$1\n  <div style="margin-top:1.8rem"><a class="btn btn--onfield" href="areas-we-cover/">See every area we cover ${ICON.arrow}</a></div>`);

  emit('index.html', shell({
    out: 'index.html',
    title: 'Garden Design & Landscaping, Norwich & Norfolk | MN Landscapes',
    description: 'Family-run garden design and build across Norfolk and north Suffolk since 1997. In-house CAD design, our own build teams, free site visit and a fixed written price.',
    body: `<main id="top">\n${main}\n</main>`,
    jsonld: [localBusiness],
  }));

  // single self-contained copy for sharing as one page
  emit('artifact/index.html', shell({
    out: 'artifact/index.html',
    title: 'Garden Design & Landscaping, Norwich & Norfolk | MN Landscapes',
    description: 'Family-run garden design and build across Norfolk and north Suffolk since 1997.',
    body: `<main id="top">\n${HOME_MAIN}\n</main>`,
    inlineCss: true,
    singleFile: true,
  }));
}

/* ── services hub ───────────────────────────────────────────────────── */
{
  const rel = '../';
  const trail = [{ label: 'What we do' }];
  emit('services/index.html', shell({
    out: 'services/index.html', current: 'services/',
    title: 'What We Do | Garden Design & Landscaping | MN Landscapes',
    description: 'Garden design, patios and paving, driveways, walls and steps, decking and fencing, planting, lawns and lighting — design and build across Norfolk.',
    body: `<main id="top">
${crumbs(rel, trail)}
<section class="phero"><div class="wrap">
  <p class="eyebrow">What we do</p>
  <h1 style="margin-top:.8rem">Designed and built by one team</h1>
  <p class="lede" style="margin-top:1.1rem;max-width:56ch">Design and build is all we do. One team for the whole job — groundworks, hard landscaping and planting. No sub-contractors turning up unannounced, and no gaps between trades.</p>
  ${ctaPair(rel)}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
  <div class="svcs">
${SERVICES.map(s => `    <a class="svc" href="${rel}${s.slug}/"><span class="num">${s.nav}</span><h3>${s.h1}</h3><p>${s.lede}</p><span class="more">Read more ${ICON.arrow}</span></a>`).join('\n')}
  </div>
</div></section>`,
    jsonld: [breadcrumbSchema(trail)],
  }));
}

/* ── service pages ──────────────────────────────────────────────────── */
for (const s of SERVICES) {
  const rel = '../';
  const trail = [{ label: 'What we do', href: 'services/' }, { label: s.nav }];
  const proseBody = s.body.map(sec => {
    const parts = [`<h2>${sec.h2}</h2>`];
    if (sec.p) parts.push(...sec.p.map(t => `<p>${t}</p>`));
    if (sec.list) parts.push(`<ul>\n${sec.list.map(l => `  <li>${l}</li>`).join('\n')}\n</ul>`);
    return parts.join('\n');
  }).join('\n\n');
  const projs = LIVE.filter(p => p.services.includes(s.slug)).slice(0, 3);
  emit(`${s.slug}/index.html`, shell({
    out: `${s.slug}/index.html`, current: `${s.slug}/`, section: 'services/',
    title: s.title,
    description: s.description,
    body: `<main id="top">
${crumbs(rel, trail)}
<section class="phero"><div class="wrap phero__grid">
  <div>
    <p class="eyebrow">${s.nav}</p>
    <h1>${s.h1}</h1>
    <p class="lede">${s.lede}</p>
    ${ctaPair(rel)}
    ${rating('Five-star reviews on Google and Facebook')}
  </div>
  ${s.heroPhoto ? photo(rel, s.heroPhoto, s.photo, { className: 'phero__shot', eager: true })
      : plate(s.plate, s.photo, 'Photo', 'frame phero__plate')}
</div></section>

<section class="section" style="padding-top:0"><div class="wrap two">
  <article class="prose">
${proseBody}

${faqBlock(s.faqs)}
  </article>
  ${asideCard(rel, 'Get a price for this', `Free visit, itemised written quote, and we ring you back within one working day.`)}
</div></section>
${projs.length ? `
<section class="section" style="background:var(--sage-2)"><div class="wrap">
  <div class="head"><div><p class="eyebrow">Our work</p><h2>${s.nav} we have built</h2></div></div>
  <div class="projects" style="margin-top:0">
${projs.map(p => `    <a class="proj" href="${rel}projects/${p.slug}/" style="text-decoration:none">
      ${shot(rel, p, p.photos.length > 1 ? 1 : 0, { sizes: '(max-width:620px) 100vw, (max-width:1040px) 50vw, 33vw' })}
      <div class="proj__pad"><h3>${p.name}</h3><p class="proj__loc">${p.location}</p><p>${p.blurb}</p>
        <span class="more" style="margin-top:auto;padding-top:.7rem;font-weight:600;color:var(--field)">See the project ${ICON.arrow}</span></div>
    </a>`).join('\n')}
  </div>
</div></section>` : ''}
${related(rel, s.related)}
</main>`,
    jsonld: [breadcrumbSchema(trail), faqSchema(s.faqs), {
      '@context': 'https://schema.org', '@type': 'Service',
      name: s.nav, serviceType: s.h1, description: s.description,
      provider: { '@type': 'LandscapingBusiness', name: SITE.name, telephone: SITE.tel },
      areaServed: { '@type': 'AdministrativeArea', name: 'Norfolk' },
    }],
  }));
}

/* ── projects index ─────────────────────────────────────────────────── */
{
  const rel = '../';
  const trail = [{ label: 'Our work' }];
  emit('projects/index.html', shell({
    out: 'projects/index.html', current: 'projects/',
    title: 'Our Projects | Garden Design & Landscaping in Norfolk',
    description: 'Gardens we have designed and built around Norwich and Norfolk — patios, terraces, decking, planting and lighting, with the materials and timescales for each.',
    body: `<main id="top">
${crumbs(rel, trail)}
<section class="phero"><div class="wrap">
  <p class="eyebrow">Our work</p>
  <h1 style="margin-top:.8rem">Gardens we have built around Norwich</h1>
  <p class="lede" style="margin-top:1.1rem;max-width:56ch">Every one designed in-house, built by our own team, and planted as carefully as it was paved. Have a look, then tell us which bits you like.</p>
  ${ctaPair(rel)}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
  <div class="projects" style="margin-top:0">
${LIVE.map(p => `    <a class="proj" href="${rel}projects/${p.slug}/" style="text-decoration:none">
      ${shot(rel, p, p.photos.length > 1 ? 1 : 0, { sizes: '(max-width:620px) 100vw, (max-width:1040px) 50vw, 33vw' })}
      <div class="proj__pad"><h3>${p.name}</h3><p class="proj__loc">${p.location}</p><p>${p.blurb}</p>
        <div class="chips">${p.materials.slice(0, 2).map(m => `<span class="chip">${m}</span>`).join('')}</div>
        <span class="more" style="padding-top:.7rem;font-weight:600;color:var(--field)">See the project ${ICON.arrow}</span></div>
    </a>`).join('\n')}
  </div>
</div></section>`,
    jsonld: [breadcrumbSchema(trail)],
  }));
}

/* ── project pages ──────────────────────────────────────────────────── */
for (const p of LIVE) {
  const rel = '../../';
  const trail = [{ label: 'Our work', href: 'projects/' }, { label: p.name }];
  emit(`projects/${p.slug}/index.html`, shell({
    out: `projects/${p.slug}/index.html`, section: 'projects/',
    title: `${p.name}, ${p.location.split(',')[0]} | MN Landscapes`,
    description: p.blurb,
    body: `<main id="top">
${crumbs(rel, trail)}
<section class="phero"><div class="wrap phero__grid">
  <div>
    <p class="eyebrow">${p.location}</p>
    <h1>${p.name}</h1>
    <p class="lede">${p.blurb}</p>
    ${ctaPair(rel)}
  </div>
  ${shot(rel, p, 0, { className: 'phero__shot', eager: true })}
</div></section>

<section class="section" style="padding-top:0"><div class="wrap two">
  <article class="prose">
<h2>The brief</h2>
<p>${p.brief}</p>
<h2>What we did</h2>
<ul>
${p.did.map(d => `  <li>${d}</li>`).join('\n')}
</ul>
<ul class="spec" style="list-style:none">
  <li><b>Where</b><span>${p.location}</span></li>
  <li><b>Materials</b><span>${p.materials.join(', ')}</span></li>
  <li><b>On site</b><span>${p.weeks}</span></li>
  <li><b>Services used</b><span>${p.services.map(s => `<a href="${rel}${s}/" style="color:var(--field)">${svc(s).nav}</a>`).join(', ')}</span></li>
</ul>
  </article>
  ${asideCard(rel, 'Want something like this?', 'Tell us which bits you like. Free visit, itemised written quote, no obligation.')}
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
  <div class="head"><div><p class="eyebrow">Photographs</p><h2>${p.name}</h2></div></div>
  <div class="gallery">
${p.photos.map((n, i) => `    ${photo(rel, n, p.alt, { className: i === 0 ? 'wide' : '', sizes: i === 0 ? '(max-width:620px) 100vw, 80vw' : '(max-width:620px) 100vw, 40vw' })}`).join('\n')}
  </div>
</div></section>
${related(rel, p.services.concat(p.services.length < 3 ? ['garden-design'] : []).slice(0, 3))}
</main>`,
    jsonld: [breadcrumbSchema(trail)],
  }));
}

/* ── areas ──────────────────────────────────────────────────────────── */
{
  const rel = '../';
  const trail = [{ label: 'Areas we cover' }];
  emit('areas-we-cover/index.html', shell({
    out: 'areas-we-cover/index.html', current: 'areas-we-cover/',
    title: 'Areas We Cover | Norfolk & North Suffolk | MN Landscapes',
    description: 'Based on the rural edge of Wymondham, we design and build gardens across Norfolk and into north Suffolk — Norwich, Attleborough, Diss, Dereham and the villages between.',
    body: `<main id="top">
${crumbs(rel, trail)}
<section class="phero"><div class="wrap">
  <p class="eyebrow">Areas we cover</p>
  <h1 style="margin-top:.8rem">Norfolk, and over the Suffolk border</h1>
  <p class="lede" style="margin-top:1.1rem;max-width:56ch">We are based on the rural edge of Wymondham, which puts most of Norfolk within a comfortable drive. If you are not on the list, ask anyway — we often are.</p>
  ${ctaPair(rel)}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap two">
  <article class="prose">
    <h2>Towns and villages we work in</h2>
    <ul class="towns">
${TOWNS.map(t => t === 'Norwich'
  ? `      <li><a href="${rel}areas-we-cover/norwich/">Norwich</a></li>`
  : `      <li>${t}</li>`).join('\n')}
    </ul>
    <h2 style="margin-top:2.4rem">How far we travel</h2>
    <p>Most of our work sits in a rough triangle between Norwich, Diss and Dereham, which is where we can get a team and materials on site without the travel adding to your price. We go further for larger projects — into north Norfolk and across to Bungay, Beccles and Harleston — but for a small job a long way out we will usually tell you honestly that a local firm will do it more cheaply.</p>
    <p>If you are unsure, ring and ask. It takes a minute and saves everybody a wasted visit.</p>
  </article>
  ${asideCard(rel, 'Are we near you?', 'Give us your postcode and we will tell you straight away whether we cover you.')}
</div></section>`,
    jsonld: [breadcrumbSchema(trail)],
  }));
}

/* ── Norwich: the one town with enough real work to justify a page ─── */
{
  const rel = '../../';
  const trail = [{ label: 'Areas we cover', href: 'areas-we-cover/' }, { label: 'Norwich' }];
  const norwich = LIVE.filter(p => p.location.includes('Norwich'));
  emit('areas-we-cover/norwich/index.html', shell({
    out: 'areas-we-cover/norwich/index.html', section: 'areas-we-cover/',
    title: 'Garden Design & Landscaping in Norwich | MN Landscapes',
    description: 'Garden design and landscaping in Norwich — city gardens, terraces and courtyards, plus the suburbs. Free site visit and a fixed written price.',
    body: `<main id="top">
${crumbs(rel, trail)}
<section class="phero"><div class="wrap phero__grid">
  <div>
    <p class="eyebrow">Areas we cover</p>
    <h1>Garden design and landscaping in Norwich</h1>
    <p class="lede">Most of our work is in and around Norwich, from Victorian terraces off the Unthank Road to the newer estates out towards Taverham and Poringland.</p>
    ${ctaPair(rel)}
    ${rating('Five-star reviews from Norwich customers')}
  </div>
  ${photo(rel, 'modern-porcelain-garden-02', 'A modern garden in Norwich, in large-format grey porcelain with slate-faced raised beds and structural evergreen planting.', { className: 'phero__shot', eager: true })}
</div></section>

<section class="section" style="padding-top:0"><div class="wrap two">
  <article class="prose">
    <h2>What is different about a Norwich garden</h2>
    <p><b>Access is usually the first problem.</b> A long thin terrace garden with no side gate means everything — sub-base, slabs, spoil — goes through the house or over the wall. It is entirely doable, and we would rather price it properly than discover it on day one. We will look at the route in before we quote.</p>
    <p><b>City gardens are small, enclosed and often shaded.</b> That narrows the planting considerably but it also means the hard landscaping carries the whole design, so the materials and the setting-out have to be right. Small gardens are less forgiving of a bad layout than large ones, not more.</p>
    <p><b>Parts of the city are conservation areas.</b> Around the Cathedral, the Golden Triangle and several of the older streets, walls, boundary treatments and front gardens can be more tightly controlled than permitted development would suggest. We will flag it if your address needs a conversation with the council before anything is ordered.</p>
    <h2>Where we work in and around the city</h2>
    <p>Eaton, Cringleford, Thorpe St Andrew, Costessey, Taverham, Drayton, Hellesdon, Sprowston, Poringland and Framingham Earl, plus the city itself. We are twelve miles down the A11 at Wymondham, so a Norwich site visit is a short trip rather than a day out.</p>
  </article>
  ${asideCard(rel, 'A free visit in Norwich', 'We will come and look, measure up, and put a fixed price in writing. No charge and no sales pitch.')}
</div></section>

<section class="section" style="background:var(--sage-2)"><div class="wrap">
  <div class="head"><div><p class="eyebrow">Our work</p><h2>Gardens we have built in Norwich</h2></div></div>
  <div class="projects" style="margin-top:0">
${norwich.map(p => `    <a class="proj" href="${rel}projects/${p.slug}/" style="text-decoration:none">
      ${shot(rel, p, p.photos.length > 1 ? 1 : 0, { sizes: '(max-width:620px) 100vw, (max-width:1040px) 50vw, 33vw' })}
      <div class="proj__pad"><h3>${p.name}</h3><p class="proj__loc">${p.location}</p><p>${p.blurb}</p>
        <span class="more" style="margin-top:auto;padding-top:.7rem;font-weight:600;color:var(--field)">See the project ${ICON.arrow}</span></div>
    </a>`).join('\n')}
  </div>
</div></section>
</main>`,
    jsonld: [breadcrumbSchema(trail)],
  }));
}

/* ── ad landing page: no navigation, one action ─────────────────────── */
{
  const rel = '../';
  const q = HOME_MAIN.slice(HOME_MAIN.indexOf('<!-- ── Quote ──'));
  const form = q.slice(q.indexOf('<div class="quote">'), q.indexOf('</div></section>'));
  emit('free-quote/index.html', shell({
    out: 'free-quote/index.html',
    bodyClass: 'landing',
    title: 'Get a Free Garden Quote | Norwich & Norfolk | MN Landscapes',
    description: 'Free site visit and a fixed written price for garden design and landscaping across Norfolk. We ring you back within one working day.',
    body: `<main id="top">
<section class="lhero"><div class="wrap lhero__grid">
  <div>
    <p class="eyebrow">Free visit &middot; Fixed written price</p>
    <h1 style="margin-top:.8rem">Find out what your garden would cost</h1>
    <p class="lede" style="margin-top:1.1rem">We come and look, measure up, and put an itemised price in writing. It costs nothing, there is no obligation, and you will speak to Chris, who owns the business.</p>
    <div class="phero__cta">
      <a class="btn" href="#form">Get my free quote ${ICON.arrow}</a>
      <a class="btn btn--ghost" href="tel:${SITE.telHref}">${ICON.phone} Call ${SITE.tel}</a>
    </div>
    ${rating('Five-star reviews on Google and Facebook')}
    <p class="creds">
      <span>${ICON.tick}APL accredited</span>
      <span>${ICON.tick}BALI member</span>
      <span>${ICON.tick}TrustMark registered</span>
      <span>${ICON.tick}Established 1997</span>
    </p>
  </div>
  ${photo(rel, 'walled-garden-terrace-01', 'A wood-effect porcelain terrace in a walled garden, with deep planted borders and an oak-framed garden room.', { className: 'lhero__shot', eager: true })}
</div></section>

<section class="section--tight"><div class="wrap">
  <div class="proof">
    <div><b>One team, start to finish</b><p>Design, groundworks, hard landscaping and planting all done by us. No sub-contractors, no gaps between trades.</p></div>
    <div><b>A fixed price, in writing</b><p>Itemised against a scale drawing before anybody lifts a spade. The price we agree is the price you pay.</p></div>
    <div><b>Norfolk gardens since 1997</b><p>APL accredited, BALI member, TrustMark registered and fully insured.</p></div>
  </div>
</div></section>

<section class="section" id="form"><div class="wrap">
  <div class="head"><div><p class="eyebrow">Two minutes</p><h2>Tell us about your garden</h2></div>
    <p class="measure">Four boxes and a couple of taps. We ring you back within one working day.</p></div>
  ${form}
</div></section>
</main>`,
    jsonld: [localBusiness],
  }));
}

/* ── sitemap + robots ───────────────────────────────────────────────── */
{
  const urls = out.filter(p => p.endsWith('index.html') && !p.startsWith('artifact/'))
    .map(p => SITE.origin + '/' + p.replace(/index\.html$/, ''));
  emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);
  emit('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE.origin}/sitemap.xml\n`);
}

/* Remove anything this build produced last time and no longer produces —
   renaming a project used to leave its old page on disk, live and indexed. */
const LEDGER = join(ROOT, 'build/generated.json');
const previous = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : [];
const removed = previous.filter(f => !out.includes(f));
for (const f of removed) {
  const full = join(ROOT, f);
  if (existsSync(full)) rmSync(full);
  // tidy up the directory if the page was the only thing in it
  let dir = dirname(full);
  while (dir !== ROOT.replace(/\/$/, '') && existsSync(dir) && readdirSync(dir).length === 0) {
    rmSync(dir, { recursive: true });
    dir = dirname(dir);
  }
}
writeFileSync(LEDGER, JSON.stringify(out.sort(), null, 2));

console.log(`wrote ${out.length} files`);
if (removed.length) console.log(`removed ${removed.length} stale:\n  ` + removed.join('\n  '));
