type ObjectWStringValues = { [key: string]: string }
type ObjectWStringArrayValues = { [key: string]: string[] }

export const SPECIFY_SUBTYPE = 'specify'

export type hellasConfigType = {
	races: string[]
	attributes: string[],
	attributesWShortName: ObjectWStringValues,
	attributesShortToLong: ObjectWStringValues,
	characterAttributes: string[],
	characterDisadvantages: string[],
	initiativeAttribute: string,
	skills: string[],
	skillsWSpecifics: string[],
	skillSpecificsBreakdown: ObjectWStringArrayValues,
	skillSpecificsGetOneOnly: string[],
	skillSpecificsGetAll: string[],
	skillWAssocShortAttributes: ObjectWStringArrayValues,
	skillWAssocLongAttributes: ObjectWStringArrayValues,
	dynamismModes: string[],
	dynamismModesSpecificBreakdowns: ObjectWStringArrayValues,
	dynamismMode: string,
	weaponModifiers: string[],
	armorModifiers: string[],
	armorTypes: string[]
}

export type foundryAttributeValueMax = {
	value: number,
	max: number
}

const HELLAS: hellasConfigType = {
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
		fatepoint: "Fate Points",
		relationship: "Relationship",
		internal: "Internal",
		external: "External",
	},

	attributesShortToLong: {
		"INT": "intelligence",
		"PER": "perception",
		"WIL": "will",
		"CHA": "charisma",
		"STR": "strength",
		"CON": "constitution",
		"DEX": "dexterity",
		"SPD": "speed",
		"CR": "combatrating",
		"DYN": "dynamism",
		"Glory": "glory",
		"Hero Points": "heropoints",
		"HP": "hitpoints",
		"Fate Points": "fatepoint",
		"Relationship": "relationship",
		"Internal": "internal",
		"External": "external"
	},

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

	skills: [],

	skillsWSpecifics: [],

	skillSpecificsBreakdown: {
		"athletics": ["swimming", "climbing", "balancing", "flying", "jumping", "ropeclimbing", "running", "strengthfeat", "endurance", SPECIFY_SUBTYPE],
		"computers": ["personal", "mainframe", "starship", SPECIFY_SUBTYPE],
		"deception": ['deception', "disguise"],
		"drive": [SPECIFY_SUBTYPE],
		"etiquette": [SPECIFY_SUBTYPE],
		"handicraft": ["alchemy", "armorer", "artificer", "artisan", "bowyerfletcher", "brewervintner", "engineermechanical", "engineerstructural", "gunsmith", "finearts", "vehicles", "weaponsmith", SPECIFY_SUBTYPE],
		"instinct": ["intuition", "initiative"],
		"intimidate": ["words", "physically"],
		"investigatesearch": ["investigationwcha", "investigationwint", "search"],
		"literacy": [SPECIFY_SUBTYPE],
		"lore": ["agriculture", "arcanearts", "engineering", "folklore", "forgery", "gambling", "heraldry", "herblore", "geography", "history", "law", "local", "mining", "nature", "region", "streetwise", "tactics", SPECIFY_SUBTYPE],
		"mode": [],
		"perform": ["dance", "musicianship", "juggling", "acting", "oratory", "singing"],
		"pilot": [SPECIFY_SUBTYPE],
		"profession": [SPECIFY_SUBTYPE],
		"science": ["astronomy", "biology",	"botany", "chemistry", "geology", "mathematics", "medicine", "metallurgy", "physics", "xenobiology", "theology", "zoology", SPECIFY_SUBTYPE],
		"sleightofhand": ['perform', 'detect'],
		"speaklanguage": ["atlantean", "goregon", "hellene", "nymphas", "zintar", "zoran", SPECIFY_SUBTYPE],
		"survival": ["savannah", "forest", "jungle", "desert", "arctic", "swamp", "alpine", "aquatic", "urban", SPECIFY_SUBTYPE],
		"torture": [SPECIFY_SUBTYPE],
		"trackingshadowing": ["tracking", "shadowing"],
		"trading": ["appraising", "haggling"],
		"weapon": ["melee", "ranged", "heavyweapons", "guns", "thrown", "vehicleweapons", SPECIFY_SUBTYPE],
	},

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
		weapon: ["CR"],
	},

	skillWAssocLongAttributes: {},

	dynamismModes: [],

	dynamismModesSpecificBreakdowns: {
		"attack": ['skill', 'cr'],
		"illusion": ['illusion', 'resist'],
		"influence": ['influence'],
		"kinetic": ['kinetic', 'grapple'],
		"manifest": ['create', 'dematerialize'],
		"manipulate": ['health', 'skill', 'attribute', 'protection', 'minortransform', 'majortransform', 'completetransform'],
		"sensory": ['perception', 'locate', 'scry', 'obscure'],
		"shield": ['aura', 'barrier', 'ward', 'curse']
,	},

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
		"aether"
	],

	armorTypes: [
		"naked",
		"clothing",
		"cuirass",
		"full",
		"helmet",
		"shieldlight",
		"shieldmedium",
		"shieldheavy",
		"shielddrone",
		"shrouda",
		"shroudb",
		"shroudc"
	]
}

HELLAS.attributes = Object.keys(HELLAS.attributesWShortName)
HELLAS.skillsWSpecifics = Object.keys(HELLAS.skillSpecificsBreakdown)
HELLAS.skills = Object.keys(HELLAS.skillWAssocShortAttributes)
HELLAS.dynamismModes = Object.keys(HELLAS.dynamismModesSpecificBreakdowns)
HELLAS.skillSpecificsBreakdown["mode"] = HELLAS.dynamismModes

// create a shadowed list of long attribute names per skill from the provided list of shortened attribute names
for (let [key, attributes] of Object.entries(HELLAS.skillWAssocShortAttributes)) {
	HELLAS.skillWAssocLongAttributes[key] = attributes.map(value => {
		return HELLAS.attributesShortToLong[value]
	})
}

export { HELLAS }
