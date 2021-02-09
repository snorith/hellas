/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import {HELLAS, SPECIFY_SUBTYPE} from "../config"
import {getRollModifiers} from "../dialog/modifiers"
import {determineDieRollOutcome} from "../dice"
import {systemBasePath} from "../settings"
import {SkillItemType} from "../item/HellasSkillItem"

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
	 * Handle clickable attr rolls.
	 */
	async attrRoll(attribute: string, rating: number): Promise<boolean> {
		// get modifier data
		const modifiers = await getRollModifiers()
		if (modifiers.discriminator == "cancelled")
			return false

		const actorData = this.data.data as any

		const rollData = mergeObject({
			speed: actorData.attributes.speed.value,
			spdused: modifiers.multipleactionscount > 0 ? 1 : 0,
			attribute: actorData.attributes[attribute]
		}, modifiers as any)

		const roll = new Roll('d20 + @attribute.value + @dod + @nonproficiency + ((@multipleactionscount * -5) + (@spdused * @speed)) + @modifier', rollData).roll()
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
}
