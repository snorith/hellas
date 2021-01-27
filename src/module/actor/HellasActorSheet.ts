/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
import {systemBasePath, systemName} from "../settings"

export class HellasActorSheet extends ActorSheet {

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["hellas", "sheet", "actor"],
			width: 925,
			height: 1000,
			tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
	}

	/**
	 * Get the correct HTML template path to use for rendering this particular sheet
	 * @type {String}
	 */
	get template() {
		return `${systemBasePath}/templates/actor/actorSheet.hbs`;
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		const sheetData = super.getData();
		// @ts-ignore
		sheetData.dtypes = ["String", "Number", "Boolean"];

		// Prepare items.
		if (this.actor.data.type == 'character') {
			this._prepareCharacterItems(sheetData);
		}

		return sheetData;
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param sheetData
	 * @return {undefined}
	 */
	_prepareCharacterItems(sheetData: ActorSheet.Data<any>) {
		// @ts-ignore
		sheetData.data.items = sheetData.actor.items || {};
	}
}
