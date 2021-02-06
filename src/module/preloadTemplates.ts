import {systemBasePath} from "./settings"

export const preloadTemplates = async function() {
	const templatePaths = [
		// Add paths to "systems/hellas/templates"

		// Actor Sheets
		`${systemBasePath}/templates/actor/actorSheet.hbs`,

		//Item sheets
		`${systemBasePath}/templates/item/skillSheet.hbs`,

		// Roll modifier
		`${systemBasePath}/templates/dialog/modifiers.hbs`,

		// Skill roll chat template
		`${systemBasePath}/templates/chat/skillroll.hbs`
	];

	return loadTemplates(templatePaths);
}
