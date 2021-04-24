/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import {HELLAS, SPECIFY_SUBTYPE} from "../config"
import {getRollModifiers, multipleActionPenalty} from "../dialog/modifiers"
import {determineDieRollOutcome} from "../dice"
import {systemBasePath} from "../settings"
import {HellasSkillItem, SkillItemType} from "../item/HellasSkillItem"
import {sortItemsByNameFunction} from "./HellasActorSheet"

export type initiativeT = 'first' | 'following'

export class HellasActor extends Actor {
	prepareData() {
		super.prepareData();

		const actorData = this.data
		const data = actorData.data

		if (actorData.type == 'character')
			this._prepareCharacterData(actorData)
	}

	/**
	 * Calculate derived values
	 *
	 * @param actorData
	 */
	_prepareCharacterData(actorData: Actor.Data<any>) {
		const data = actorData.data

		this.data['HELLAS'] = HELLAS
		this.data['SPECIFY_SUBTYPE'] = SPECIFY_SUBTYPE
	}

	/**
	 * Roll initiative for the character, either first round initiative or following round
	 * initiative (as they may have different modifiers)
	 *
	 * @param initiative 'first' || 'following' round initiative
	 */
	async initiativeRoll(initiative: initiativeT): Promise<boolean> {
		const actorData = this.data.data as any

		let modifier = 0;
		if (actorData.initiative?.modifiers?.hasOwnProperty(initiative)) {
			modifier = actorData.initiative?.modifiers[initiative]
		}

		const speedAttr = actorData.attributes.speed

		const rollData = {
			modifier,
			speedAttr
		}

		const roll = new Roll('d20 + @speedAttr.value + @modifier', rollData).roll()
		const outcome = roll.total

		const template = `${systemBasePath}/templates/chat/initiativeroll.hbs`
		const html = await renderTemplate(template, {
			initiative,
			outcome: outcome,
			data: rollData,
		})

		await roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: this }),
			flavor: html
		}, {rollMode: CONFIG.Dice.rollModes.PUBLIC})

		return true
	}

	/**
	 * Handle clickable attr rolls.
	 */
	async attrRoll(attribute: string, rating: number): Promise<boolean> {
		const actorData = this.data.data as any

		let modifier = 0;
		if (actorData.modifiers?.armor?.hasOwnProperty(attribute)) {
			modifier = actorData.modifiers?.armor[attribute]
		}

		// get modifier data
		const modifiers = await getRollModifiers(modifier)
		if (modifiers.discriminator == "cancelled")
			return false

		const rollData = mergeObject({
			multipleactionspenalty: multipleActionPenalty(modifiers.multipleactionscount, actorData.attributes.speed.value),
			attribute: actorData.attributes[attribute]
		}, modifiers as any)

		const roll = new Roll('d20 + @attribute.value + @dod + @nonproficiency + @multipleactionspenalty + @modifier', rollData).roll()
		const outcome = determineDieRollOutcome( roll.total )

		const template = `${systemBasePath}/templates/chat/attributeroll.hbs`
		const html = await renderTemplate(template, {
			name: attribute,
			outcome: outcome,
			data: rollData,
		})

		await roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: this }),
			flavor: html
		}, {rollMode: CONFIG.Dice.rollModes.PUBLIC})

		return true
	}

	/**
	 * Get a list of skills whose skillid begins with a prefix
	 *
	 * @param {string} prefix
	 * @returns {HellasSkillItem[]}
	 */
	getSkillsBySkillIDPrefix(prefix) {
		const items = this.data.items as any
		const skills = items.filter(i => i.type === HellasSkillItem.type && i.data?.skillid?.startsWith(prefix)).sort(sortItemsByNameFunction)

		return skills
	}
}
