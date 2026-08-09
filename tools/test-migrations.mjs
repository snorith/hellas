/**
 * Migration smoke test — bare node, no Foundry required.
 * Run: node tools/test-migrations.mjs
 *
 * Covers the hard-won migrateData contract:
 *  - runs on partial update deltas without inventing sibling branches
 *  - blank strings at NumberField paths become null (never 0)
 *  - sxithborn → sixthborn rename, guarded and delta-safe
 *  - idempotency (migrate ∘ migrate === migrate)
 */
import assert from "node:assert/strict";
import {
	migrateArmorData,
	migrateCharacterData,
	migrateDynamismData,
	migrateSkillData,
	migrateWeaponData
} from "../module/data/migrations.mjs";

// world.mjs depends only on module/config.mjs; the version-gate helper takes
// an injected comparator, so no foundry stubbing is needed here.
import { needsMigration, NEEDS_MIGRATION_VERSION } from "../module/migrations/world.mjs";

let passed = 0;
function test(name, fn) {
	fn();
	passed++;
	console.log(`ok - ${name}`);
}

const clone = o => structuredClone(o);

test("full legacy character document", () => {
	const source = {
		xp: "3/12",
		attributes: {
			strength: { value: 4, max: 6 },
			dexterity: { value: "", max: "  " },
			fatepoints: { value: 3, max: 10 }
		},
		disadvantages: {
			relationship: { level: "", info: "sister" },
			internal: { level: "2", info: "" }
		},
		personal: { tree: { children: { firstborn: "Kora", sxithborn: "Zed" } } },
		initiative: { modifiers: { first: "", following: -1 } }
	};
	migrateCharacterData(source);
	assert.equal(source.attributes.strength.value, 4, "untouched number preserved");
	assert.equal(source.attributes.dexterity.value, null, "blank → null, not 0");
	assert.equal(source.attributes.dexterity.max, null, "whitespace → null");
	assert.equal(source.disadvantages.relationship.level, null);
	assert.equal(source.disadvantages.internal.level, "2", "numeric string left for NumberField cast");
	assert.equal(source.disadvantages.internal.info, "", "non-number blank strings untouched");
	assert.equal(source.initiative.modifiers.first, null);
	assert.equal(source.initiative.modifiers.following, -1);
	assert.deepEqual(source.personal.tree.children, { firstborn: "Kora", sixthborn: "Zed" });
	assert.equal(source.xp, "3/12", "string-by-design field untouched");
});

test("partial delta touches only present paths", () => {
	const delta = { disadvantages: { internal: { level: "" } } };
	migrateCharacterData(delta);
	assert.deepEqual(delta, { disadvantages: { internal: { level: null } } });
	assert.ok(!("attributes" in delta), "no sibling branch invented");
	assert.ok(!("personal" in delta), "no children branch invented");
});

test("sxithborn rename in a delta; sixthborn wins when both present", () => {
	const delta = { personal: { tree: { children: { sxithborn: "Zed" } } } };
	migrateCharacterData(delta);
	assert.deepEqual(delta.personal.tree.children, { sixthborn: "Zed" });

	const both = { personal: { tree: { children: { sxithborn: "old", sixthborn: "new" } } } };
	migrateCharacterData(both);
	assert.deepEqual(both.personal.tree.children, { sixthborn: "new" });
});

test("no-op delta stays no-op", () => {
	const delta = { epithet: "Swift" };
	const before = clone(delta);
	migrateCharacterData(delta);
	assert.deepEqual(delta, before);
});

test("item migrations: blank → null at every declared number path", () => {
	const weapon = { acc: "", dr: "3", wt: 0, rof: "", str: "", price: "0", ammo: "" };
	migrateWeaponData(weapon);
	assert.deepEqual(weapon, { acc: null, dr: "3", wt: 0, rof: null, str: null, price: "0", ammo: "" });

	const armor = { str: "", per: -1, cha: "", parry: "", pr: "", wt: "", md: "", price: "" };
	migrateArmorData(armor);
	assert.deepEqual(armor, { str: null, per: -1, cha: null, parry: null, pr: null, wt: null, md: null, price: null });

	const skill = { level: { value: "", max: "" }, skill: "athletics" };
	migrateSkillData(skill);
	assert.deepEqual(skill, { level: { value: null, max: null }, skill: "athletics" });

	const dyn = { dod: "", dodinfo: "" };
	migrateDynamismData(dyn);
	assert.deepEqual(dyn, { dod: null, dodinfo: "" });
});

test("idempotency: second migration changes nothing", () => {
	const source = {
		attributes: { dexterity: { value: "" } },
		personal: { tree: { children: { sxithborn: "Zed" } } },
		disadvantages: { external: { level: " " } }
	};
	migrateCharacterData(source);
	const once = clone(source);
	migrateCharacterData(source);
	assert.deepEqual(source, once);
});

test("needsMigration version gate", () => {
	// semver-ish comparator good enough for the test matrix
	const isNewer = (a, b) => {
		const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
		for ( let i = 0; i < 3; i++ ) { if ( (pa[i] ?? 0) !== (pb[i] ?? 0) ) return (pa[i] ?? 0) > (pb[i] ?? 0); }
		return false;
	};
	assert.equal(needsMigration("", isNewer), true, "never-stamped world migrates");
	assert.equal(needsMigration("0.3.6", isNewer), true, "older stamp migrates");
	assert.equal(needsMigration(NEEDS_MIGRATION_VERSION, isNewer), false, "equal stamp skips");
	assert.equal(needsMigration("0.5.0", isNewer), false, "newer stamp skips");
});

console.log(`\n${passed}/${passed} migration smoke tests passed`);
