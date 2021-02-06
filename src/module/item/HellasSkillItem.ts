import {foundryAttributeValueMax, HELLAS, SPECIFY_SUBTYPE} from "../config"
import set from "lodash-es/set"
import {isEmptyOrSpaces, systemBasePath} from "../settings"
import {getRollModifiers} from "../dialog/modifiers"
import {determineDieRollOutcome} from "../dice"

export type SkillItemDataType = {
	version: number,
	skilltype: string,
	notes: string,
	skill: string,
	attribute: string,
	specifier: string,
	specifierCustom: string,
	level: foundryAttributeValueMax,
	firstTime: boolean
}

export type SkillItemType = {
	_id: string,
    name: string,
	img: string,
	type, string,
	data: SkillItemDataType
}

export type SkillMemoryType = {
	item: Item,
	data: SkillItemDataType
}

export class HellasSkillItem extends Item {
    static get type() {
        return "skill";
    }

    prepareData() {
        // Override common default icon
        if (!this.data.img) this.data.img = 'icons/svg/lightning.svg';
        super.prepareData();

		const itemData = this.data.data || {}

		// @ts-ignore
		if (isEmptyOrSpaces(itemData.skill || '')) {
			if (isEmptyOrSpaces(this.data.name))
				this.data.name = game.i18n.localize("HELLAS.item.skill.newSkill")
		}
        else {
			this.processSpecifiersForSkills()
			this.determineRating()
			this.data.name = this.fullName()
		}

        // @ts-ignore
		itemData.name = this.data.name
		// @ts-ignore
		const data = set({}, "name", itemData.name)

		if (this.actor)
			this.update(data).catch(reason => console.log(reason))

        this.data['HELLAS'] = HELLAS						// this is being set on the item itself that the handlebars template sees
		this.data['SPECIFY_SUBTYPE'] = SPECIFY_SUBTYPE		// this is being set on the item itself that the handlebars template sees
    }

    processSpecifiersForSkills() {
    	const data = this.data.data as SkillItemDataType
		let changes = {}

		if (!data.skill) {
			changes = set(changes, "data.skill", HELLAS.skills[0])
			data.skill = HELLAS.skills[0]
		}

		if (HELLAS.skillsWSpecifics.includes(data.skill)) {
			const specifiers = HELLAS.skillSpecificsBreakdown[data.skill]

			if (!specifiers.includes(data.specifier)) {
				changes = set(changes, "data.specifier", specifiers[0])
				data.specifier = specifiers[0]
			}

			if (data.skill === HELLAS.dynamismMode) {
				const types = HELLAS.dynamismModesSpecificBreakdowns[data.specifier]

				if (!types.includes(data.specifierCustom)) {
					changes = set(changes, "data.specifierCustom", types[0])
					data.specifierCustom = types[0]
				}
			}
			else if (data.specifier !== SPECIFY_SUBTYPE) {
				changes = set(changes, 'data.specifierCustom', '')
				data.specifierCustom = ''
			}
		}
		else {
			changes = set(changes, "data.specifier", '')
			changes = set(changes, "data.specifierCustom", '')
			data.specifier = ''
			data.specifierCustom = ''
		}

		if (isEmptyOrSpaces(data.attribute) || !HELLAS.skillWAssocShortAttributes[data.skill].includes(data.attribute)) {
			data.attribute = HELLAS.skillWAssocShortAttributes[data.skill][0]
			changes = set(changes, "data.attribute", data.attribute)
		}

		// `skilltype` is used to uniquely identify a skill based on the attribute/specifier/custom
		// this is used which skill to associate with a dynamism (spell) when defining them
		const skilltype = [data.skill, data.specifier, data.specifierCustom].join('.')
		data.skilltype = skilltype
		changes = set(changes, "data.skilltype", skilltype)

		if (this.actor)
			this.update(changes).catch(reason => console.log(reason))
	}

	determineRating() {
		const data = this.data.data as SkillItemDataType
		let changes = {}

    	if (!this.actor) {
			data.level.max = data.level.value
			changes = set(changes, "data.level.max", data.level.max)
		}
    	else {
			const actorData = this.actor.data.data
			const attribute = HELLAS.attributesShortToLong[data.attribute]
			// @ts-ignore
			const attributeValue = actorData.attributes[attribute]['value']

			data.level.max = data.level.value + attributeValue
			changes = set(changes, "data.level.max", data.level.max)

			// console.log('attribute = ' + attribute + ' attr level = ' + attributeValue + ' skill level = ' + data.level.value + ' rating = ' + data.level.max)
		}

		if (this.actor)
			this.update(changes).catch(reason => console.log(reason))
	}

	fullName(): string {
		// @ts-ignore
		const skillName = this.data.data.skill || ''

		if (isEmptyOrSpaces(skillName)) {
			return game.i18n.localize("HELLAS.item.skill.newSkill")
		}

		let workingil8nName = game.i18n.localize("HELLAS.skills." + skillName + ".name")

		if (!HELLAS.skillsWSpecifics.includes(skillName)) {
			return workingil8nName
		}

		// @ts-ignore
		let specifier = this.data.data.specifier || ''
		// @ts-ignore
		const specifierCustom = this.data.data.specifierCustom || ''

		if (skillName === HELLAS.dynamismMode) {
			workingil8nName = game.i18n.localize("HELLAS.skills.mode.short.name")

			const specifieril8nName = game.i18n.localize("HELLAS.skills.specifics." + specifier)
			if (specifierCustom === specifier)
				return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: workingil8nName, specifier: specifieril8nName})
			else {
				const typeil8nName = game.i18n.localize("HELLAS.skills.mode." + specifierCustom)
				return game.i18n.format("HELLAS.item.skill.name.combiner2", { skill: workingil8nName, specifier: specifieril8nName, type: typeil8nName})
			}
		}
		else {
			if (SPECIFY_SUBTYPE === specifier && !isEmptyOrSpaces(specifierCustom)) {
				return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: workingil8nName, specifier: specifierCustom})
			}
			else if (!isEmptyOrSpaces(specifier)) {
				const specifieril8nName = game.i18n.localize("HELLAS.skills.specifics." + specifier)
				return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: workingil8nName, specifier: specifieril8nName})
			}
		}

		return workingil8nName
	}

	/**
	 * Handle clickable rolls.
	 */
	async roll(): Promise<boolean> {
		if (!this.actor)
			return false

		// get modifier data
		const modifiers = await getRollModifiers()
		if (modifiers.discriminator == "cancelled")
			return false

		const actorData = this.actor.data.data as any
		const item = this.data as unknown as SkillItemType
		const itemData = item.data

		let rollData = mergeObject({
			speed: actorData.attributes.speed.value,
			spdused: modifiers.multipleactionscount > 0 ? 1 : 0
		}, modifiers as any)
		rollData = mergeObject(rollData, itemData)

		const roll = new Roll('d20 + @level.max + @dod + @nonproficiency + ((@multipleactionscount * -5) + (@spdused * @speed)) + @modifier', rollData).roll()
		const outcome = determineDieRollOutcome( roll.total )

		const template = `${systemBasePath}/templates/chat/skillroll.hbs`
		const html = await renderTemplate(template, {
			name: item.name,
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

