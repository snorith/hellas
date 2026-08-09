/**
 * HELLAS system constants.
 *
 * Ported verbatim from the legacy 0.7-era config (see z/SPEC.md §2) with two
 * deliberate fixes:
 *  - F1: `sxithborn` → `sixthborn` (migrateData renames the legacy data key)
 *  - F14: the attribute short-name key is `fatepoints`, matching the actor schema
 */

/** Sentinel specifier value meaning "user supplies a custom specifier". */
export const SPECIFY_SUBTYPE = "specify";

export const HELLAS = {
	races: [
		"amazoran",
		"goregon",
		"hellene",
		"kyklope",
		"myrmidon",
		"nephelai",
		"nymphas",
		"zintar"
	],

	/** @type {string[]} All attribute keys, in display order (filled below). */
	attributes: [],

	attributesWShortName: {
		intelligence: "INT",
		perception: "PER",
		will: "WIL",
		charisma: "CHA",
		strength: "STR",
		constitution: "CON",
		dexterity: "DEX",
		speed: "SPD",
		combatrating: "CR",
		dynamism: "DYN",
		glory: "Glory",
		heropoints: "Hero Points",
		hitpoints: "HP",
		fatepoints: "Fate Points",
		relationship: "Relationship",
		internal: "Internal",
		external: "External"
	},

	/** @type {Record<string, string>} Inverse of attributesWShortName (filled below). */
	attributesShortToLong: {},

	/** The ten rollable attributes shown in the sheet grid, in order. */
	characterAttributes: [
		"charisma",
		"constitution",
		"dexterity",
		"intelligence",
		"perception",
		"speed",
		"strength",
		"will",
		"combatrating",
		"dynamism"
	],

	characterDisadvantages: [
		"relationship",
		"internal",
		"external"
	],

	initiativeAttribute: "speed",

	/** @type {string[]} All skill keys (filled below from skillWAssocShortAttributes). */
	skills: [],

	/** @type {string[]} Skills that have specifier variants (filled below). */
	skillsWSpecifics: [],

	skillSpecificsBreakdown: {
		athletics: ["swimming", "climbing", "balancing", "flying", "jumping", "ropeclimbing", "running", "strengthfeat", "endurance", SPECIFY_SUBTYPE],
		computers: ["personal", "mainframe", "starship", SPECIFY_SUBTYPE],
		deception: ["deception", "disguise"],
		drive: [SPECIFY_SUBTYPE],
		etiquette: [SPECIFY_SUBTYPE],
		handicraft: ["alchemy", "armorer", "artificer", "artisan", "bowyerfletcher", "brewervintner", "engineermechanical", "engineerstructural", "gunsmith", "finearts", "vehicles", "weaponsmith", SPECIFY_SUBTYPE],
		instinct: ["intuition", "initiative"],
		intimidate: ["words", "physically"],
		investigatesearch: ["investigationwcha", "investigationwint", "search"],
		literacy: [SPECIFY_SUBTYPE],
		lore: ["agriculture", "arcanearts", "engineering", "folklore", "forgery", "gambling", "heraldry", "herblore", "geography", "history", "law", "local", "mining", "nature", "region", "streetwise", "tactics", SPECIFY_SUBTYPE],
		mode: [],
		perform: ["dance", "musicianship", "juggling", "acting", "oratory", "singing"],
		pilot: [SPECIFY_SUBTYPE],
		profession: [SPECIFY_SUBTYPE],
		science: ["astronomy", "biology", "botany", "chemistry", "geology", "mathematics", "medicine", "metallurgy", "physics", "xenobiology", "theology", "zoology", SPECIFY_SUBTYPE],
		sleightofhand: ["perform", "detect"],
		speaklanguage: ["atlantean", "goregon", "hellene", "nymphas", "zintar", "zoran", SPECIFY_SUBTYPE],
		survival: ["savannah", "forest", "jungle", "desert", "arctic", "swamp", "alpine", "aquatic", "urban", SPECIFY_SUBTYPE],
		torture: [SPECIFY_SUBTYPE],
		trackingshadowing: ["tracking", "shadowing"],
		trading: ["appraising", "haggling"],
		weapon: ["melee", "ranged", "heavyweapons", "guns", "thrown", "vehicleweapons", SPECIFY_SUBTYPE]
	},

	/** Skills where each variation must be bought separately. */
	skillSpecificsGetOneOnly: [
		"computers",
		"drive",
		"etiquette",
		"handicraft",
		"instinct",
		"literacy",
		"mode",
		"perform",
		"pilot",
		"profession",
		"science",
		"speaklanguage",
		"survival",
		"weapon",
		"lore"
	],

	/** Skills where one buy includes every variation. */
	skillSpecificsGetAll: [
		"torture"
	],

	skillWAssocShortAttributes: {
		athletics: ["CON", "DEX", "SPD", "STR"],
		animalhandling: ["WIL"],
		command: ["CHA"],
		computers: ["INT"],
		deception: ["CHA", "INT"],
		deducemotive: ["PER"],
		diplomacy: ["CHA"],
		disablemechanism: ["DEX"],
		drive: ["DEX"],
		etiquette: ["CHA", "INT"],
		evade: ["DEX"],
		handicraft: ["INT", "STR", "DEX"],
		heal: ["INT"],
		influence: ["CHA"],
		instinct: ["PER", "SPD"],
		intimidate: ["CHA", "STR"],
		investigatesearch: ["CHA", "INT", "PER"],
		literacy: ["INT"],
		lore: ["INT"],
		medicine: ["INT"],
		mode: ["DYN", "PER", "CR"],
		mounted: ["CR"],
		navigate: ["PER"],
		pankration: ["CR"],
		parry: ["CR"],
		perform: ["DEX", "CHA"],
		pilot: ["DEX"],
		profession: ["INT", "PER", "WIL", "CHA", "STR", "CON", "DEX", "SPD", "CR", "DYN"],
		research: ["PER", "INT"],
		resolve: ["WIL"],
		ride: ["DEX"],
		science: ["INT"],
		sleightofhand: ["DEX", "PER"],
		speaklanguage: ["INT"],
		stealth: ["DEX"],
		survival: ["CON", "INT"],
		torture: ["DEX", "INT", "STR"],
		trackingshadowing: ["PER", "DEX"],
		trading: ["INT", "CHA"],
		weapon: ["CR"]
	},

	/** @type {Record<string, string[]>} Long-name mirror of skillWAssocShortAttributes (filled below). */
	skillWAssocLongAttributes: {},

	/** @type {string[]} Dynamism mode keys (filled below). */
	dynamismModes: [],

	dynamismModesSpecificBreakdowns: {
		attack: ["skill", "cr"],
		illusion: ["illusion", "resist"],
		influence: ["influence"],
		kinetic: ["kinetic", "grapple"],
		manifest: ["create", "dematerialize"],
		manipulate: ["health", "skill", "attribute", "protection", "minortransform", "majortransform", "completetransform"],
		sensory: ["perception", "locate", "scry", "obscure"],
		shield: ["aura", "barrier", "ward", "curse"]
	},

	/** The skill key that represents dynamism modes. */
	dynamismMode: "mode",

	weaponModifiers: [
		"regular",
		"aether",
		"armorpiercing",
		"beam",
		"bulky",
		"fast",
		"flame",
		"impaling",
		"needle",
		"slugthrower",
		"sonic",
		"torch",
		"vehicularscale"
	],

	armorModifiers: [
		"regular",
		"energy",
		"aether",
		"holo"
	],

	armorTypes: {
		naked: ["nakednudity", "nakedenchantingbeauty"],
		clothing: ["clothingutility", "clothingofftherack", "clothinghighfashion", "clothingnoblewear"],
		cuirass: ["cuirasslight", "cuirassmedium", "cuirassheavy"],
		full: ["fulllight", "fullmedium", "fullheavy"],
		helmet: ["helmetlight", "helmetmedium", "helmetheavy"],
		shield: ["shieldlight", "shieldmedium", "shieldheavy", "shielddrone"],
		shroud: ["shroudclassa", "shroudclassb", "shroudclassc"]
	},

	childrenBorn: [
		"firstborn",
		"secondborn",
		"thirdborn",
		"fourthborn",
		"fifthborn",
		"sixthborn"
	]
};

HELLAS.attributes = Object.keys(HELLAS.attributesWShortName);
HELLAS.attributesShortToLong = Object.fromEntries(
	Object.entries(HELLAS.attributesWShortName).map(([long, short]) => [short, long])
);
HELLAS.skillsWSpecifics = Object.keys(HELLAS.skillSpecificsBreakdown);
HELLAS.skills = Object.keys(HELLAS.skillWAssocShortAttributes);
HELLAS.dynamismModes = Object.keys(HELLAS.dynamismModesSpecificBreakdowns);
HELLAS.skillSpecificsBreakdown.mode = HELLAS.dynamismModes;

for ( const [skill, shorts] of Object.entries(HELLAS.skillWAssocShortAttributes) ) {
	HELLAS.skillWAssocLongAttributes[skill] = shorts.map(s => HELLAS.attributesShortToLong[s]);
}
