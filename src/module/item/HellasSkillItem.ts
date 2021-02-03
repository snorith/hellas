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

		if (!data.skill)
			data.skill = HELLAS.skills[0]

		if (HELLAS.skillsWSpecifics.includes(data.skill)) {
			const specifiers = HELLAS.skillSpecificsBreakdown[data.skill]

			if (!specifiers.includes(data.specifier) && specifiers.length > 0) {
				data.specifier = specifiers[0]
			}

			if (data.specifier !== SPECIFY_SUBTYPE) {
				data.specifierCustom = ''
			}
		}
		else {
			data.specifier = ''
			data.specifierCustom = ''
		}
	}

	fullName(): string {
		// @ts-ignore
		const skillName = this.data.data.skill || ''

		if (isEmptyOrSpaces(skillName)) {
			return game.i18n.localize("HELLAS.item.skill.newSkill")
		}

		let name = game.i18n.localize("HELLAS.skills." + skillName + ".name")

		if (!HELLAS.skillsWSpecifics.includes(skillName)) {
			return name
		}

		// @ts-ignore
		let specifier = this.data.data.specifier || ''
		// @ts-ignore
		const specifierCustom = this.data.data.specifierCustom || ''

		if (SPECIFY_SUBTYPE === specifier && !isEmptyOrSpaces(specifierCustom)) {
			return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: name, specifier: specifierCustom})
		}
		else if (!isEmptyOrSpaces(specifier)) {
			specifier = game.i18n.localize("HELLAS.skills.specifics." + specifier)
			return game.i18n.format("HELLAS.item.skill.name.combiner", { skill: name, specifier: specifier})
		}

		return name
	}
}

