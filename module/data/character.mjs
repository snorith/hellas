import { HELLAS } from "../config.mjs";
import { intField, textField, valueMaxField } from "./fields.mjs";
import { migrateCharacterData } from "./migrations.mjs";

/**
 * System data for the `character` Actor type. See z/SPEC.md §3 and §5.2–5.3.
 */
export default class CharacterData extends foundry.abstract.TypeDataModel {

	/** @override */
	static defineSchema() {
		const { HTMLField, SchemaField } = foundry.data.fields;

		const attributes = {};
		for ( const attr of HELLAS.attributes ) {
			attributes[attr] = valueMaxField(0, attr === "fatepoints" ? 10 : 0);
		}

		const disadvantage = () => new SchemaField({
			level: intField(),
			info: textField()
		});

		const info = () => new SchemaField({ info: textField() });

		const callingPath = () => new SchemaField({
			years: textField(),
			notes: textField()
		});

		return {
			biography: new HTMLField({ required: true, initial: "" }),
			epithet: textField(),
			race: textField(),
			profession: textField(),
			deity: textField(),
			xp: textField(),  // free text by design (e.g. "3/12")
			attributes: new SchemaField(attributes),
			disadvantages: new SchemaField({
				relationship: disadvantage(),
				internal: disadvantage(),
				external: disadvantage()
			}),
			// F2: legacy sheet exposed a 4th ambition the template never declared.
			ambitions: new SchemaField({ 1: info(), 2: info(), 3: info(), 4: info() }),
			possessions: info(),
			abilities: info(),
			personal: new SchemaField({
				tree: new SchemaField({
					house: textField(),
					mother: new SchemaField({
						grandmother: textField(),
						grandfather: textField(),
						name: textField()
					}),
					father: new SchemaField({
						grandmother: textField(),
						grandfather: textField(),
						name: textField()
					}),
					// F1 (sixthborn) + F3 (defaults were junk "a".."f", now "")
					children: new SchemaField(Object.fromEntries(
						HELLAS.childrenBorn.map(c => [c, textField()])
					))
				}),
				birth: new SchemaField({
					age: textField(),
					month: textField(),
					year: textField(),
					planet: textField()
				}),
				info: new SchemaField({
					socialstation: textField(),
					gift: textField(),
					mark: textField(),
					encounter: textField(),
					destiny: textField(),
					fate: textField(),
					deeds: textField(),
					notes: textField(),
					familystatus: textField(),
					callings: new SchemaField({
						first: callingPath(),
						second: callingPath(),
						third: callingPath(),
						fourth: callingPath(),
						fifth: callingPath()
					})
				})
			}),
			initiative: new SchemaField({
				modifiers: new SchemaField({
					first: intField(),
					following: intField()
				})
			})
		};
	}

	/** @override */
	static migrateData(source) {
		migrateCharacterData(source);
		return super.migrateData(source);
	}

	/* -------------------------------------------- */

	/**
	 * Derived data (F6 — legacy wrote armor totals to the DB during render):
	 * 1. Non-finite attribute values coerce to 0 (fatepoints.max → 10).
	 * 2. Armor totals from active armor items → this.modifiers.armor.
	 * @override
	 */
	prepareDerivedData() {
		super.prepareDerivedData();

		for ( const attr of Object.values(this.attributes) ) {
			if ( !Number.isFinite(attr.value) ) attr.value = 0;
			if ( !Number.isFinite(attr.max) ) attr.max = 0;
		}
		if ( this.attributes.fatepoints.max === 0 ) this.attributes.fatepoints.max = 10;

		// Armor totals (SPEC §5.2) — sign conventions match legacy storage.
		const strength = this.attributes.strength.value;
		let pr = 0, dexPenalty = 0, perception = 0, parry = 0;
		for ( const armor of this.parent.itemTypes.armor ) {
			const a = armor.system;
			if ( !a.active ) continue;
			pr += a.pr ?? 0;
			perception += a.per ?? 0;
			parry += a.parry ?? 0;
			if ( (a.str ?? 0) > strength ) dexPenalty += (a.str ?? 0) - strength;
		}
		this.modifiers = {
			armor: { dexterity: -dexPenalty, perception, parry, pr }
		};
	}
}
