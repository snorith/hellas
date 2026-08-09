import { HELLAS, SPECIFY_SUBTYPE } from "../config.mjs";
import { DEFAULT_WEAPON_SKILLID } from "../data/weapon.mjs";
import { DEFAULT_DYNAMISM_SKILLID } from "../data/dynamism.mjs";

const { api, sheets } = foundry.applications;

/**
 * One AppV2 sheet for all five HELLAS item types (the legacy system had five
 * near-identical ItemSheet subclasses). See z/SPEC.md §7.2.
 */
export default class HellasItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["hellas", "item"],
		position: { width: 550, height: 620 },
		window: { resizable: true },
		form: { submitOnChange: true },
		actions: {
			onEditImage: HellasItemSheet.#onEditImage
		}
	};

	/** @override */
	static PARTS = {
		header: { template: "systems/hellas/templates/item/header.hbs" },
		tabs: { template: "templates/generic/tab-navigation.hbs" },
		skill: { template: "systems/hellas/templates/item/skill.hbs", scrollable: [""] },
		weapon: { template: "systems/hellas/templates/item/weapon.hbs", scrollable: [""] },
		armor: { template: "systems/hellas/templates/item/armor.hbs", scrollable: [""] },
		dynamism: { template: "systems/hellas/templates/item/dynamism.hbs", scrollable: [""] },
		talent: { template: "systems/hellas/templates/item/talent.hbs", scrollable: [""] },
		description: { template: "systems/hellas/templates/item/description.hbs", scrollable: [""] }
	};

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		options.parts = ["header", "tabs", this.document.type, "description"];
	}

	/* -------------------------------------------- */

	/**
	 * Tab records for the generic tab-navigation template.
	 * @param {string[]} parts
	 * @returns {Record<string, object>}
	 */
	_getTabs(parts) {
		const group = "primary";
		this.tabGroups[group] ??= this.document.type;
		const tabs = {};
		for ( const partId of parts ) {
			if ( (partId === "header") || (partId === "tabs") ) continue;
			const id = partId;
			const label = (partId === "description")
				? "HELLAS.sheet.tabs.description"
				: `HELLAS.sheet.tabs.${this.document.type}`;
			tabs[partId] = {
				id, group, label,
				cssClass: this.tabGroups[group] === id ? "active" : ""
			};
		}
		return tabs;
	}

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		const item = this.document;
		Object.assign(context, {
			item,
			system: item.system,
			editable: this.isEditable,
			HELLAS,
			SPECIFY_SUBTYPE,
			tabs: this._getTabs(options.parts)
		});
		switch ( item.type ) {
			case "skill": this.#prepareSkillContext(context); break;
			case "weapon": this.#prepareWeaponContext(context); break;
			case "armor": this.#prepareArmorContext(context); break;
			case "dynamism": this.#prepareDynamismContext(context); break;
		}
		return context;
	}

	/** @override */
	async _preparePartContext(partId, context) {
		context = await super._preparePartContext(partId, context);
		if ( partId in context.tabs ) context.tab = context.tabs[partId];
		if ( partId === "description" ) {
			context.enrichedNotes = await this.#enrich(this.document.system.notes);
		}
		if ( partId === "talent" ) {
			context.enrichedBenefit = await this.#enrich(this.document.system.benefit);
		}
		return context;
	}

	/** @param {string} html @returns {Promise<string>} */
	#enrich(html) {
		return foundry.applications.ux.TextEditor.implementation.enrichHTML(html ?? "", {
			secrets: this.document.isOwner,
			relativeTo: this.document
		});
	}

	/* -------------------------------------------- */
	/*  Type-specific context                       */
	/* -------------------------------------------- */

	/** Localized {value: label} map from an array. */
	#choices(values, keyFor) {
		return Object.fromEntries(values.map(v => [v, game.i18n.localize(keyFor(v))]));
	}

	/** Skill selector lists + guidance-note flags (legacy sheet logic, SPEC §7.2). */
	#prepareSkillContext(context) {
		const s = this.document.system;  // prepared → selectors already normalized
		const skill = s.skill;

		context.skillChoices = this.#choices(HELLAS.skills, v => `HELLAS.skills.${v}.name`);
		context.skillBlank = skill ? null : "";

		const specifics = (skill && HELLAS.skillsWSpecifics.includes(skill))
			? HELLAS.skillSpecificsBreakdown[skill]
			: [];
		context.hasSpecifics = specifics.length > 0;
		context.specifierChoices = this.#choices(specifics, v => `HELLAS.skills.specifics.${v}`);

		const isMode = skill === HELLAS.dynamismMode;
		const modeTypes = isMode ? (HELLAS.dynamismModesSpecificBreakdowns[s.specifier] ?? []) : [];
		context.isMode = isMode;
		context.modeTypeChoices = this.#choices(modeTypes, v => `HELLAS.skills.mode.${v}`);
		context.modeTypeDisabled = modeTypes.length === 1;
		context.customDisabled = s.specifier !== SPECIFY_SUBTYPE;

		const attributes = skill ? (HELLAS.skillWAssocShortAttributes[skill] ?? []) : [];
		context.hasAttributes = attributes.length > 0;
		context.attributeChoices = this.#choices(
			attributes, v => `HELLAS.attributes.${HELLAS.attributesShortToLong[v]}.name`
		);

		// Guidance copy (replaces the legacy setVar/ifIn template logic)
		const notes = [];
		if ( skill ) {
			if ( isMode ) notes.push("HELLAS.item.skill.specifier.only.one_included.mode");
			else if ( specifics.length ) {
				notes.push(HELLAS.skillSpecificsGetOneOnly.includes(skill)
					? "HELLAS.item.skill.specifier.only.one_included.normal"
					: "HELLAS.item.skill.specifier.all.included");
			}
			if ( attributes.length > 1 ) {
				if ( !specifics.length ) notes.push("HELLAS.item.skill.specifier.all.included");
				notes.push(skill === "etiquette"
					? "HELLAS.item.skill.multi.attribute.etiquette"
					: "HELLAS.item.skill.multi.attribute.normal");
			}
		}
		context.showGuidance = !!skill;
		context.guidanceNotes = notes;
	}

	/** Weapon skill picker: CR sentinel + the actor's weapon skills. */
	#prepareWeaponContext(context) {
		const skills = this.document.actor?.getSkillsBySkillIDPrefix("weapon") ?? [];
		context.skillidChoices = {
			[DEFAULT_WEAPON_SKILLID]: game.i18n.localize("HELLAS.weapon.skillid.default.name"),
			...Object.fromEntries(skills.map(s => [s.id, s.name]))
		};
		context.modifierChoices = this.#choices(
			HELLAS.weaponModifiers, v => `HELLAS.weapon.modifier.long.${v}`
		);
	}

	/** Armor type optgroups + modifier choices. */
	#prepareArmorContext(context) {
		context.typeGroups = Object.entries(HELLAS.armorTypes).map(([group, types]) => ({
			label: game.i18n.localize(`HELLAS.armor.type.group.long.${group}`),
			options: types.map(value => ({
				value,
				label: game.i18n.localize(`HELLAS.armor.type.opt.long.${value}`),
				selected: this.document.system.type === value
			}))
		}));
		context.modifierChoices = this.#choices(
			HELLAS.armorModifiers, v => `HELLAS.armor.modifier.long.${v}`
		);
	}

	/** Dynamism skill picker: sentinel + the actor's mode skills. */
	#prepareDynamismContext(context) {
		const skills = this.document.actor?.getSkillsBySkillIDPrefix("mode") ?? [];
		context.skillidChoices = {
			[DEFAULT_DYNAMISM_SKILLID]: game.i18n.localize("HELLAS.dynamism.skillid.default.name"),
			...Object.fromEntries(skills.map(s => [s.id, s.name]))
		};
	}

	/* -------------------------------------------- */

	/**
	 * Edit the item image via FilePicker.
	 * @this {HellasItemSheet}
	 * @param {PointerEvent} event
	 * @param {HTMLElement} target
	 */
	static async #onEditImage(event, target) {
		if ( !this.isEditable ) return;
		const current = this.document.img;
		const picker = new foundry.applications.apps.FilePicker.implementation({
			type: "image",
			current,
			callback: path => this.document.update({ img: path })
		});
		return picker.browse();
	}
}
