# MN Landscapes — concept website

A lead-generation concept build for **MN Landscapes**, the Norfolk garden
design and build company. Eighteen pages of hand-written static HTML, one
stylesheet, one small script: no framework, and no dependencies beyond
Google Fonts.

Serve the repository root anywhere static — the generated HTML needs no build
step on the host, and all internal links are depth-relative, so it works from
a root domain or from a subpath such as `/MN-Landscapes/`.

## Pages

| URL | Page |
|---|---|
| `/` | Home |
| `/services/` | What we do — hub |
| `/garden-design/` | Garden design |
| `/patios-and-paving/` | Patios & paving |
| `/driveways/` | Driveways |
| `/walls-and-steps/` | Walls, steps & retaining |
| `/decking-and-fencing/` | Decking, fencing & gates |
| `/planting-lawns-and-lighting/` | Planting, lawns & lighting |
| `/projects/` | Portfolio index |
| `/projects/<slug>/` | Five project pages |
| `/areas-we-cover/` | Areas, with the full town list |
| `/areas-we-cover/norwich/` | Norwich — the one town with enough real work to justify a page |
| `/free-quote/` | Ad landing page: no navigation, one action |

Plus `sitemap.xml`, `robots.txt`, and `artifact/index.html` — a single
self-contained copy of the home page for sharing as one file.

Each service page carries `Service` and `FAQPage` schema, interior pages carry
`BreadcrumbList`, and the home and landing pages carry `LandscapingBusiness`.
No `aggregateRating` anywhere: inventing review counts is both dishonest and
against Google's guidelines.

## Photographs

`assets/photos/*.jpg` are the sources. `node build/images.mjs` derives 480,
720 and 960px JPEG and WebP variants into `assets/photos/r/` and writes
`build/photos.json`. Pages emit `<picture>` with srcset, explicit dimensions
so nothing shifts as images load, and lazy loading everywhere but the hero.
Sources are never upscaled.

A project builds only if it has a `photos` array. Three real projects from
the old site sit dormant in `build/content.mjs` with copy written and no
pictures — add photographs and they appear automatically.

**Photo-to-project pairings are inferred from the images themselves and need
the owner's confirmation.** Materials and layouts are described from what is
visible; project names and locations came from the old site and may not
belong to these particular pictures.

## Editing it

```
assets/site.css        one stylesheet for every page
assets/photos/         source photographs, derived sizes in r/
build/images.mjs       derives responsive variants + photos.json
build/generated.json   ledger of built files, so renames prune cleanly
build/content.mjs      all page copy — services, projects, towns
build/build.mjs        templates: shell, header, footer, breadcrumbs
build/pages.mjs        assembles and writes every page
build/parts/           home page body, shared JS, both extracted from v1
build/verify.mjs       checks every internal link and renders every page
```

Change copy in `build/content.mjs`, then:

```
node build/pages.mjs     # regenerate
node build/verify.mjs     # check links, overflow, JS errors, unique titles
```

The generated HTML is committed so the host needs no build step. Regenerate
after any edit to `content.mjs`, `build.mjs` or `pages.mjs` — do not hand-edit
the generated pages, they will be overwritten.

## Design direction

Warm and planted, photography-led: sage grounds, forest-green ink and solid
green buttons, with marigold reserved for star ratings and the headline
highlight. Petrona for headings, Source Sans 3 for everything else, 19px body
type, soft radii and low shadows.

Built for an audience largely in their 50s and 60s: 19px body copy, 48px+ tap
targets, no hover-only interactions, no carousels, a labelled "Menu" button
rather than a bare hamburger, before/after as two large buttons rather than a
drag handle, and a persistent call/quote bar on mobile.

The one technical flourish is the canvas-drawn CAD garden plan in the design
section. In-house drawings are a genuine differentiator, and no competitor in
the area shows them.

The site is design-and-build throughout: no maintenance offer, and copy
written as claims about the business rather than about individuals.

## Still to do

Town pages for Wymondham, Attleborough and Diss once there are two or three
real projects in each to show. One thin page per village is a penalty risk,
not a strategy — which is why only Norwich has one so far.

## To take this live

1. **More photography.** Five photographs are in, driving four projects.
   Still on plates: the owner portrait, the driveways service page, and any
   "before" shot. Drop files into `assets/photos/`, run
   `node build/images.mjs`, add the filename to a project's `photos` array in
   `build/content.mjs`, and rebuild.

   The five supplied are 960px wide, taken from the old site. Enough for
   cards and the current hero, not for a full-bleed hero later — the camera
   originals would be worth having.
2. **Guide prices.** "What does a patio cost" is the question most visitors
   arrive with, and not answering it is the biggest conversion leak on almost
   every landscaper site. Honest price bands would outperform every other
   change to this page.
3. **Form handling.** The submit handler is a client-side demo. Point it at
   an email or CRM endpoint and keep the thank-you state.
4. **Confirm before launch.** Review attributions, phone number,
   accreditations and the email address (`chris@mnlandscapes.com` sits on a
   different domain to the website — worth moving to `.co.uk` for trust).
   Two lines are proposals rather than reported fact: handing over the
   planting plan at the end, and offering to suggest a local gardener.

Copy, project write-ups and contact details were reconstructed from public
sources. No prices are invented anywhere.

## Architecture

Hub and spoke. The home page is deliberately a selection — four projects, six
services, five questions, 1,600 words — and earns the click through to a
service or project page. Those interior pages are what rank, because Google
indexes pages, not sections: one page gives you one title tag, one H1 and one
URL, and cannot target "garden design Norwich" and "block paved driveway
Wymondham" at once.

The landing page at `/free-quote/` is separate from the home page on purpose.
Paid traffic should not arrive on a page with seven navigation links offering
seven ways to leave without enquiring.

**Migration risk:** the existing `.asp` project URLs are indexed and carry
rankings today. Any rebuild needs a 301 redirect map, or it throws those
away. This is the largest technical risk in the project, and the classic way
a nicer site produces fewer enquiries than the old one.

## Verified

No horizontal overflow at 375, 390, 430, 768, 1150, 1280, 1440 and 1680 CSS
px. No console errors.
