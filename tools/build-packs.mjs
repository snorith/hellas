/**
 * Compile packs/_source/<pack>/ JSON documents into LevelDB packs at
 * packs/<pack>/. Requires `npm install` inside tools/ (see mise.toml for the
 * pinned node). Run from the repo root: node tools/build-packs.mjs
 */
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { readdir } from "node:fs/promises";

const packs = await readdir("packs/_source");
for ( const pack of packs ) {
	await compilePack(`packs/_source/${pack}`, `packs/${pack}`, { log: true });
	console.log(`compiled packs/${pack}`);
}
