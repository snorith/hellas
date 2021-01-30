
export type SkillAbilityItemType = {
    name: string,
    price: number,
    notes: string,
    rank: string,
    benefit: string,
    data: any
}

export class HellasSkillItem extends Item {
    static get type() {
        return "skill";
    }

    prepareData() {
        // Override common default icon
        if (!this.data.img) this.data.img = 'icons/svg/lightning.svg';
        super.prepareData();

        let itemData = this.data as unknown as SkillAbilityItemType;
        if (itemData.hasOwnProperty("data"))
            itemData = itemData.data;

        itemData.name = this.data.name || game.i18n.localize("HELLAS.item.skill.newSkill");
    }
}
