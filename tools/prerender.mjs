/* ============================================================
   PRERENDER: writes the page's markup into index.html.

   The page builds itself from js/data.js in the browser, but search
   engines, link previews and slow phones all do better when the HTML
   already holds the content. Run this after editing data.js:

     node tools/prerender.mjs

   It renders with the same dom.js the browser uses, so the two cannot
   drift. The browser checks a fingerprint of data.js and re-renders
   by itself when this step was skipped, so forgetting it only costs
   the search-engine copy, never the live page. It also refreshes the
   dateModified in the structured data and writes sitemap.xml.
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// a window with just what data.js, figures.js and dom.js touch while loading
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['js/data.js', 'js/figures.js', 'js/dom.js']) vm.runInContext(read(f), ctx, { filename: f });

const out = ctx.Page.render();
const sig = ctx.Page.sig();
let html = read('index.html');

const put = (name, markup) => {
  const re = new RegExp(`(<!--prerender:${name}-->)[\\s\\S]*?(<!--/prerender:${name}-->)`);
  if (!re.test(html)) throw new Error(`marker prerender:${name} is missing from index.html`);
  html = html.replace(re, (m, a, b) => a + markup + b);
};
put('main', out.main);
put('nav', out.nav);
put('menuNav', out.menuNav);
put('menuFoot', out.menuFoot);
html = html.replace(/<main id="main"[^>]*>/, `<main id="main" tabindex="-1" data-sig="${sig}">`);

const today = new Date().toISOString().slice(0, 10);
html = html.replace(/"dateModified": "[^"]*"/, `"dateModified": "${today}"`);
writeFileSync(join(root, 'index.html'), html);

const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
if (!canonical) throw new Error('index.html has no canonical link');
writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${canonical}</loc><lastmod>${today}</lastmod></url>
</urlset>
`);

console.log(`index.html: ${(out.main.length / 1024).toFixed(0)} KB of page markup, fingerprint ${sig}`);
console.log(`sitemap.xml: ${canonical}, ${today}`);
