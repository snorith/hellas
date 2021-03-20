import {isEmptyOrSpaces, systemBasePath} from "../settings"
import {getRollModifiers} from "../dialog/modifiers"
import {determineDieRollOutcome} from "../dice"
import {HellasSkillItem, SkillItemType} from "./HellasSkillItem"

export type WeaponItemDataType = {
	version: number,
	notes: string,
	skillid: string,			// attribute used when rolling to hit
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
export const DEFAULT_WEAPON_IMG = 'icons/svg/sword.svg'

export class HellasWeaponItem extends Item {
	static get type() {
		return "weapon";
	}

	/**
	 * Create a new entity using provided input data
	 * @override
	 */
	static async create(data, options = {}) {
		data.img = DEFAULT_WEAPON_IMG;
		return super.create(data, options);
	}

	prepareData() {
		// Override common default icon
		if (!this.data.img) this.data.img = DEFAULT_WEAPON_IMG;
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

	/**
	 * Handle clickable rolls.
	 */
	async roll(): Promise<boolean> {
		if (!this.actor)
			return false

		const actorData = this.actor.data.data as any
		const item = this.data as unknown as WeaponItemType
		const itemData = item.data || {} as WeaponItemDataType

		let weaponRollingPenalty = 0
		/**
		 * Note that skills store their assigned level in `level.value`, then add their associated attribute with the result being
		 * `level.max`, while character attributes store their assigned level in `max` and then store modified rollable values in `value`
		 */
		const characterSTR = actorData.attributes.strength.value as number
		/**
		 * if a character's STR is less than the minimum required by the weapon to handle
		 * then the weapons suffers a (-2 * delta) penalty, if the weapon is a missile weapon then
		 * the penalty is (-4 * delta)
		 */
		if (characterSTR < itemData.str) {
			const delta = itemData.str - characterSTR
			let penalty = -2
			if (!isEmptyOrSpaces(itemData.rng))
				penalty = -4
			weaponRollingPenalty += delta * penalty
		}
		weaponRollingPenalty += itemData.acc

		// get modifier data
		const modifiers = await getRollModifiers(weaponRollingPenalty)
		if (modifiers.discriminator == "cancelled")
			return false

		let baseLevel = 0
		let skillName = ''
		if (itemData.skillid === DEFAULT_WEAPON_SKILLID) {
			baseLevel = actorData.attributes[DEFAULT_WEAPON_SKILLID].value
			skillName = game.i18n.localize(`HELLAS.attributes.${DEFAULT_WEAPON_SKILLID}.name`)
		}
		else {
			const skill = this.actor.getOwnedItem(itemData.skillid) as HellasSkillItem
			if (!skill) {
				ui.notifications.error(`No associated skill found for ${item.name}`)
				return false
			}
			const skillData = skill.data as unknown as SkillItemType
			baseLevel = skillData.data.level.max
			skillName = skillData.name
		}

		let rollData = mergeObject({
			speed: actorData.attributes.speed.value,
			spdused: modifiers.multipleactionscount > 0 ? 1 : 0,
			baseLevel
		}, modifiers as any)

		const roll = new Roll('d20 + @baseLevel + @dod + @nonproficiency + ((@multipleactionscount * -5) + (@spdused * @speed)) + @modifier', rollData).roll()
		const outcome = determineDieRollOutcome( roll.total )

		const template = `${systemBasePath}/templates/chat/weaponroll.hbs`
		const html = await renderTemplate(template, {
			name: this.name,
			skill: skillName,
			outcome: outcome,
			data: rollData,
		})

		await roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			flavor: html
		}, {rollMode: CONFIG.Dice.rollModes.PUBLIC})

		return true
	}
}
