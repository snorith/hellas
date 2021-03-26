import {isEmptyOrSpaces} from "../settings"

export type DynamismItemDataType = {
	version: number,
	notes: string,
	skillid: string,			// the skill that this is based off of
	dod: number,				// degree of difficulty
	range: "",					// range of this dynamism
	tradition: "",				// what dynamism traditions this is part of
	duration: ""				// how long it lasts for
}

export type DynamismItemType = {
	_id: string,
	name: string,
	img: string,
	type, string,
	data: HellasDynamismItem
}

export type DynamismMemoryType = {
	item: Item,
	data: DynamismItemType
}

export const DEFAULT_DYNAMISM_SKILLID = 'dynamism'
export const DEFAULT_DYNAMISM_IMG = 'icons/svg/lightning.svg'

export class HellasDynamismItem extends Item {
	static get type() {
		return "dynamism";
	}

	/**
	 * Create a new entity using provided input data
	 * @override
	 */
	static async create(data, options = {}) {
		data.img = data.img || DEFAULT_DYNAMISM_IMG;
		return super.create(data, options);
	}

	prepareData() {
		// Override common default icon
		if (!this.data.img) this.data.img = DEFAULT_DYNAMISM_IMG;
		super.prepareData();

		const itemData = (this.data.data || {}) as unknown as DynamismItemDataType

		if (isEmptyOrSpaces(this.data.name))
			this.data.name = game.i18n.localize("HELLAS.item.dynamism.new")

		// @ts-ignore
		itemData.name = this.data.name
		// @ts-ignore
		this.data.name = itemData.name

		itemData.skillid = itemData.skillid || DEFAULT_DYNAMISM_SKILLID

		if (!this.actor) {
			// if we don't belong to an actor, then default the 'skillid'
			if (itemData.skillid !== DEFAULT_DYNAMISM_SKILLID) {
				const changeData = {
					_id: this._id,
					data: {
						"skillid": DEFAULT_DYNAMISM_SKILLID
					}
				}
				this.update(changeData).catch(reason => console.log(reason))
			}
		}
	}
}
