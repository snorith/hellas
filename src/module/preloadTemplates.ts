import {systemBasePath} from "./settings"

export const preloadTemplates = async function() {
	const templatePaths = [
		// Add paths to "systems/hellas/templates"

		// Actor Sheets
		`${systemBasePath}/templates/actor/actorSheet.hbs`,

		//Item sheets
		`${systemBasePath}/templates/item/skillsSheet.hbs`,
	];

	return loadTemplates(templatePaths);
}
