import { intField, textField } from "./fields.mjs";
import { migrateArmorData } from "./migrations.mjs";

/**
 * System data for `armor` items. See z/SPEC.md §4.4.
 * `active` = currently worn; drives the actor's derived armor totals.
 */
export default class ArmorData extends foundry.abstract.TypeDataModel {

	/** @override */
	static defineSchema() {
		const { BooleanField, HTMLField } = foundry.data.fields;
		return {
			str: intField(),
			per: intField(),
			cha: intField(),
			parry: intField(),
			pr: intField(),
			wt: intField(),
			md: intField(),
			type: textField("clothingutility"),
			modifier: textField("regular"),
			active: new BooleanField({ required: true, initial: false }),
			price: intField(),
			notes: new HTMLField({ required: true, initial: "" })
		};
	}

	/** @override */
	static migrateData(source) {
		migrateArmorData(source);
		return super.migrateData(source);
	}
}
