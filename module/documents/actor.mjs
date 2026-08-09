import { HELLAS } from "../config.mjs";
import { determineDieRollOutcome, multipleActionPenalty } from "../dice.mjs";
import { getRollModifiers } from "../dialogs/roll-modifiers.mjs";

const { renderTemplate } = foundry.applications.handlebars;

/** Name sort using locale rules (F18 — legacy compare was case-sensitive). */
export const sortItemsByName = (a, b) => a.name.localeCompare(b.name);

/**
 * The HELLAS Actor document. Roll methods per z/SPEC.md §6.4.
 */
export default class HellasActor extends Actor {

	/**
	 * Skills on this actor whose derived skillid starts with `prefix`
	 * ("weapon" for weapon skills, "mode" for dynamism modes), name-sorted.
	 * @param {string} prefix
	 * @returns {Item[]}
	 */
	getSkillsBySkillIDPrefix(prefix) {
		return this.itemTypes.skill
			.filter(i => i.system.skillid?.startsWith(prefix))
			.sort(sortItemsByName);
	}

	/**
	 * Roll initiative for the first or a following round (SPEC §6.4.5):
	 * no modifier dialog, no omega-table outcome, always public.
	 * @param {"first"|"following"} initiative
	 * @returns {Promise<boolean>}
	 */
	async initiativeRoll(initiative) {
		const modifiers = this.system.initiative?.modifiers ?? {};
		const modifier = Number.isFinite(modifiers[initiative]) ? modifiers[initiative] : 0;
		const speedAttr = this.system.attributes.speed;

		const rollData = { modifier, speedAttr };
		const roll = new Roll("d20 + @speedAttr.value + @modifier", rollData);
		await roll.evaluate();

		const flavor = await renderTemplate("systems/hellas/templates/chat/initiativeroll.hbs", {
			initiative,
			outcome: roll.total,
			data: rollData
		});
		await roll.toMessage(
			{ speaker: ChatMessage.getSpeaker({ actor: this }), flavor },
			{ rollMode: CONST.DICE_ROLL_MODES.PUBLIC }
		);
		return true;
	}

	/**
	 * Roll one of the ten character attributes (SPEC §6.4.1). The armor-derived
	 * modifier for this attribute (dexterity/perception) prefills the dialog.
	 * @param {string} attribute  Long attribute name, e.g. "dexterity".
	 * @returns {Promise<boolean>} false when cancelled.
	 */
	async attrRoll(attribute) {
		const armorModifiers = this.system.modifiers?.armor ?? {};
		const baseModifier = Number.isFinite(armorModifiers[attribute]) ? armorModifiers[attribute] : 0;

		const modifiers = await getRollModifiers(baseModifier);
		if ( !modifiers ) return false;

		const rollData = {
			...modifiers,
			multipleactionspenalty: multipleActionPenalty(
				modifiers.multipleactionscount, this.system.attributes.speed.value
			),
			attribute: this.system.attributes[attribute]
		};

		const roll = new Roll(
			"d20 + @attribute.value + @dod + @nonproficiency + @multipleactionspenalty + @modifier",
			rollData
		);
		await roll.evaluate();
		const outcome = determineDieRollOutcome(roll.total);

		const flavor = await renderTemplate("systems/hellas/templates/chat/attributeroll.hbs", {
			name: attribute,
			outcome,
			data: rollData
		});
		await roll.toMessage(
			{ speaker: ChatMessage.getSpeaker({ actor: this }), flavor },
			{ rollMode: CONST.DICE_ROLL_MODES.PUBLIC }
		);
		return true;
	}
}
