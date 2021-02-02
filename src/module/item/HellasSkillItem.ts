import {foundryAttributeValueMax, HELLAS, SPECIFY_SUBTYPE} from "../config"
import {isEmptyOrSpaces} from "../settings"
import {fullName} from "./HellasItem"

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

        let itemData = this.data as any;
        if (itemData.hasOwnProperty("data"))
            itemData = itemData.data;

        // this.data.name = fullName(this) || game.i18n.localize("HELLAS.item.skill.newSkill");
        // itemData.name = this.data.name

        this.data['HELLAS'] = HELLAS						// this is being set on the item itself that the handlebars template sees
		this.data['SPECIFY_SUBTYPE'] = SPECIFY_SUBTYPE		// this is being set on the item itself that the handlebars template sees
    }
}

