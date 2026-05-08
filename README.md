# sam-portfolio

My personal portfolio — built with an F1 theme because why not.

Live at → **[itzsam-lol.github.io/sam-portfolio](https://itzsam-lol.github.io/sam-portfolio)**

---

## what's inside

```
index.html        ← everything: CSS, layout, scripts
src/
  data.jsx        ← all content lives here (edit this to update the site)
  sections.jsx    ← React components
  app.jsx         ← root render
assets/           ← logos and images
```

No build step. No `npm install`. Just open `index.html` (or run a local server) and it works.

Uses React 18 + Babel standalone via CDN, so the JSX compiles in the browser. GSAP handles the animations.

## running locally

```bash
python -m http.server 8080
# open http://localhost:8080
```

Or any static file server. Don't open `index.html` directly as a file — the JSX loading needs a server.

## updating content

Everything is in `src/data.jsx`. Change your bio, projects, experience there and the site updates automatically. No touching the component files needed for content changes.

## stack

- React 18 (CDN)
- GSAP 3 + ScrollTrigger
- Vanilla CSS (all in `index.html`)
- No framework, no bundler

---

Made by Satyam · [linkedin](https://linkedin.com/in/satyam564774288)
