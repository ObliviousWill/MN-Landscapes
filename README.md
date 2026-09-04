# MN Landscapes — concept website

A lead-generation concept build for **MN Landscapes**, the Norfolk garden
design and build company. One self-contained HTML file: no build step, no
framework, no dependencies beyond Google Fonts.

Open `index.html` in a browser, or serve the repository root anywhere static.

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
section. In-house drawings are a real differentiator against a
man-with-a-van, and no competitor in the area shows them.

## Content provenance

Copy, project write-ups, accreditations, reviews and contact details were
reconstructed from public sources (mnlandscapes.co.uk, Companies House,
Pavestone, Facebook). No prices are invented anywhere.

Much of that public material predates the change of ownership: the founders
sold the business to Chris. MN Horticulture is not his, and the business does
not do maintenance — design and build only. All copy is therefore written as
a claim about the business rather than about any individual.

## What still needs the client

- **Photography.** Every image slot is a textured "material plate" tagged
  with what belongs there (`Photo 01` … `Photo 10`, including a portrait of
  Chris). Swap each `<div class="plate …">` for an `<img>`; the aspect ratios
  are already set. This is the single most important outstanding item — on a
  landscaping site the photographs *are* the product.
- **Guide prices.** "What does a patio cost" is the question every visitor
  arrives with. Refusing to answer it is the biggest conversion leak on
  almost every landscaper site. Honest bands would beat every other change
  on this page.
- **Confirm the accreditations** still stand in the current company's name.
  APL, BALI and TrustMark all police their marks, and the limited company
  behind the business dates from 2023. The claims come from the live site but
  predate the sale.
- **Two proposed promises need his agreement.** The page says he hands over
  the planting plan at the end, and that he'll suggest a local gardener if
  asked. Both are nearly free for an outfit already drawing planting plans,
  and both are good differentiators — but they are proposals, not things he
  has said he does.
- **Confirm** the review attributions, the phone number, and the email
  address (`chris@mnlandscapes.com` sits on a different domain to the
  website — worth moving to `.co.uk` for trust).
- **Form handling.** The submit handler is a client-side demo. Point it at an
  email/CRM endpoint and keep the thank-you state.

## Site architecture this page assumes

This file is the **home page** of a hub-and-spoke site, not the whole site.
It is deliberately a selection: four projects, six services, five questions.
Measured at 1,600 words — 12 screenfuls on desktop, 20 on a phone, with a
persistent call/quote bar so the form is always one tap away.

| Page | Job |
|---|---|
| Home | This page. Establish trust, show the work, capture the easy enquiries. |
| 6 service pages | Garden design, patios & paving, driveways, walls & steps, decking & fencing, planting & lawns. Each with its own title, H1, URL, projects, FAQs and form. These are what rank. |
| One page per project | The highest-value SEO asset, and what prospects actually want to see. He already has these indexed under `/site/norwich-gardening-projects/`. |
| Areas we cover | The full town list, off the home page. |
| 3–4 town pages | Only where there are real projects to show. Never one per village — thin location pages are a penalty risk. |
| Ad landing page | No navigation, one action, for paid traffic. Should not be the home page. |

**Migration risk:** the existing `.asp` project URLs are indexed and carry
rankings the business has today. Any rebuild needs a 301 redirect map, or it
throws those away. This is the largest technical risk in the project, and the
classic way a nicer site produces fewer enquiries than the old one.

## Verified

No horizontal overflow at 375, 390, 430, 768, 1150, 1280, 1440 and 1680 CSS
px. No console errors.
