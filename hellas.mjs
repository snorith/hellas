/**
 * HELLAS RPG system for Foundry VTT (v13/v14).
 *
 * Fan contributed support for the HELLAS RPG (2nd ed.) by Khepera Publishing.
 * Content License: text content from the HELLAS RPG is included under
 * arrangement with Khepera Publishing; all such text and images are copyright
 * of their respective owners. The HELLAS RPG is TM and © 2012 Khepera
 * Publishing. The Khepera Scarab and the HELLAS logo are ® Khepera Publishing.
 * Software License: MIT
 */

import { HELLAS, SYSTEM_ID } from "./module/config.mjs";
import CharacterData from "./module/data/character.mjs";
import SkillData from "./module/data/skill.mjs";
import WeaponData from "./module/data/weapon.mjs";
import ArmorData from "./module/data/armor.mjs";
import DynamismData from "./module/data/dynamism.mjs";
import TalentData from "./module/data/talent.mjs";
import HellasActor from "./module/documents/actor.mjs";
import HellasItem from "./module/documents/item.mjs";
import HellasItemSheet from "./module/sheets/item-sheet.mjs";
import HellasActorSheet from "./module/sheets/actor-sheet.mjs";
import TrademarkNotice from "./module/apps/trademark-notice.mjs";
import { migrateWorldIfNeeded } from "./module/migrations/world.mjs";

export { SYSTEM_ID };

/**
 * Combat-tracker initiative: SPD + first-round modifier, with SPD/100 as the
 * decimal tie-breaker (legacy formula preserved verbatim).
 */
export const INITIATIVE_FORMULA =
	"1d20 + @attributes.speed.value + @initiative.modifiers.first + (@attributes.speed.value / 100)";

Hooks.once("init", () => {
	console.log("Hellas | Initializing HELLAS system");

	CONFIG.HELLAS = HELLAS;

	CONFIG.Combat.initiative = {
		formula: INITIATIVE_FORMULA,
		decimals: 2
	};

	// Object.assign preserves the models' static properties (vs mergeObject).
	Object.assign(CONFIG.Actor.dataModels, {
		character: CharacterData
	});
	Object.assign(CONFIG.Item.dataModels, {
		skill: SkillData,
		weapon: WeaponData,
		armor: ArmorData,
		dynamism: DynamismData,
		talent: TalentData
	});

	CONFIG.Actor.documentClass = HellasActor;
	CONFIG.Item.documentClass = HellasItem;

	const { Actors, Items } = foundry.documents.collections;
	Actors.registerSheet(SYSTEM_ID, HellasActorSheet, {
		types: ["character"],
		makeDefault: true,
		label: "HELLAS.sheet.labels.actor"
	});
	Items.registerSheet(SYSTEM_ID, HellasItemSheet, {
		makeDefault: true,
		label: "HELLAS.sheet.labels.item"
	});

	game.settings.register(SYSTEM_ID, "systemMigrationVersion", {
		scope: "world",
		config: false,
		type: String,
		default: ""
	});

	game.settings.registerMenu(SYSTEM_ID, "trademarkNotice", {
		name: "HELLAS.settings.trademark.name",
		label: "HELLAS.settings.trademark.label",
		hint: "HELLAS.settings.trademark.hint",
		icon: "fas fa-scale-balanced",
		type: TrademarkNotice,
		restricted: false
	});
});

Hooks.once("ready", () => migrateWorldIfNeeded());

Hooks.once("setup", () => {
	// Preload roll-flow templates (F15 — the legacy list was incomplete).
	foundry.applications.handlebars.loadTemplates([
		"systems/hellas/templates/dialog/modifiers.hbs",
		"systems/hellas/templates/chat/attributeroll.hbs",
		"systems/hellas/templates/chat/skillroll.hbs",
		"systems/hellas/templates/chat/weaponroll.hbs",
		"systems/hellas/templates/chat/dynamismroll.hbs",
		"systems/hellas/templates/chat/initiativeroll.hbs",
		"systems/hellas/templates/actor/tooltips/skill.hbs",
		"systems/hellas/templates/actor/tooltips/weapon.hbs",
		"systems/hellas/templates/actor/tooltips/armor.hbs",
		"systems/hellas/templates/actor/tooltips/dynamism.hbs",
		"systems/hellas/templates/actor/tooltips/talent.hbs",
		"systems/hellas/templates/actor/tooltips/xp.hbs",
		"systems/hellas/templates/actor/tooltips/heropoints.hbs"
	]);
});
