import {isEmptyOrSpaces} from "../settings"

export type WeaponItemDataType = {
	version: number,
	notes: string,
	skillid: string,				// attribute used when rolling to hit
	acc: number,				// accuracy modifier on roll to hit
	dr: number,					// damage rating -- minimum damage done
	wt: number,					// weight
	rof: number,				// rate of fire
	price: number,				// price
	str: number,				// strength penalty (pg 206 of core book, -2 roll modifier penalty for each point that the character's STR falls short of this weapon's minimum STR requirement, missile weapons suffer -4 roll modifier per point)
	ammo: string,				// type of ammo (if slug thrower)
	rng: string,				// range (if ranged weapon)
	modifier: string			// type of weapon (aether, flame, sonic etc...)
}

export type WeaponItemType = {
	_id: string,
	name: string,
	img: string,
	type, string,
	data: WeaponItemDataType
}

export type WeaponMemoryType = {
	item: Item,
	data: WeaponItemType
}

export const DEFAULT_WEAPON_SKILLID = 'combatrating'

export class HellasWeaponItem extends Item {
	static get type() {
		return "weapon";
	}

	prepareData() {
		// Override common default icon
		if (!this.data.img) this.data.img = 'icons/svg/sword.svg';
		super.prepareData();

		const itemData = (this.data.data || {}) as unknown as WeaponItemDataType

		if (isEmptyOrSpaces(this.data.name))
			this.data.name = game.i18n.localize("HELLAS.item.weapon.newWeapon")

		// @ts-ignore
		itemData.name = this.data.name
		// @ts-ignore
		this.data.name = itemData.name

		itemData.skillid = itemData.skillid || DEFAULT_WEAPON_SKILLID

		if (!this.actor) {
			// if we don't belong to an actor, then default the 'skillid'
			if (itemData.skillid !== DEFAULT_WEAPON_SKILLID) {
				const changeData = {
					_id: this._id,
					data: {
						"skillid": DEFAULT_WEAPON_SKILLID
					}
				}
				this.update(changeData).catch(reason => console.log(reason))
			}
		}
	}
}
