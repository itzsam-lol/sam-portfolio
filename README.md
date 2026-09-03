# sam-portfolio

My personal portfolio — an F1 broadcast, basically.

Live at → **[itzsam-lol.github.io/sam-portfolio](https://itzsam-lol.github.io/sam-portfolio)**

---

## the idea

One WebGL scene runs behind the entire page. The camera rig is keyframed per
section and driven by real scroll position, so the car is the spine of the site
rather than hero wallpaper. The HUD telemetry — speed, gear, throttle, brake,
DRS, ERS — is derived from actual scroll velocity, and the circuit minimap in
the corner traces your lap as you go (and doubles as navigation).

## what's inside

```
index.html        shell + critical inline CSS (ignition screen)
css/main.css      every style, in labelled sections
js/
  data.js         ← ALL CONTENT LIVES HERE. This is the only file
                    you need to touch to update the site.
  dom.js          builds the markup from data.js
  motion.js       every GSAP timeline
  hud.js          telemetry, circuit map, nav state
  cursor.js       reticle cursor + magnetic elements
  scene.js        Three.js — camera rig, PBR materials, speed streaks
  main.js         boot order, smooth scroll, ignition sequence
assets/
  car/            Draco-compressed GLB + WebP PBR textures
  *.webp          photo and logos
```

No build step. No `npm install`. Open it on any static server and it runs.

## running locally

```bash
python -m http.server 8080
# open http://localhost:8080
```

Don't open `index.html` as a `file://` URL — the ES module and the model fetch
both need a real origin.

## updating content

Everything is in **`js/data.js`** — bio, projects, experience, skills, links,
even the nav labels and the scrolling ticker. Change it and the page updates.
You never need to touch the component files for a content change.

A few conventions in there:

- `profile.heading` uses `|` to mark where the red text starts.
- `skills[].compound` is `s` / `m` / `h` — that drives the tyre-compound filter.
- `crew[].size` is `lg` / `wide` / `md` / `sm` — bento grid spans.
- `projects[].featured: true` makes a double-width card in the garage rail.

## stack

- **GSAP 3.13** — ScrollTrigger, ScrollSmoother, SplitText, Flip, DrawSVG,
  MotionPath, ScrambleText, Observer, Draggable, Inertia, CustomEase.
  (All free since 2025.)
- **Three.js 0.168** — one scene, Draco-compressed model, PBR + a procedural
  studio environment.
- Vanilla JS and CSS otherwise. No framework, no bundler.

## performance

First load is about **1.2 MB**, most of which is Three.js and the car.

The model started life as a 13.6 MB ASCII OBJ with 4K PNG textures. It is now a
**269 KB** Draco GLB plus WebP maps (2K on desktop, 1K on phones). If you ever
need to redo that conversion:

```bash
npx obj2gltf -i car.obj -o car.glb --binary
npx gltf-pipeline -i car.glb -o car_final.glb -d \
  --draco.compressionLevel 10 --draco.quantizePositionBits 14
```

## graceful degradation

The site is built to survive its own dependencies failing:

- **No GSAP** (blocked CDN, offline) — everything still renders and still
  works: menu, filters, expandable rows, horizontal scrolling. Real values are
  in the markup, so counters and skill bars are never empty.
- **No WebGL / low-memory device** — the 3D scene is skipped, the page is
  unaffected.
- **`prefers-reduced-motion`** — smooth scroll, 3D, cursor and all transitions
  are disabled; the content stays fully intact.
- **No JavaScript at all** — a `<noscript>` block with contact links.

## notes

- `src/` is the previous React + Babel version. Nothing references it any more;
  it's kept only for reference and is safe to delete.
- `formula 1/` and `assets/f1model/` hold the original 39 MB source model. The
  site no longer loads them — `assets/car/` is what ships. Also safe to delete
  (they're in git history either way).

---

Made by Satyam · [linkedin](https://linkedin.com/in/satyam564774288)
