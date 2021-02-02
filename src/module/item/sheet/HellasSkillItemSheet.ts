import {systemBasePath} from "../../settings"
import {HellasSkillItem, SkillItemType, SkillMemoryType} from "../HellasSkillItem"
import {HELLAS} from "../../config"

export class HellasSkillItemSheet extends ItemSheet {
	/**
	 * Define default rendering options for the ability sheet
	 * @return {Object}
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["hellas", "sheet", "item"],
			width: 550,
			height: 620,
			tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes"}]
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
		return HellasSkillItem.type;
	}

	// @ts-ignore
	getData() {
		const sheet = super.getData() as unknown as SkillMemoryType

		if (sheet.data.skill) {
			sheet.item['attributesList'] = HELLAS.skillWAssocLongAttributes[sheet.data.skill]

			if (HELLAS.skillsWSpecifics.includes(sheet.data.skill))
				sheet.item['skillSpecifics'] = HELLAS.skillSpecificsBreakdown[sheet.data.skill]
			else {
				sheet.data.specifier = ''
				sheet.data.specifierCustom = ''

				sheet.item['skillSpecifics'] = []
			}
		}
		else {
			sheet.data.specifier = ''
			sheet.data.specifierCustom = ''

			sheet.item['attributesList'] = []
			sheet.item['skillSpecifics'] = []
		}

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
