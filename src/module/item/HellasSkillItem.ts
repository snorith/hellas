import {foundryAttributeValueMax, HELLAS, SPECIFY_SUBTYPE} from "../config"
import {isEmptyOrSpaces} from "../settings"

export type SkillItemDataType = {
	name: string,
	version: number,
	notes: string,
	attribute: string,
	specifier: string,
	specifierCustom: string,
	level: foundryAttributeValueMax,
}

export type SkillItemType = {
    name: string,
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

        itemData.name = this.data.name || game.i18n.localize("HELLAS.item.skill.newSkill");
        itemData.HELLAS = HELLAS
    }
}
