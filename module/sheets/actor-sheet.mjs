import { HELLAS } from "../config.mjs";
import { sortItemsByName } from "../documents/actor.mjs";
import { DEFAULT_WEAPON_SKILLID } from "../data/weapon.mjs";
import { DEFAULT_DYNAMISM_SKILLID } from "../data/dynamism.mjs";

const { api, sheets } = foundry.applications;
const { renderTemplate } = foundry.applications.handlebars;

/** Escape a string and convert line breaks to <br> (legacy breaklines helper). */
function breaklines(str) {
	const escaped = foundry.utils.escapeHTML(str ?? "");
	return escaped.replace(/(\r\n|\n|\r)/g, "<br>");
}

/** Is the string empty or whitespace-only (legacy isEmptyOrSpaces)? */
const isBlank = str => !str || /^[\s\n\r\t]*$/.test(str);

/**
 * The HELLAS character sheet on ApplicationV2. See z/SPEC.md §7.1.
 * Every action — including rolls — requires isEditable (legacy behavior:
 * observers can look but never act).
 */
export default class HellasActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["hellas", "actor"],
		position: { width: 925, height: 1000 },
		window: { resizable: true },
		form: { submitOnChange: true },
		actions: {
			onEditImage: HellasActorSheet.#onEditImage,
			attrRoll: HellasActorSheet.#onAttrRoll,
			itemRoll: HellasActorSheet.#onItemRoll,
			initiativeRoll: HellasActorSheet.#onInitiativeRoll,
			armorToggle: HellasActorSheet.#onArmorToggle,
			fateSet: HellasActorSheet.#onFateSet,
			itemCreate: HellasActorSheet.#onItemCreate,
			itemEdit: HellasActorSheet.#onItemEdit,
			itemDelete: HellasActorSheet.#onItemDelete
		}
	};

	/** @override */
	static PARTS = {
		header: { template: "systems/hellas/templates/actor/header.hbs" },
		tabs: { template: "templates/generic/tab-navigation.hbs" },
		attributes: { template: "systems/hellas/templates/actor/attributes.hbs", scrollable: [""] },
		disadvantages: { template: "systems/hellas/templates/actor/disadvantages.hbs", scrollable: [""] },
		personal: { template: "systems/hellas/templates/actor/personal.hbs", scrollable: [""] },
		description: { template: "systems/hellas/templates/actor/description.hbs", scrollable: [""] }
	};

	/* -------------------------------------------- */

	/** @param {string[]} parts @returns {Record<string, object>} */
	_getTabs(parts) {
		const group = "primary";
		this.tabGroups[group] ??= "attributes";
		const tabs = {};
		for ( const partId of parts ) {
			if ( (partId === "header") || (partId === "tabs") ) continue;
			tabs[partId] = {
				id: partId, group,
				label: `HELLAS.sheet.tabs.${partId}`,
				cssClass: this.tabGroups[group] === partId ? "active" : ""
			};
		}
		return tabs;
	}

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		const actor = this.actor;
		const system = actor.system;

		Object.assign(context, {
			actor,
			system,
			editable: this.isEditable,
			HELLAS,
			tabs: this._getTabs(options.parts)
		});

		// The ten rollable attribute tiles, in config order.
		context.attributeTiles = HELLAS.characterAttributes.map(key => ({
			key,
			value: system.attributes[key].value,
			nameKey: `HELLAS.attributes.${key}.name`,
			descriptionKey: `HELLAS.attributes.${key}.description`
		}));

		// Fate dots (F8: clicks persist via actor.update in #onFateSet).
		const fate = system.attributes.fatepoints;
		context.fate = {
			value: fate.value,
			max: fate.max,
			title: game.i18n.format("HELLAS.attributes.fatepoints.description", {
				current: fate.value, max: fate.max
			}),
			dots: Array.fromRange(fate.max, 1).map(num => ({
				num,
				filled: num <= fate.value,
				last: num === fate.max
			}))
		};

		// Item tables, name-sorted, each with a prebuilt rich tooltip.
		context.skills = await this.#prepareItems("skill");
		context.dynamisms = await this.#prepareItems("dynamism");
		context.weapons = await this.#prepareItems("weapon");
		context.armor = await this.#prepareItems("armor");
		context.talents = await this.#prepareItems("talent");

		context.armorTotals = system.modifiers.armor;

		// Static rules tooltips (verbatim legacy copy).
		context.xpTooltip = await renderTemplate("systems/hellas/templates/actor/tooltips/xp.hbs", {});
		context.heropointsTooltip = await renderTemplate("systems/hellas/templates/actor/tooltips/heropoints.hbs", {});

		// Personal tab loops.
		context.children = HELLAS.childrenBorn.map((key, i) => ({
			key,
			label: game.i18n.format("HELLAS.sheet.personal.child", { num: i + 1 }),
			value: system.personal.tree.children[key]
		}));
		context.callings = ["first", "second", "third", "fourth", "fifth"].map(key => ({
			key,
			labelKey: `HELLAS.sheet.personal.callings.${key}`,
			years: system.personal.info.callings[key].years,
			notes: system.personal.info.callings[key].notes
		}));
		context.disadvantageRows = HELLAS.characterDisadvantages.map(key => ({
			key,
			nameKey: `HELLAS.attributes.${key}.name`,
			level: system.disadvantages[key].level,
			info: system.disadvantages[key].info
		}));
		context.ambitionSlots = ["1", "2", "3", "4"].map(key => ({
			key, value: system.ambitions[key].info
		}));

		return context;
	}

	/** @override */
	async _preparePartContext(partId, context) {
		context = await super._preparePartContext(partId, context);
		if ( partId in context.tabs ) context.tab = context.tabs[partId];
		if ( partId === "description" ) {
			context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
				this.actor.system.biography ?? "",
				{ secrets: this.actor.isOwner, relativeTo: this.actor }
			);
		}
		return context;
	}

	/* -------------------------------------------- */

	/**
	 * Build the display entries for one item type: sorted, with tooltip HTML
	 * (replaces the legacy hidden-div + tooltipster setup; fixes F9).
	 * @param {string} type
	 * @returns {Promise<object[]>}
	 */
	async #prepareItems(type) {
		const items = [...this.actor.itemTypes[type]].sort(sortItemsByName);
		return Promise.all(items.map(async item => {
			const s = item.system;
			const entry = { id: item.id, name: item.name, img: item.img, system: s };
			switch ( type ) {
				case "skill":
					entry.hasNotes = !isBlank(s.notes);
					break;
				case "weapon":
					entry.drSuffix = game.i18n.localize(`HELLAS.weapon.modifier.short.${s.modifier}`);
					entry.skillName = this.#associatedSkillName(s.skillid, DEFAULT_WEAPON_SKILLID, "HELLAS.weapon.skillid.default.name", "HELLAS.weapon.skillid.unknown.name");
					entry.modifierName = game.i18n.localize(`HELLAS.weapon.modifier.long.${s.modifier}`);
					entry.modifierDesc = s.modifier !== "regular"
						? game.i18n.localize(`HELLAS.weapon.modifier.desc.${s.modifier}`) : null;
					break;
				case "armor":
					entry.prSuffix = game.i18n.localize(`HELLAS.armor.modifier.short.${s.modifier}`);
					entry.typeName = game.i18n.localize(`HELLAS.armor.type.opt.long.${s.type}`);
					entry.modifierName = game.i18n.localize(`HELLAS.armor.modifier.long.${s.modifier}`);
					break;
				case "dynamism":
					entry.skillName = this.#associatedSkillName(s.skillid, DEFAULT_DYNAMISM_SKILLID, "HELLAS.dynamism.skillid.default.name", "HELLAS.dynamism.skillid.unknown.name");
					entry.dodinfoHtml = breaklines(s.dodinfo);
					break;
				case "talent":
					entry.descHtml = breaklines(s.desc);
					break;
			}
			entry.tooltip = await renderTemplate(
				`systems/hellas/templates/actor/tooltips/${type}.hbs`, entry
			);
			return entry;
		}));
	}

	/** Resolve a weapon/dynamism skillid to a display name (sentinel/unknown aware). */
	#associatedSkillName(skillid, sentinel, defaultKey, unknownKey) {
		if ( skillid === sentinel ) return game.i18n.localize(defaultKey);
		const skill = this.actor.items.get(skillid);
		return skill ? skill.name : game.i18n.localize(unknownKey);
	}

	/* -------------------------------------------- */
	/*  Actions (all isEditable-gated)              */
	/* -------------------------------------------- */

	/** @this {HellasActorSheet} */
	static async #onEditImage(event, target) {
		if ( !this.isEditable ) return;
		const picker = new foundry.applications.apps.FilePicker.implementation({
			type: "image",
			current: this.actor.img,
			callback: path => this.actor.update({ img: path })
		});
		return picker.browse();
	}

	/** @this {HellasActorSheet} */
	static async #onAttrRoll(event, target) {
		if ( !this.isEditable ) return;
		await this.actor.attrRoll(target.dataset.attribute);
	}

	/** @this {HellasActorSheet} */
	static async #onItemRoll(event, target) {
		if ( !this.isEditable ) return;
		const item = this.actor.items.get(target.dataset.itemId);
		await item?.roll();
	}

	/** @this {HellasActorSheet} */
	static async #onInitiativeRoll(event, target) {
		if ( !this.isEditable ) return;
		await this.actor.initiativeRoll(target.dataset.initiative);
	}

	/** @this {HellasActorSheet} */
	static async #onArmorToggle(event, target) {
		if ( !this.isEditable ) return;
		const item = this.actor.items.get(target.dataset.itemId);
		await item?.toggleActive();
	}

	/**
	 * Set fate points to the clicked dot (0 when the label is clicked).
	 * F8: the legacy sheet only mutated prepared data and lost the change.
	 * @this {HellasActorSheet}
	 */
	static async #onFateSet(event, target) {
		if ( !this.isEditable ) return;
		const value = parseInt(target.dataset.value, 10);
		if ( !Number.isFinite(value) ) return;
		await this.actor.update({ "system.attributes.fatepoints.value": value });
	}

	/**
	 * Create a new owned item of the dataset type (F17: name + type only).
	 * @this {HellasActorSheet}
	 */
	static async #onItemCreate(event, target) {
		if ( !this.isEditable ) return;
		const type = target.dataset.type;
		await Item.implementation.create({
			name: game.i18n.localize(`HELLAS.item.${type}.new`),
			type
		}, { parent: this.actor });
	}

	/** @this {HellasActorSheet} */
	static async #onItemEdit(event, target) {
		if ( !this.isEditable ) return;
		const item = this.actor.items.get(target.dataset.itemId);
		item?.sheet.render({ force: true });
	}

	/** @this {HellasActorSheet} */
	static async #onItemDelete(event, target) {
		if ( !this.isEditable ) return;
		const item = this.actor.items.get(target.dataset.itemId);
		if ( !item ) return;
		const confirmed = await foundry.applications.api.DialogV2.confirm({
			window: { title: item.name },
			content: `<p>${game.i18n.localize("HELLAS.dialog.really.delete")}</p>`,
			rejectClose: false
		});
		if ( confirmed ) await item.delete();
	}
}
