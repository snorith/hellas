type ObjectWStringValues = { [key: string]: string }
type ObjectWStringArrayValues = { [key: string]: string[] }

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
	skillWAssocAttributes: ObjectWStringArrayValues,
	dynamismModes: string[],
	dynamismModesSpecificBreakdowns: ObjectWStringArrayValues
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
		"intelligence",
		"perception",
		"will",
		"charisma",
		"strength",
		"constitution",
		"dexterity",
		"speed",
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
		"athletics": ["swimming", "climbing", "balancing", "flying", "jumping", "ropeclimbing", "running", "strengthfeat", "endurance", "specify"],
		"computers": ["personal", "mainframe", "starship", "specify"],
		"etiquette": ["specify"],
		"handicraft": ["alchemy", "armorer", "artificer", "artisan", "bowyerfletcher", "brewervintner", "engineermechanical", "engineerstructural", "gunsmith", "finearts", "vehicles", "weaponsmith"],
		"instinct": ["intuition", "initiative"],
		"investigatesearch": ["investigation", "search"],
		"lore": ["agriculture", "arcanearts", "engineering", "folklore", "forgery", "gambling", "heraldry", "herblore", "geography", "history", "law", "local", "mining", "nature", "region", "streetwise", "tactics", "specify"],
		"mode": [],
		"perform": ["dance", "musicianship", "juggling", "acting", "oratory", "singing"],
		"pilot": ["specify"],
		"profession": ["specify"],
		"science": ["astronomy", "biology",	"botany","chemistry", "geology", "mathematics",	"medicine",	"metallurgy","physics",	"xenobiology", "theology", "zoology", "specify"],
		"speaklanguage": ["atlantean", "goregon", "hellene", "nymphas", "zintar", "zoran", "specify"],
		"survival": ["savannah", "forest", "jungle,", "desert", "arctic", "swamp", "alpine", "aquatic", "urban", "specify"],
		"trackingshadowing": ["tracking", "shadowing"],
		"trading": ["appraising", "haggling"],
		"weapon": ["melee", "ranged", "heavyweapons", "guns", "thrown", "vehicleweapons", "specify"],
	},

	skillWAssocAttributes: {
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
		mode: ["DYN", "CR"],
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
		sleightofhand: ["DEX"],
		speaklanguage: ["INT"],
		stealth: ["DEX"],
		survival: ["CON", "INT"],
		torture: ["DEX", "INT", "STR"],
		trackingshadowing: ["PER", "DEX"],
		trading: ["INT", "CHA"],
		weapon: ["CR"],
	},

	dynamismModes: [],

	dynamismModesSpecificBreakdowns: {
		"attack": ['ranged', 'close', 'area'],
		"illusion": ['illusion'],
		"influence": ['influence'],
		"kinetic": ['kinetic'],
		"manifest": ['create', 'dematerialize'],
		"manipulate": ['health', 'skill', 'attribute', 'protection', 'minortransform', 'majortransform', 'completetransform'],
		"sensory": ['perception', 'locate', 'scry', 'obscure'],
		"shield": ['aura', 'barrier', 'ward', 'curse']
,	}
}

HELLAS.attributes = Object.keys(HELLAS.attributesWShortName)
HELLAS.skillsWSpecifics = Object.keys(HELLAS.skillSpecificsBreakdown)
HELLAS.skills = Object.keys(HELLAS.skillWAssocAttributes)
HELLAS.dynamismModes = Object.keys(HELLAS.dynamismModesSpecificBreakdowns)
HELLAS.skillSpecificsBreakdown["mode"] = HELLAS.dynamismModes

export { HELLAS }
