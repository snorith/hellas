import {systemBasePath} from "./settings"

export const preloadTemplates = async function() {
	const templatePaths = [
		// Add paths to "systems/hellas/templates"

		// Actor Sheets
		`${systemBasePath}/templates/actor/actorSheet.hbs`,

		//Item sheets
		`${systemBasePath}/templates/item/skillSheet.hbs`,

		// Roll modifier
		`${systemBasePath}/templates/roll/modifiers.hbs`,
	];

	return loadTemplates(templatePaths);
}
