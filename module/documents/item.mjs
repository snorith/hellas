import { HELLAS } from "../config.mjs";
import { determineDieRollOutcome, multipleActionPenalty } from "../dice.mjs";
import { getRollModifiers } from "../dialogs/roll-modifiers.mjs";
import { normalizeSkillSelectors, skillFullName } from "../data/skill.mjs";
import { DEFAULT_WEAPON_SKILLID } from "../data/weapon.mjs";
import { DEFAULT_DYNAMISM_SKILLID } from "../data/dynamism.mjs";

const { renderTemplate } = foundry.applications.handlebars;

/** Default icons per item type (legacy DEFAULT_*_IMG values). */
const DEFAULT_ICONS = {
	skill: "icons/svg/lightning.svg",
	dynamism: "icons/svg/lightning.svg",
	weapon: "icons/svg/sword.svg",
	armor: "icons/svg/shield.svg",
	talent: "icons/svg/sun.svg"
};

/** Skill selector fields whose change re-derives the document name. */
const SKILL_NAME_FIELDS = ["skill", "specifier", "specifierCustom", "attribute"];

/**
 * The HELLAS Item document. Replaces the legacy Proxy-based fake polymorphism
 * (one class per type) with type dispatch; roll behavior per z/SPEC.md §6.4.
 */
export default class HellasItem extends Item {

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		if ( (await super._preCreate(data, options, user)) === false ) return false;

		const updates = {};
		if ( !data.img && (this.type in DEFAULT_ICONS) ) updates.img = DEFAULT_ICONS[this.type];

		// Skills persist normalized selectors and a derived display name (F5 —
		// legacy synced these with DB writes during prepareData; we do it at
		// create/update time, where the full document context is available).
		if ( this.type === "skill" ) {
			const d = normalizeSkillSelectors({
				skill: this.system.skill ?? "",
				attribute: this.system.attribute ?? "",
				specifier: this.system.specifier ?? "",
				specifierCustom: this.system.specifierCustom ?? ""
			});
			updates.system = d;
			if ( d.skill ) updates.name = skillFullName(d, !!this.actor);
		}

		if ( !foundry.utils.isEmpty(updates) ) this.updateSource(updates);
	}

	/** @inheritDoc */
	async _preUpdate(changed, options, user) {
		if ( (await super._preUpdate(changed, options, user)) === false ) return false;

		// When a selector field changes, persist the FULL normalized selector
		// set (merged against the current document) and re-derive the display
		// name, so stored source never drifts from the derived state. Guarded on
		// the selector fields being present in the delta: unrelated updates are
		// left untouched. Normalization lives here — NOT in migrateData — because
		// it needs whole-document context that update deltas don't carry.
		const sys = changed.system;
		if ( (this.type === "skill") && sys && SKILL_NAME_FIELDS.some(f => f in sys) ) {
			const d = normalizeSkillSelectors({
				skill: ("skill" in sys) ? (sys.skill ?? "") : this.system.skill,
				attribute: ("attribute" in sys) ? (sys.attribute ?? "") : this.system.attribute,
				specifier: ("specifier" in sys) ? (sys.specifier ?? "") : this.system.specifier,
				specifierCustom: ("specifierCustom" in sys) ? (sys.specifierCustom ?? "") : this.system.specifierCustom
			});
			Object.assign(sys, d);
			if ( !("name" in changed) ) {
				changed.name = d.skill
					? skillFullName(d, !!this.actor)
					: game.i18n.localize("HELLAS.item.skill.new");
			}
		}
	}

	/* -------------------------------------------- */

	/**
	 * Toggle an armor item's worn state.
	 * @returns {Promise<boolean>}
	 */
	async toggleActive() {
		if ( !this.actor || (this.type !== "armor") ) return false;
		await this.update({ "system.active": !this.system.active });
		return true;
	}

	/**
	 * Roll this item (skill / weapon / dynamism). Armor and talents don't roll.
	 * @returns {Promise<boolean>} false when cancelled, refused, or not rollable.
	 */
	async roll() {
		if ( !this.actor ) return false;
		switch ( this.type ) {
			case "skill": return this.#rollSkill();
			case "weapon": return this.#rollWeapon();
			case "dynamism": return this.#rollDynamism();
			default: return false;
		}
	}

	/* -------------------------------------------- */

	/**
	 * Post an evaluated roll with a rendered flavor card, always public.
	 * @param {Roll} roll
	 * @param {string} template
	 * @param {object} context
	 */
	async #toChat(roll, template, context) {
		const flavor = await renderTemplate(template, context);
		await roll.toMessage(
			{ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor },
			{ rollMode: CONST.DICE_ROLL_MODES.PUBLIC }
		);
	}

	/** Skill roll (SPEC §6.4.2). */
	async #rollSkill() {
		const actorSystem = this.actor.system;
		const armor = actorSystem.modifiers?.armor ?? {};

		let baseModifier = 0;
		if ( this.system.skill === "parry" ) baseModifier += armor.parry ?? 0;
		const long = HELLAS.attributesShortToLong[this.system.attribute];
		if ( long in armor ) baseModifier += armor[long];

		const modifiers = await getRollModifiers(baseModifier);
		if ( !modifiers ) return false;

		const rollData = {
			...modifiers,
			multipleactionspenalty: multipleActionPenalty(
				modifiers.multipleactionscount, actorSystem.attributes.speed.value
			),
			level: this.system.level,
			attribute: this.system.attribute
		};
		const roll = new Roll(
			"d20 + @level.max + @dod + @nonproficiency + @multipleactionspenalty + @modifier",
			rollData
		);
		await roll.evaluate();

		await this.#toChat(roll, "systems/hellas/templates/chat/skillroll.hbs", {
			name: this.name,
			outcome: determineDieRollOutcome(roll.total),
			data: rollData
		});
		return true;
	}

	/** Weapon roll (SPEC §6.4.3). */
	async #rollWeapon() {
		const actorSystem = this.actor.system;
		const w = this.system;

		// STR shortfall: −2 per point short, −4 for missile weapons; plus ACC.
		let baseModifier = w.acc ?? 0;
		const strength = actorSystem.attributes.strength.value;
		if ( strength < (w.str ?? 0) ) {
			baseModifier += (w.str - strength) * (w.ismissile ? -4 : -2);
		}

		let baseLevel;
		let skillName;
		if ( w.skillid === DEFAULT_WEAPON_SKILLID ) {
			baseLevel = actorSystem.attributes.combatrating.value;
			skillName = game.i18n.localize("HELLAS.attributes.combatrating.name");
		}
		else {
			const skill = this.actor.items.get(w.skillid);
			if ( !skill ) {
				ui.notifications.error(game.i18n.format("HELLAS.notification.noAssociatedSkill", { name: this.name }));
				return false;
			}
			baseLevel = skill.system.level.max;
			skillName = skill.name;
		}

		const modifiers = await getRollModifiers(baseModifier);
		if ( !modifiers ) return false;

		const rollData = {
			...modifiers,
			multipleactionspenalty: multipleActionPenalty(
				modifiers.multipleactionscount, actorSystem.attributes.speed.value
			),
			baseLevel
		};
		const roll = new Roll(
			"d20 + @baseLevel + @dod + @nonproficiency + @multipleactionspenalty + @modifier",
			rollData
		);
		await roll.evaluate();

		await this.#toChat(roll, "systems/hellas/templates/chat/weaponroll.hbs", {
			name: this.name,
			skill: skillName,
			outcome: determineDieRollOutcome(roll.total),
			data: rollData
		});
		return true;
	}

	/** Dynamism roll (SPEC §6.4.4). */
	async #rollDynamism() {
		const actorSystem = this.actor.system;
		const d = this.system;

		if ( d.skillid === DEFAULT_DYNAMISM_SKILLID ) {
			ui.notifications.error(game.i18n.format("HELLAS.notification.pickDynamismSkill", { name: this.name }));
			return false;
		}
		const skill = this.actor.items.get(d.skillid);
		if ( !skill ) {
			ui.notifications.error(game.i18n.format("HELLAS.notification.noAssociatedSkill", { name: this.name }));
			return false;
		}

		const modifiers = await getRollModifiers(0, d.dod ?? 0);
		if ( !modifiers ) return false;

		const rollData = {
			...modifiers,
			multipleactionspenalty: multipleActionPenalty(
				modifiers.multipleactionscount, actorSystem.attributes.speed.value
			),
			baseLevel: skill.system.level.max
		};
		const roll = new Roll(
			"d20 + @baseLevel + @dod + @nonproficiency + @multipleactionspenalty + @modifier",
			rollData
		);
		await roll.evaluate();

		await this.#toChat(roll, "systems/hellas/templates/chat/dynamismroll.hbs", {
			name: this.name,
			skill: skill.name,
			outcome: determineDieRollOutcome(roll.total),
			data: rollData
		});
		return true;
	}
}
