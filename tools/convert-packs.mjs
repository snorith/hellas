/**
 * One-time conversion of the legacy NeDB packs (src/packs/*.db) into per-document
 * JSON sources under packs/_source/<pack>/, ready for LevelDB compilation by
 * tools/build-packs.mjs. Idempotent; safe to re-run.
 *
 * Conversions applied per document:
 *  - NeDB journal semantics: last line per _id wins; $$deleted tombstones dropped
 *  - data → system, with the Phase-3 migrations applied (blank → null)
 *  - system filtered to the fields each type's DataModel declares (order/version/
 *    spell/skillid-on-skills etc. dropped)
 *  - permission → ownership {default: 0} (per-user entries are meaningless
 *    outside the original world)
 *
 * Run: node tools/convert-packs.mjs
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	migrateDynamismData,
	migrateSkillData,
	migrateTalentData
} from "../module/data/migrations.mjs";

const PACKS = [
	{ file: "src/packs/system-skills.db", name: "system-skills", migrate: migrateSkillData,
		fields: ["skill", "attribute", "specifier", "specifierCustom", "level", "notes"] },
	{ file: "src/packs/system-talents.db", name: "system-talents", migrate: migrateTalentData,
		fields: ["desc", "benefit", "notes"] },
	{ file: "src/packs/system-dynamisms.db", name: "system-dynamisms", migrate: migrateDynamismData,
		fields: ["skillid", "dod", "dodinfo", "range", "tradition", "duration", "other", "notes"] }
];

const slug = name => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

for ( const pack of PACKS ) {
	const lines = (await readFile(pack.file, "utf8")).split("\n").filter(l => l.trim());
	const byId = new Map();
	for ( const line of lines ) {
		const doc = JSON.parse(line);
		if ( doc.$$deleted ) { byId.delete(doc._id); continue; }
		byId.set(doc._id, doc);  // journal: last write wins
	}

	const outDir = path.join("packs", "_source", pack.name);
	await rm(outDir, { recursive: true, force: true });
	await mkdir(outDir, { recursive: true });

	for ( const doc of byId.values() ) {
		const system = pack.migrate({ ...doc.data });
		const filtered = {};
		for ( const f of pack.fields ) {
			if ( f in system ) filtered[f] = system[f];
		}
		const out = {
			_id: doc._id,
			_key: `!items!${doc._id}`,
			name: doc.name,
			type: doc.type,
			img: doc.img,
			system: filtered,
			effects: [],
			folder: null,
			sort: 0,
			ownership: { default: 0 },
			flags: doc.flags ?? {}
		};
		await writeFile(
			path.join(outDir, `${slug(doc.name)}__${doc._id}.json`),
			JSON.stringify(out, null, "\t") + "\n"
		);
	}
	console.log(`${pack.name}: ${byId.size} documents (${lines.length} journal lines)`);
}
