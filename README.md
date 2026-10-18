# sam-portfolio

My personal portfolio: a race engineer's dossier, basically.

Live at → **[itzsam-lol.github.io/sam-portfolio](https://itzsam-lol.github.io/sam-portfolio)**

---

## the idea

Paper and ink, with one red taken from the race suit in the photo. Formula 1
shows up as a design language rather than a costume: start lights before the
name, tyre compounds that mean something in the career chart, an engineering
title block on every project sheet. The sections are still just called Work,
Research and Experience.

A few things worth knowing about:

- **The name launches.** Five start lights, lights out, and the masthead comes
  off the line condensed and stretches to full width along Hubot Sans's width
  axis. It is refitted to the column on every frame, so it lands exactly
  edge to edge at any window size.
- **Drawn first, then built.** One WebGL scene, two renderings. An ink drawing
  is made in a shader from the car's own normals and depth (silhouette,
  creases, a little hatching); a red scan line sweeps across it and leaves the
  lit car behind, while the camera swings from a side elevation to a front
  three-quarter view.
- **Every project gets a drawing of how it works.** Each figure is hand-built
  SVG and runs its mechanism while on screen: the CareerOS approval gate, the
  22 fail-closed rules in SecondAsk, CodeForge's winnowing (the worked example
  from Schleimer, Wilkerson & Aiken 2003, computed live), `addi x5, x0, 42`
  encoding to `0x02A00293`. Numbers are real; anything schematic says so.
- **The career is a tyre-strategy graphic** that replays as you scroll past.
- **The toolkit cross-references the archive.** Hover a tool to see which
  projects use it; click it to filter the archive.
- Day and night themes (it follows your OS until you pick one).

## what's inside

```
index.html          shell, meta, fonts, import map, script order
404.html            "DNF" page (GitHub Pages serves it automatically)
css/main.css        every style, in numbered sections
js/
  data.js           ← ALL CONTENT LIVES HERE
  figures.js        the project drawings (SVG) and their animations
  dom.js            builds the page from data.js
  ui.js             clock, theme, header, menu, filters, copy-to-clipboard
  motion.js         every GSAP timeline
  scene.js          the WebGL interlude (loads three.js lazily)
  main.js           boot order, Lenis smooth scroll
assets/
  portrait*.avif/webp   cut-out photo, two sizes each
  car/                  Draco-compressed GLB + WebP PBR textures
  car-drawing.webp      still of the drawing, for browsers without WebGL
  og.png                link preview card
```

No build step. No `npm install`. Any static server runs it.

## running locally

```bash
python -m http.server 8080
# open http://localhost:8080
```

Don't open `index.html` as a `file://` URL: the ES module and the model fetch
both need a real origin.

## updating content

Everything is in **`js/data.js`**: the hero, every project, the research,
experience, the career chart, toolkit, archive and links. Change it and the
page updates; no other file needs touching for content.

- `work[]` are the six drawing sheets. Each names a figure in `figures.js`.
- `timeline.rows[].stints[]` drive the career chart. Dates are `YYYY-MM`;
  `to: null` means ongoing. `c` picks the compound (`h` education, `s`
  internships, `m` research, `i` teaching, `w` community).
- `archive[].stack` names must match `toolkit` names exactly for the
  cross-reference counts to work.
- `person.resume` is `null`; point it at a PDF to show a résumé link.

The private source file `portfolio.json` is git-ignored on purpose: it holds
contact details and notes that should not end up on a public site.

## stack

- **GSAP 3.15**: ScrollTrigger, SplitText, DrawSVG, Flip, CustomEase.
- **Lenis 1.3** for smooth scrolling, driven from GSAP's ticker so the page
  has exactly one animation loop. Native scrolling underneath, so
  `position: sticky` just works (the project sheets stack with it).
- **three.js r186**, fetched only when you approach the interlude or start
  scrolling. The import map remaps `three.core.js` to its minified build,
  because jsDelivr's auto-minified `three.module.min.js` still imports the
  full-size core.
- Type: Hubot Sans (display, variable width), Mona Sans (text and numerals),
  Martian Mono (data), STIX Two Text (the preprint page and Greek letters).
- Vanilla JS and CSS otherwise.

## performance

First load is about 700 KB before compression (fonts, the portrait, GSAP and
the site's own code) and the hero paints in well under a second. The
interlude adds about 1.8 MB uncompressed (three.js, the car, its textures,
the Draco decoder), but only for readers who head down the page.

The car started life as a 13.6 MB OBJ; it ships as a 269 KB Draco GLB. That
mesh arrives mirrored (its livery text read backwards on both sides, on the
old site too), so `scene.js` flips it across its lateral axis on load.

## graceful degradation

- **No GSAP** (blocked CDN, offline): everything renders and still works:
  menu, filters, theme, copy. Nothing is hidden waiting for an animation.
- **No WebGL** or a low-memory device: the interlude shows a still of the
  drawing (rendered by the same shader) and drops its long scroll.
- **`prefers-reduced-motion`**: no smooth scroll, no intro, no scrubbing; the
  interlude becomes a still half-drawing, half-car frame.
- **No JavaScript**: a `<noscript>` block with contact links.
- Printing gives a clean, linear document.

## notes

- `src/` is the old React + Babel version, `formula 1/` and `assets/f1model/`
  hold the original 39 MB source model, and `assets/sam.png` is the original
  photo. Nothing loads them; they are kept for reference.

---

Made by Satyam · [linkedin](https://linkedin.com/in/satyam564774288)
