import {isEmptyOrSpaces} from "../settings"

export type ArmorItemDataType = {
	version: number,
	notes: string,
	price: number,				// price
	str: number					// strength penalty, -1 roll modifier penalty to DEX and any DEX modified skills for each point that the character's STR falls short of this armor's minimum STR requirement
	per: number,				// perception modifier, helmets can block peripheral vision for example
	cha: 0,						// charm modifier, wearing visible armor can hinder social interactions, while stylish clothing can enhance it
	parry: 0,					// parry skill modifier while using this shield
	pr: 0,						// protection rating (PR), damage soak amount
	wt: 0,						// weight
	md: 0,						// maximum damage in a single attack before parry modifier reduced
	type: string,				// clothing, cuirass, helmet, shield, drone etc..
	modifier: string			// regular, energy, aether
	active: boolean				// is currently being used by the character
}

export type ArmorItemType = {
	_id: string,
	name: string,
	img: string,
	type, string,
	data: ArmorItemDataType
}

export type ArmorMemoryType = {
	item: Item,
	data: ArmorItemType
}

export const DEFAULT_WEAPON_SKILLID = 'combatrating'
export const DEFAULT_ARMOR_IMG = 'icons/svg/shield.svg.svg'

export class HellasArmorItem extends Item {
	static get type() {
		return "armor";
	}

	/**
	 * Create a new entity using provided input data
	 * @override
	 */
	static async create(data, options = {}) {
		data.img = data.img || DEFAULT_ARMOR_IMG;
		return super.create(data, options);
	}

	prepareData() {
		// Override common default icon
		if (!this.data.img) this.data.img = DEFAULT_ARMOR_IMG;
		super.prepareData();

		const itemData = (this.data.data || {}) as unknown as ArmorItemDataType

		if (isEmptyOrSpaces(this.data.name))
			this.data.name = game.i18n.localize("HELLAS.item.armor.new")

		// @ts-ignore
		itemData.name = this.data.name
		// @ts-ignore
		this.data.name = itemData.name

		if (!this.actor) {
		}
	}
}
