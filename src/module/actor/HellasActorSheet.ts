/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
import {systemBasePath} from "../settings"
import {foundryAttributeValueMax, HELLAS} from "../config"
import {HellasSkillItem} from "../item/HellasSkillItem"
import {HellasActor} from "./HellasActor"
import {HellasWeaponItem} from "../item/HellasWeaponItem"
import {ArmorItemDataType, HellasArmorItem} from "../item/HellasArmorItem"

export const sortItemsByNameFunction = (a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0

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
			skills: HellasSkillItem.type,
			weapons: HellasWeaponItem.type,
			armor: HellasArmorItem.type
		}).forEach(([val, type]) => {
			// @ts-ignore
			if (!sheetData.data.items[val])
			{
				sheetData.data.items[val] = items.filter(i => i.type === type).sort(sortItemsByNameFunction)
			}
		});

		// total armor PR
		sheetData.data.totalpr = sheetData.data.items['armor'].reduce((acc: number, curr: HellasWeaponItem) => {
			const data = curr.data as unknown as ArmorItemDataType
			if (data.active)
				return acc + data.pr
			return acc
		}, 0)
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html)

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return

		// Tooltips
		html.find('.tooltip').tooltipster({
			interactive: true,
			plugins: ['sideTip', 'scrollableTip']
		})

		// Add Item
		html.find('.item-create').click(this._onItemCreate.bind(this))
		// Update Item
		html.find('.item-edit').click(this._onItemEdit.bind(this))
		// Delete Item
		html.find('.item-delete').click(this._onDeleteItem.bind(this))

		// Fate point display
		html.find('.fate-progress').click(this._onFateProgressClick.bind(this))

		// roll an attribute
		html.find('.attr-roll').click(this._onAttrRoll.bind(this))

		// roll a skill
		html.find('.skill-roll').click(this._onSkillRoll.bind(this))

		// roll a weapon
		html.find('.weapon-roll').click(this._onWeaponRoll.bind(this))

		// active/deactivate a piece of armor
		html.find('.armor-active-checkbox').click(this._onArmorActiveClick.bind(this))
	}

	_onArmorActiveClick(event) {
		event.preventDefault()

		const element = event.currentTarget
		const itemID = element.dataset.itemId

		const item = this.actor.getOwnedItem(itemID) as HellasArmorItem
		if (!item)
			return false

		item.toggleActive()
	}

	_onAttrRoll(event) {
		event.preventDefault()

		const element = event.currentTarget
		const attribute = element.dataset.itemId
		const rating = parseInt(element.dataset.rating)

		const actor = this.actor as HellasActor

		actor.attrRoll(attribute, rating).catch(reason => console.log(reason))

		return false
	}

	_onSkillRoll(event) {
		event.preventDefault()

		const element = event.currentTarget
		const itemID = element.dataset.itemId

		const item = this.actor.getOwnedItem(itemID) as HellasSkillItem
		if (!item)
			return false

		item.roll().catch(reason => console.log(reason))

		return false
	}

	_onWeaponRoll(event) {
		event.preventDefault()

		const element = event.currentTarget
		const itemID = element.dataset.itemId

		const item = this.actor.getOwnedItem(itemID) as HellasWeaponItem
		if (!item)
			return false

		item.roll().catch(reason => console.log(reason))

		return false
	}

	/**
	 * Handle adding or removing fate points from the character sheet
	 * @param event
	 */
	_onFateProgressClick(event) {
		event.preventDefault()

		const element = event.currentTarget
		const fpCount = parseInt(element.dataset.itemId)

		if (isNaN(fpCount))
			return false

		// @ts-ignore
		this.actor.data.data.attributes.fatepoints.value = fpCount
		this.render(false)

		return false
	}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onItemCreate(event) {
		event.preventDefault()

		const element = event.currentTarget
		// Get the type of item to create.
		const type = element.dataset.type
		// Grab any data associated with this control.
		const data = duplicate(element.dataset)

		// Initialize a default name.
		const name = game.i18n.localize(`HELLAS.item.${type}.new`)
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			data: data,
		}
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.data["type"]

		// Finally, create the item!
		return this.actor.createOwnedItem(itemData)
	}

	/**
	 * Handle editing an Owned Item
	 * @param event
	 */
	_onItemEdit(event) {
		event.preventDefault()

		const td = $(event.currentTarget).parents(".item")
		const item = this.actor.getOwnedItem(td.data("itemId"))
		item.sheet.render(true)

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
