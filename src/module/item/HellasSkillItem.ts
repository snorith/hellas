import {foundryAttributeValueMax, HELLAS, SPECIFY_SUBTYPE} from "../config"
import set from "lodash-es/set"
import {isEmptyOrSpaces} from "../settings"

export type SkillItemDataType = {
	version: number,
	notes: string,
	skill: string,
	attribute: string,
	specifier: string,
	specifierCustom: string,
	level: foundryAttributeValueMax,
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
		const newSkill = isEmptyOrSpaces(itemData.skill || '')
		this.processSpecifiersForSkills()
		if (newSkill)
			this.data.name = game.i18n.localize("HELLAS.item.skill.newSkill")
		else
        	this.data.name = this.fullName()

        // @ts-ignore
		itemData.name = this.data.name
		// @ts-ignore
		const data = set({}, "name", itemData.name)
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
				changes = set(changes, data.specifierCustom, '')
				data.specifierCustom = ''
			}
		}
		else {
			changes = set(changes, data.specifier, '')
			changes = set(changes, data.specifierCustom, '')
			data.specifier = ''
			data.specifierCustom = ''
		}

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
			if (!isEmptyOrSpaces(specifier)) {
				const specifics = HELLAS.skillSpecificsBreakdown[skillName]
				if (specifics && specifics.includes(specifier)) {
					const specifieril8nName = game.i18n.localize("HELLAS.skills.specifics." + specifier)

					const types = HELLAS.dynamismModesSpecificBreakdowns[specifier]
					if (types && types.includes(specifierCustom)) {
						const typeil8nName = game.i18n.localize("HELLAS.skills.mode." + specifierCustom)
						return game.i18n.format("HELLAS.item.skill.name.combiner2", { skill: workingil8nName, specifier: specifieril8nName, type: typeil8nName})
					}
					else {
						return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: workingil8nName, specifier: specifieril8nName})
					}
				}
				else {
					return workingil8nName
				}
			}
			else {
				return workingil8nName
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
}

