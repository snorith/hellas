import {systemBasePath} from "./settings"

export const preloadTemplates = async function() {
	const templatePaths = [
		// Add paths to "systems/hellas/templates"

		// Actor Sheets
		`${systemBasePath}/templates/actor/actorSheet.hbs`,

		//Item sheets
		`${systemBasePath}/templates/item/skillSheet.hbs`,
		`${systemBasePath}/templates/item/weaponSheet.hbs`,
		`${systemBasePath}/templates/item/armorSheet.hbs`,

		// Roll modifier
		`${systemBasePath}/templates/dialog/modifiers.hbs`,

		// Skill roll chat template
		`${systemBasePath}/templates/chat/skillroll.hbs`,

		// Attribute roll chat template
		`${systemBasePath}/templates/chat/attributeroll.hbs`
	];

	return loadTemplates(templatePaths);
}
