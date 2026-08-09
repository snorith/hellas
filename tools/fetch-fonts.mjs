/**
 * One-time (but reproducible) font acquisition: downloads the latin-subset
 * woff2 files the system bundles into fonts/, replacing the legacy Google
 * Fonts @import. Verifies woff2 magic bytes and a sane minimum size.
 * Run: node tools/fetch-fonts.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";

// A modern-browser UA makes Google serve woff2 with unicode-range subsets.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Roboto is served as a VARIABLE font: every requested weight resolves to the
// same woff2 (verified by checksum), so one file covers 300-500 via a
// font-weight range in @font-face.
const FAMILIES = [
	{
		css: "https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap",
		weights: { 400: "roboto.woff2" }
	},
	{
		css: "https://fonts.googleapis.com/css2?family=Caesar+Dressing&display=swap",
		weights: { 400: "caesar-dressing-400.woff2" }
	}
];

await mkdir("fonts", { recursive: true });

for ( const family of FAMILIES ) {
	const css = await (await fetch(family.css, { headers: { "User-Agent": UA } })).text();
	// css2 responses are a sequence of "/* subset */ @font-face { ... }" blocks.
	const blocks = [...css.matchAll(/\/\* ([a-z-]+) \*\/\s*@font-face\s*{([^}]+)}/g)];
	for ( const [weight, filename] of Object.entries(family.weights) ) {
		const block = blocks.find(([, subset, body]) =>
			subset === "latin" && body.includes(`font-weight: ${weight}`));
		if ( !block ) throw new Error(`no latin block for weight ${weight} in ${family.css}`);
		const url = block[2].match(/url\(\s*["']?(https:[^)"']+\.woff2)["']?\s*\)/)?.[1];
		if ( !url ) throw new Error(`no woff2 url for weight ${weight}`);
		const buffer = Buffer.from(await (await fetch(url)).arrayBuffer());
		if ( buffer.subarray(0, 4).toString("ascii") !== "wOF2" ) {
			throw new Error(`${filename}: not a woff2 file (magic ${buffer.subarray(0, 4)})`);
		}
		if ( buffer.length < 5000 ) throw new Error(`${filename}: suspiciously small (${buffer.length}B)`);
		await writeFile(`fonts/${filename}`, buffer);
		console.log(`fonts/${filename}  ${buffer.length} bytes`);
	}
}
console.log("done");
