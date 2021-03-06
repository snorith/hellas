import {foundryAttributeValueMax, HELLAS, SPECIFY_SUBTYPE} from "../config"
import set from "lodash-es/set"
import {isEmptyOrSpaces, systemBasePath} from "../settings"
import {getRollModifiers, multipleActionPenalty} from "../dialog/modifiers"
import {determineDieRollOutcome} from "../dice"

export type SkillItemDataType = {
	version: number,
	skillid: string,
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

const DEFAULT_SKILL_IMG = 'icons/svg/lightning.svg'

export class HellasSkillItem extends Item {
    static get type() {
        return "skill";
    }

	/**
	 * Create a new entity using provided input data
	 * @override
	 */
	static async create(data, options = {}) {
		data.img = data.img ||  DEFAULT_SKILL_IMG;
		return super.create(data, options);
	}

    prepareData() {
        // Override common default icon
        if (!this.data.img) this.data.img = DEFAULT_SKILL_IMG;
        super.prepareData();

		const itemData = this.data.data || {}

		// @ts-ignore
		if (isEmptyOrSpaces(itemData.skill || '')) {
			if (isEmptyOrSpaces(this.data.name))
				this.data.name = game.i18n.localize("HELLAS.item.skill.new")
		}
        else {
			this.processSpecifiersForSkills(itemData as SkillItemDataType)
			this.determineRating(itemData as SkillItemDataType)

			this.data.name = this.fullName()
		}

        // @ts-ignore
		itemData.name = this.data.name
		// @ts-ignore
		this.data.name = itemData.name

		// @ts-ignore
		if (this.name !== itemData.name) {
			const data = {
				_id: this._id,
				// @ts-ignore
				name: itemData.name
			}
			if (!!this.actor)
				this.actor.updateOwnedItem(data).catch(reason => console.log(reason))
			else
				this.update(data).catch(reason => console.log(reason))
		}
    }

    processSpecifiersForSkills(data: SkillItemDataType) {
		let changes = {
    		_id: this._id
		}

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

		// `skillid` is used to uniquely identify a skill based on the attribute/specifier/custom
		// this is used which skill to associate with a dynamism (spell) when defining them
		const skillid = [data.skill, data.specifier, data.specifierCustom].join('.')

		if (data.skillid !== skillid && !!this.actor) {
			data.skillid = skillid
			changes = set(changes, "data.skillid", skillid)
			this.actor.updateOwnedItem(changes).catch(reason => console.log(reason))
		}

		this.data.data = data
	}

	determineRating(data: SkillItemDataType) {
		let changes = {
			_id: this._id
		}

		let max = data.level.max

    	if (!this.actor) {
			max = data.level.value
		}
    	else {
			const actorData = this.actor.data.data
			const attribute = HELLAS.attributesShortToLong[data.attribute]
			// @ts-ignore
			const attributeValue = actorData.attributes[attribute]['value']
			max = data.level.value + attributeValue
		}

		if (data.level.max !== max) {
			data.level.max = max
			this.data.data = data

			if (!!this.actor) {
				changes = set(changes, "data.level.max", data.level.max)
				this.actor.updateOwnedItem(changes).catch(reason => console.log(reason))
			}
		}
		else
			this.data.data = data
	}

	fullName(): string {
		// @ts-ignore
		const skillName = this.data.data.skill || ''

		if (isEmptyOrSpaces(skillName)) {
			return game.i18n.localize("HELLAS.item.skill.new")
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
			if (specifierCustom === specifier || !this.actor)
				return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: workingil8nName, specifier: specifieril8nName})
			else {
				const typeil8nName = game.i18n.localize("HELLAS.skills.mode." + specifierCustom)
				return game.i18n.format("HELLAS.item.skill.name.combiner2", { skill: workingil8nName, specifier: specifieril8nName, type: typeil8nName})
			}
		}
		else {
			if (skillName === 'perform' && !this.actor) {
				return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: workingil8nName, specifier: game.i18n.localize("HELLAS.skills.specifics.specify")});
			}
			else if (HELLAS.skillSpecificsGetAll.includes(skillName) && !this.actor) {
				return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: workingil8nName, specifier: '*'});
			}
			else if (SPECIFY_SUBTYPE === specifier && !isEmptyOrSpaces(specifierCustom)) {
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

		const actorData = this.actor.data.data as any
		const item = this.data as unknown as SkillItemType
		const itemData = item.data

		let modifierOverall = 0
		// if we are rolling a 'parry' skill, check to see if there is
		// armor modifiers for parrying (from shields etc...)
		if (itemData.skill === 'parry') {
			modifierOverall = actorData.modifiers.armor.parry
		}
		// if we are rolling a skill whose attribute is modified by armor
		// then determine that modifier
		if (actorData.modifiers.armor.hasOwnProperty(HELLAS.attributesShortToLong[itemData.attribute])) {
			modifierOverall += actorData.modifiers.armor[HELLAS.attributesShortToLong[itemData.attribute]]
		}

		// get modifier data
		const modifiers = await getRollModifiers(modifierOverall)
		if (modifiers.discriminator == "cancelled")
			return false

		let rollData = mergeObject({
			multipleactionspenalty: multipleActionPenalty(modifiers.multipleactionscount, actorData.attributes.speed.value)
		}, modifiers as any)
		rollData = mergeObject(rollData, itemData)

		const roll = new Roll('d20 + @level.max + @dod + @nonproficiency + @multipleactionspenalty + @modifier', rollData).roll()
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

