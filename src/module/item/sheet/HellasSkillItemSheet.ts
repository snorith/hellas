import {systemBasePath} from "../../settings"
import {HellasSkillItem, SkillMemoryType} from "../HellasSkillItem"
import {HELLAS, SPECIFY_SUBTYPE} from "../../config"

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
			tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skill"}]
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
		let sheet = super.getData() as unknown as SkillMemoryType

		// determine whether, based on the skill, there are optional specifics and which are the appropriate attributes
		sheet.item['SHORTATTRIBUTELIST'] = HELLAS.skillWAssocShortAttributes[sheet.data.skill]

		if (HELLAS.skillsWSpecifics.includes(sheet.data.skill)) {
			sheet.item['SKILLSPECIFICS'] = HELLAS.skillSpecificsBreakdown[sheet.data.skill]

			if (sheet.data.skill === HELLAS.dynamismMode) {
				if (!sheet.item['SKILLSPECIFICS'].includes(sheet.data.specifier)) {
					sheet.data.specifier = sheet.item['SKILLSPECIFICS'][0]
				}
				sheet.item['MODESPECIFICS'] = HELLAS.dynamismModesSpecificBreakdowns[sheet.data.specifier]
			}
			else {
				sheet.item['MODESPECIFICS'] = []
			}
		}
		else {
			sheet.item['MODESPECIFICS'] = []
			sheet.item['SKILLSPECIFICS'] = []
		}

		sheet.item['HELLAS'] = HELLAS						// this is being set on the item itself that the handlebars template sees
		sheet.item['SPECIFY_SUBTYPE'] = SPECIFY_SUBTYPE		// this is being set on the item itself that the handlebars template sees

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
