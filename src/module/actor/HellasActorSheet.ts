/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
import {systemBasePath, systemName} from "../settings"
import {foundryAttributeValueMax, HELLAS} from "../config"

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
			this._prepareAttributes(sheetData)

			this._prepareCharacterItems(sheetData);
		}

		return sheetData;
	}

	_prepareAttributes(sheetData: ActorSheet.Data<any>) {
		for (let i = 0; i < HELLAS.characterAttributes.length ; i++) {
			const attribute = sheetData.data.attributes[HELLAS.characterAttributes[i]] as foundryAttributeValueMax
			if (!Number.isFinite(attribute.value)) {
				attribute.value = 0
			}
		}
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

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// // Add Inventory Item
		// html.find('.item-create').click(this._onItemCreate.bind(this));
		//
		// // Update Inventory Item
		// html.find('.item-edit').click(ev => {
		// 	const td = $(ev.currentTarget).parents(".item");
		// 	const item = this.actor.getOwnedItem(td.data("itemId"));
		// 	item.sheet.render(true);
		// });
		//
		// // Delete Inventory Item
		// html.find('.item-delete').click(ev => {
		// 	if (window.confirm('Delete the item?')) {
		// 		const td = $(ev.currentTarget).parents(".item");
		// 		this.actor.deleteOwnedItem(td.data("itemId"));
		// 		td.slideUp(200, () => this.render(false));
		// 	}
		// });

		// Heal all wounds by one
		html.find('.fate-progress').click(this._onFateProgressClick.bind(this))
	}

	_onFateProgressClick(event) {
		event.preventDefault();

		const element = event.currentTarget
		const index = parseInt(element.dataset.itemId)

		if (isNaN(index))
			return false

		// @ts-ignore
		const data = {
			data: {
				attributes: {
					fatepoints: {
						value: index
					}
				}
			}
		}

		this.actor.update(data)
		this.render(false)

		return false
	}
}
