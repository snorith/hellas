import {systemBasePath} from "../../settings"
import {HELLAS} from "../../config"
import {DynamismMemoryType, HellasDynamismItem} from "../HellasDynamismItem"
import {HellasActor} from "../../actor/HellasActor"

export class HellasDynamismItemSheet extends ItemSheet {
	/**
	 * Define default rendering options for the ability sheet
	 * @return {Object}
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["hellas", "sheet", "item"],
			width: 550,
			height: 620,
			tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "dynamism"}]
		});
	}

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/**
	 * Get the correct HTML template path to use for rendering this particular sheet
	 * @type {String}
	 */
	get template() {
		return `${systemBasePath}/templates/item/${this.type}Sheet.hbs`;
	}

	get type() {
		return HellasDynamismItem.type;
	}

	// @ts-ignore
	getData() {
		let sheet = super.getData() as unknown as DynamismMemoryType

		sheet.item['HELLAS'] = HELLAS
		if (this.actor)
			sheet.item['SKILLS'] = (this.actor as HellasActor).getSkillsBySkillIDPrefix("mode")
		else
			sheet.item['SKILLS'] = []

		return sheet
	}

	/** @override */
	setPosition(options = {}) {
		const position = super.setPosition(options);
		// @ts-ignore
		const sheetBody = this.element.find(".sheet-body")
		const bodyHeight = position.height - 192
		sheetBody?.css("height", bodyHeight)
		return position
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Roll handlers, click handlers, etc. would go here.
	}
}
