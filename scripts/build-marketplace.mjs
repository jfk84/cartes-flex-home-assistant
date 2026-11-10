import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const cards = ["boutons", "clim", "garage", "portail", "volet"];
const sources = cards.map((card) => {
  const name = `${card}-flex-card`;
  const source = readFileSync(new URL(`../${name}/${name}.js`, import.meta.url), "utf8");
  return `if (!customElements.get("${name}")) {\n${source}\n}`;
});

const dist = new URL("../dist/", import.meta.url);
mkdirSync(dist, { recursive: true });
writeFileSync(
  new URL("cartes-flex-home-assistant.js", dist),
  sources.join("\n;\n") + "\n",
);
