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

/* ------------------------------------ */
/* Initialize system					*/
/* ------------------------------------ */
Hooks.once('init', async function() {
	console.log('Hellas | Initializing hellas');

	// Assign custom classes and constants here
	game.hellas = {
		HellasActor,
		HellasActorSheet,
	}

	game.HELLAS = HELLAS

	// define custom entity classes
	// @ts-ignore
	CONFIG.Actor.entityClass = HellasActor

	// @ts-ignore
	Actors.unregisterSheet("core", ActorSheet)
	// @ts-ignore
	Actors.registerSheet(systemName, HellasActorSheet, { makeDefault: true })

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
