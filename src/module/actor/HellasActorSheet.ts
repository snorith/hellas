/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
import {isEmptyOrSpaces, systemBasePath, systemName} from "../settings"
import {foundryAttributeValueMax, HELLAS, SPECIFY_SUBTYPE} from "../config"
import set from "lodash-es/set"
import {HellasSkillItem, SkillItemType} from "../item/HellasSkillItem"

// short skills
const sortSkillsByFullnameFunction = (a, b) => a.data.fullname < b.data.fullname ? -1 : a.data.fullname > b.data.fullname ? 1 : 0;

function fullName(item: Item): string {
	switch (item.type) {
		case HellasSkillItem.type:
			let skill = item as unknown as SkillItemType;

			let name = skill.name
			const specifier = skill.data.specifier
			const specifierCustom = skill.data.specifierCustom

			if (SPECIFY_SUBTYPE === specifier) {
				if (!isEmptyOrSpaces(specifierCustom))
					name = `${name} ${specifierCustom}`
			}
			else if (!isEmptyOrSpaces(specifier))
				name = `${name} ${specifier}`

			return name
		default:
			break
	}

	return ''
}

export class HellasActorSheet extends ActorSheet {

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["hellas", "sheet", "actor"],
			width: 925,
			height: 1000,
			tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes"}]
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

		// @ts-ignore
		const items = sheetData.data.items;

		// filter out skills and sort them
		Object.entries({
			skills: HellasSkillItem.type
		}).forEach(([val, type]) => {
			// @ts-ignore
			if (!sheetData.data.items[val])
			{
				sheetData.data.items[val] = items.filter(i => i.type === type).map(i => {
					i.data['fullname'] = fullName(i)
					return i
				}).sort(sortSkillsByFullnameFunction)
			}
		});
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Add Item
		html.find('.item-create').click(this._onItemCreate.bind(this));
		// Update Item
		html.find('.item-edit').click(this._onItemEdit.bind(this));
		// Delete Item
		html.find('.item-delete').click(this._onDeleteItem.bind(this));

		// Heal all wounds by one
		html.find('.fate-progress').click(this._onFateProgressClick.bind(this))
	}

	/**
	 * Handle adding or removing fate points from the character sheet
	 * @param event
	 */
	_onFateProgressClick(event) {
		event.preventDefault();

		const element = event.currentTarget
		const fpCount = parseInt(element.dataset.itemId)

		if (isNaN(fpCount))
			return false

		const data = set({}, "data.attributes.fatepoints.value", fpCount)

		this.actor.update(data)
		this.render(false)

		return false
	}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onItemCreate(event) {
		event.preventDefault();

		const element = event.currentTarget;
		// Get the type of item to create.
		const type = element.dataset.type;
		// Grab any data associated with this control.
		const data = duplicate(element.dataset);
		// Initialize a default name.
		const name = `New ${type.capitalize()}`;
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			data: data
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.data["type"];

		// Finally, create the item!
		return this.actor.createOwnedItem(itemData);
	}

	/**
	 * Handle editing an Owned Item
	 * @param event
	 */
	_onItemEdit(event) {
		event.preventDefault()

		const td = $(event.currentTarget).parents(".item");
		const item = this.actor.getOwnedItem(td.data("itemId"));
		item.sheet.render(true);

		return false
	}

	/**
	 * Handle deleting an Owned Item
	 * @param event
	 */
	_onDeleteItem(event) {
		event.preventDefault()

		if (window.confirm('Delete the item?')) {
			const td = $(event.currentTarget).parents(".item");
			this.actor.deleteOwnedItem(td.data("itemId"));
			td.slideUp(200, () => this.render(false));
		}

		return false
	}
}
