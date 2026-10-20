# sam-portfolio

My personal portfolio: a race engineer's dossier, basically.

Live at → **[samuraiiii.tech](https://samuraiiii.tech)**

---

## the idea

Paper and ink, with one red taken from the race suit in the photo. Formula 1
shows up as a design language rather than a costume: start lights before the
name, tyre compounds that mean something in the career chart, an engineering
title block (and an approval stamp) on every project sheet. The sections are
still just called Work, Research and Experience.

A few things worth knowing about:

- **The name launches.** Five start lights, lights out, and the masthead comes
  off the line condensed and stretches to full width along Hubot Sans's width
  axis. It is fitted to the column, so it lands exactly edge to edge at any
  window size, and nothing around it moves while it does. "Back to the grid"
  in the footer runs the lights again.
- **Drawn first, then built.** One WebGL scene, two renderings. An ink drawing
  is made in a shader from the car's own normals and depth (silhouette,
  creases, a little hatching); a red scan line sweeps across it and leaves the
  lit car behind, while the camera swings from a side elevation to a front
  three-quarter view.
- **Every project has a working drawing you can drive.** Each figure is
  hand-built SVG that runs its mechanism, and each has controls:
  - CareerOS: add applications with supported or unsupported claims, and be
    the person who signs them off at the approval gate.
  - SecondAsk: break any of the 22 compliance rules and watch the next action
    get blocked (fail closed). The results bars carry the real 18.2% / 8.6%.
  - CodeForge: rush submissions into the BullMQ queue; change the winnowing
    window and the fingerprints are recomputed from the worked example in
    Schleimer, Wilkerson & Aiken (2003).
  - SynchroPulse: drag the forecast clock from now to three hours out.
  - CampusFind: step through the handoff, sign-in to QR scan.
  - RISC-V: a live I-type encoder. Change the operation, registers or
    immediate (or drag the immediate sideways) and the bits, hex and binary
    are re-encoded.
  - The preprint: drag the predicted saturation across the paper's 0.33 and
    0.66 tiers; the results figure shows the preprint's own numbers four ways.

  Hover, tap or arrow-key onto any part for a numbered note, like a parts
  drawing; underlined words in the text point at the part they describe.
  Numbers are real; anything schematic says so.
- **The career is a tyre-strategy graphic** that replays as you scroll past,
  with a telemetry cursor that lights every stint running in a given month.
- **Big numbers roll up like a timing screen**, once.
- **The toolkit cross-references the archive.** Hover a tool to see which
  projects use it; click it to filter the archive.
- Day and night themes (it follows your OS until you pick one).

## what's inside

```
index.html          shell, meta, structured data, and the prerendered page
404.html            "DNF" page (GitHub Pages serves it automatically)
sitemap.xml         one URL; written by tools/prerender.mjs
robots.txt          points crawlers at the sitemap
CNAME               the custom domain (GitHub writes it from Settings → Pages)
css/main.css        every style, in numbered sections
js/
  data.js           ← ALL CONTENT LIVES HERE (copy for figure notes too)
  figures.js        the project drawings: a wide and a phone layout each, and their mechanisms
  figkit.js         the runtime every figure shares: layout choice, controls, inspecting, pausing
  dom.js            builds the page from data.js
  ui.js             clock, theme, header, menu, filters, copy, chart cursor
  motion.js         the GSAP choreography
  scene.js          the WebGL interlude (loads three.js lazily)
  main.js           boot order, Lenis smooth scroll
tools/
  prerender.mjs     writes the page into index.html (run after editing data.js)
assets/
  fonts/            self-hosted woff2, trimmed to the weights and widths used
  vendor/           GSAP 3.15 and Lenis 1.3, self-hosted
  portrait*.avif/webp   cut-out photo, two sizes each
  car/                  Draco-compressed GLB + WebP PBR textures
  car-drawing.webp      still of the drawing, for browsers without WebGL
  og.png                link preview card
```

No build step for the site, no `npm install`. Any static server runs it.

## running locally

```bash
python -m http.server 8080
# open http://localhost:8080
```

Don't open `index.html` as a `file://` URL: the ES module and the model fetch
both need a real origin.

## updating content

Everything is in **`js/data.js`**: the hero, every project, the research,
experience, the career chart, toolkit, archive, links, and the notes each
figure shows for its parts. Then run:

```bash
node tools/prerender.mjs
```

That writes the page into `index.html`, which is what search engines, link
previews and slow phones see first. If you forget, nothing breaks: the page
notices its HTML is out of date (it fingerprints `data.js`) and builds itself
from `data.js` in the browser; only the search-engine copy is stale.

- `work[]` are the six drawing sheets. Each names a figure in `figures.js`.
  In `body`, `{words|part}` links the words to a part of that figure.
- `figures` holds the inspect notes, per figure, in balloon order.
- `paper.rho`, `paper.auc`, `paper.ablation`, `paper.tiers` are the
  preprint's numbers behind the results figure.
- `timeline.rows[].stints[]` drive the career chart. Dates are `YYYY-MM`;
  `to: null` means ongoing. `c` picks the compound (`h` education, `s`
  internships, `m` research, `i` teaching, `w` community).
- `archive[].stack` names must match `toolkit` names exactly for the
  cross-reference counts to work.
- `person.resume` is `null`; point it at a PDF to show a résumé link.

The private source file `portfolio.json` is git-ignored on purpose: it holds
contact details and notes that should not end up on a public site.

If the site moves to another address, change the canonical URL (and the
og/twitter/JSON-LD URLs next to it) in `index.html`, then run the prerender
so `sitemap.xml` follows.

## the domain

The site is served at `samuraiiii.tech`, published from `main` (root) by
GitHub Pages. The domain is set in this repository's Settings → Pages and
GitHub keeps it in the root `CNAME` file, so don't delete that file.
`itzsam-lol.github.io/sam-portfolio` redirects to the domain, and
`www.samuraiiii.tech` redirects to the bare domain. Because the site sits
at the root of its domain, `404.html` uses root paths (`/assets/...`).

## stack

- **GSAP 3.15**: ScrollTrigger (for what scrubs with scroll), SplitText,
  DrawSVG, Flip. One-shot reveals use an IntersectionObserver instead of a
  ScrollTrigger each, so nothing is measured while the page boots.
- **Lenis 1.3** for smooth scrolling, driven from GSAP's ticker so the page
  has exactly one animation loop. Native scrolling underneath, so
  `position: sticky` just works (the project sheets stack with it on screens
  tall enough to hold a sheet at readable sizes, and flow normally otherwise).
- **three.js r186**, fetched only when you approach the interlude or start
  scrolling. The import map remaps `three.core.js` to its minified build,
  because jsDelivr's auto-minified `three.module.min.js` still imports the
  full-size core.
- Type: Hubot Sans (display, variable width), Mona Sans (text and numerals),
  Martian Mono (data), STIX Two Text (the preprint page and Greek letters).
  Nothing a reader needs is set below 13px; sentences start at 15px.
- Vanilla JS and CSS otherwise.

## performance

Everything on first load comes from the site's own origin: no font CDN, no
script CDN. About 460 KB compressed on a phone (the fonts, the portrait,
GSAP and the site's code), less on a laptop. The three variable fonts were
cut from 229 KB to 156 KB by dropping hinting and the weights and widths the
stylesheet never asks for. The page's markup arrives in the HTML, so the
portrait is the first big thing painted and is preloaded. Figures and the
scroll choreography are built a slice at a time behind the intro, so no
single task blocks the page for long, and figures only animate while on
screen.

Lighthouse on the live site: desktop 99 performance, phone about 72. The
phone score is simulated from the test machine's own timings, so it moves
with how busy that machine is: the same build scores 80 to 82 on a quiet
one. Its LCP model is also pessimistic about the intro (LCP measured on a
4x-slowed CPU over slow 4G is 2.4 to 2.6 s). Accessibility, best practices
and SEO 100 on both. Layout shift is effectively zero on phones; on desktop
the name stretching to width registers about 0.02 (the budget is 0.1).

The interlude adds about 1.8 MB uncompressed (three.js, the car, its
textures, the Draco decoder), but only for readers who head down the page.
The car started life as a 13.6 MB OBJ; it ships as a 269 KB Draco GLB. That
mesh arrives mirrored (its livery text read backwards on both sides, on the
old site too), so `scene.js` flips it across its lateral axis on load.

## graceful degradation

- **No JavaScript**: the page is in the HTML, so it all reads; figures show
  a written description of what they draw.
- **No GSAP**: everything renders and still works: menu, filters, theme,
  copy, the figures' still drawings. Nothing is hidden waiting for an
  animation, and a CSS fallback reveals the masthead if the script never runs.
- **No WebGL** or a low-memory device: the interlude shows a still of the
  drawing (rendered by the same shader) and drops its long scroll.
- **`prefers-reduced-motion`**: no smooth scroll, no intro, no scrubbing;
  figures show a representative still frame and wait for Play; the interlude
  becomes a still half-drawing, half-car frame.
- **Moving content can always be paused**: every animated figure has a
  pause button, and figures stop when they leave the screen.
- Printing gives a clean, linear document with every figure drawn.

## notes

- `src/` is the old React + Babel version, `formula 1/` and `assets/f1model/`
  hold the original 39 MB source model, and `assets/sam.png` is the original
  photo. Nothing loads them; they are kept for reference.

---

Made by Satyam · [linkedin](https://linkedin.com/in/satyam564774288)
