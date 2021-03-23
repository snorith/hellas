/**
 * Hellas RPG
 *
 * Author: Stephen Smith
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: The MIT License (MIT)
 */

// Import TypeScript modules
import {registerSettings, systemName} from './module/settings.js';
import {preloadTemplates} from './module/preloadTemplates.js';
import {HellasActor} from "./module/actor/HellasActor"
import {HellasActorSheet} from "./module/actor/HellasActorSheet"
import {HELLAS} from "./module/config"
import {HellasSkillItem} from "./module/item/HellasSkillItem"
import {HellasItem} from "./module/item/HellasItem"
import {HellasSkillItemSheet} from "./module/item/sheet/HellasSkillItemSheet"
import {HellasWeaponItem} from "./module/item/HellasWeaponItem"
import {HellasWeaponItemSheet} from "./module/item/sheet/HellasWeaponItemSheet"
import {HellasArmorItemSheet} from "./module/item/sheet/HellasArmorItemSheet"
import {HellasArmorItem} from "./module/item/HellasArmorItem"

/* ------------------------------------ */
/* Initialize system					*/
/* ------------------------------------ */
Hooks.once('init', async function() {
	console.log('Hellas | Initializing hellas');

	// Assign custom classes and constants here
	game.hellas = {
		HellasActor,
		HellasActorSheet,
		HellasItem,
		HellasSkillAbilityItem: HellasSkillItem,
		HellasWeaponItem: HellasWeaponItem
	}

	game.HELLAS = HELLAS

	// define custom entity classes
	// @ts-ignore
	CONFIG.Actor.entityClass = HellasActor
	// @ts-ignore
	CONFIG.Item.entityClass = HellasItem

	// @ts-ignore
	Actors.unregisterSheet("core", ActorSheet)
	// @ts-ignore
	Actors.registerSheet(systemName, HellasActorSheet, { makeDefault: true })

	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet(systemName, HellasSkillItemSheet, { types: [HellasSkillItem.type], makeDefault: true, label: "Hellas Skill" });
	Items.registerSheet(systemName, HellasWeaponItemSheet, { types: [HellasWeaponItem.type], makeDefault: true, label: "Hellas Weapon" });
	Items.registerSheet(systemName, HellasArmorItemSheet, { types: [HellasArmorItem.type], makeDefault: true, label: "Hellas Armor" });

	// Register custom system settings
	registerSettings();

	// Preload Handlebars templates
	await preloadTemplates();

	// Register custom sheets (if any)
});

/* ------------------------------------ */
/* Setup system							*/
/* ------------------------------------ */
Hooks.once('setup', function() {
	// Do anything after initialization but before
	// ready
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function() {
	// Do anything once the system is ready
});

// Add any additional hooks if necessary
