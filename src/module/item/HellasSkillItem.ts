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

		if (this.data)
        	this.data.name = this.fullName()
        // @ts-ignore
		itemData.name = this.data ? this.data.name : game.i18n.localize("HELLAS.item.skill.newSkill")
		// @ts-ignore
		const data = set({}, "name", itemData.name)
		this.update(data).catch(reason => console.log(reason))

        this.data['HELLAS'] = HELLAS						// this is being set on the item itself that the handlebars template sees
		this.data['SPECIFY_SUBTYPE'] = SPECIFY_SUBTYPE		// this is being set on the item itself that the handlebars template sees
    }

	fullName(): string {
		// @ts-ignore
		let skillName = this.data.data.skill || ''
		// @ts-ignore
		let specifier = this.data.data.specifier || ''
		// @ts-ignore
		const specifierCustom = this.data.data.specifierCustom || ''

		if (isEmptyOrSpaces(skillName)) {
			return game.i18n.localize("HELLAS.item.skill.newSkill")
		}
		else {
			skillName = game.i18n.localize("HELLAS.skills." + skillName + ".name")

			if (SPECIFY_SUBTYPE === specifier && !isEmptyOrSpaces(specifierCustom)) {
				skillName = `${skillName} ${specifierCustom}`
			}
			else if (!isEmptyOrSpaces(specifier)) {
				specifier = game.i18n.localize("HELLAS.skills.specifics." + specifier)
				skillName = `${skillName} ${specifier}`
			}
		}

		return skillName
	}
}

