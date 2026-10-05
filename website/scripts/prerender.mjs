// Runs after `vite build` (client) and `vite build --ssr` (server bundle):
// renders each page to static HTML and injects it — plus JSON-LD — into the
// built templates, so crawlers and no-JS visitors get the full content and the
// browser just hydrates it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "..");
const dist = path.join(site, "dist");
const ssrDir = path.join(site, "dist-ssr");

const { render, jsonLd, buildSitemap } = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);

const pages = [
  { name: "landing", file: "index.html" },
  { name: "cropper", file: path.join("cropper", "index.html") },
];

const ldScript = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data, null, 2).replace(/</g, "\u003c")}</script>`;

for (const { name, file } of pages) {
  const target = path.join(dist, file);
  let html = fs.readFileSync(target, "utf8");
  if (!html.includes("<!--app-html-->") || !html.includes("<!--jsonld-->")) {
    throw new Error(`${file}: missing <!--app-html--> or <!--jsonld--> placeholder`);
  }
  // Function replacers: the rendered HTML contains "$" sequences that String.replace would interpret.
  html = html.replace("<!--jsonld-->", () => ldScript(jsonLd(name)));
  html = html.replace("<!--app-html-->", () => render(name));
  fs.writeFileSync(target, html);
  console.log(`prerendered ${file} (${(html.length / 1024).toFixed(0)} kB)`);
}

fs.writeFileSync(path.join(dist, "sitemap.xml"), buildSitemap());
console.log("wrote sitemap.xml");

fs.rmSync(ssrDir, { recursive: true, force: true });
