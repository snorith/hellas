import {isEmptyOrSpaces} from "../settings"

export type TalentItemDataType = {
	version: number,
	notes: string,
	desc: string,			// description
	benefit: string			// the talent's benefits
}

export type TalentItemType = {
	_id: string,
	name: string,
	img: string,
	type, string,
	data: TalentItemDataType
}

export type TalentMemoryType = {
	item: Item,
	data: TalentItemType
}

export const DEFAULT_TALENT_IMG = 'icons/svg/sun.svg'

export class HellasTalentItem extends Item {
	static get type() {
		return "talent";
	}

	/**
	 * Create a new entity using provided input data
	 * @override
	 */
	static async create(data, options = {}) {
		data.img = data.img || DEFAULT_TALENT_IMG;
		return super.create(data, options);
	}

	prepareData() {
		// Override common default icon
		if (!this.data.img) this.data.img = DEFAULT_TALENT_IMG;
		super.prepareData();

		const itemData = (this.data.data || {}) as unknown as TalentItemDataType

		if (isEmptyOrSpaces(this.data.name))
			this.data.name = game.i18n.localize("HELLAS.item.talent.new")

		// @ts-ignore
		itemData.name = this.data.name
		// @ts-ignore
		this.data.name = itemData.name
	}
}
