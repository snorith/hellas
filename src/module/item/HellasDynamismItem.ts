import {isEmptyOrSpaces, systemBasePath} from "../settings"
import {getRollModifiers, multipleActionPenalty} from "../dialog/modifiers"
import {HellasSkillItem, SkillItemType} from "./HellasSkillItem"
import {determineDieRollOutcome} from "../dice"
import {DEFAULT_WEAPON_SKILLID, WeaponItemDataType, WeaponItemType} from "./HellasWeaponItem"

export type DynamismItemDataType = {
	version: number,
	notes: string,
	skillid: string,			// the skill that this is based off of
	dod: number,				// degree of difficulty
	dodinfo: string,			// how the dod breaks down
	range: "",					// range of this dynamism
	tradition: "",				// what dynamism traditions this is part of
	duration: ""				// how long it lasts for
}

export type DynamismItemType = {
	_id: string,
	name: string,
	img: string,
	type, string,
	data: DynamismItemDataType
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

	/**
	 * Handle clickable rolls.
	 */
	async roll(): Promise<boolean> {
		if (!this.actor)
			return false

		const actorData = this.actor.data.data as any
		const item = this.data as unknown as DynamismItemType
		const itemData = item.data || {} as DynamismItemDataType
		const dod = itemData.dod

		// get modifier data
		const modifiers = await getRollModifiers(0, dod)
		if (modifiers.discriminator == "cancelled")
			return false

		let baseLevel = 0
		let skillName = ''
		if (itemData.skillid === DEFAULT_DYNAMISM_SKILLID) {
			baseLevel = actorData.attributes[DEFAULT_DYNAMISM_SKILLID].value
			skillName = game.i18n.localize(`HELLAS.attributes.${DEFAULT_DYNAMISM_SKILLID}.name`)
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
			multipleactionspenalty: multipleActionPenalty(modifiers.multipleactionscount, actorData.attributes.speed.value),
			baseLevel
		}, modifiers as any)

		const roll = new Roll('d20 + @baseLevel + @dod + @nonproficiency + @multipleactionspenalty + @modifier', rollData).roll()
		const outcome = determineDieRollOutcome( roll.total )

		const template = `${systemBasePath}/templates/chat/dynamismroll.hbs`
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
