/**
 * The pre-roll modifier dialog (SPEC §6.2), on DialogV2 (F16 — the legacy
 * dialog embedded jQuery + tooltipster in an inline <script>).
 */

/**
 * @typedef {object} RollModifiers
 * @property {number} dod                   Degree of difficulty.
 * @property {number} nonproficiency        Non-proficiency modifier.
 * @property {number} multipleactionscount  Extra actions taken (0–10).
 * @property {number} modifier              Free modifier (prefilled with context).
 */

/**
 * Prompt for roll modifiers. Resolves null when cancelled or dismissed.
 * @param {number} [baseModifier]  Prefill for the Modifier field.
 * @param {number} [dod]           Prefill for the DoD field.
 * @returns {Promise<RollModifiers|null>}
 */
export async function getRollModifiers(baseModifier = 0, dod = 0) {
	const content = await foundry.applications.handlebars.renderTemplate(
		"systems/hellas/templates/dialog/modifiers.hbs",
		{ dod, baseModifier, actionCounts: Array.fromRange(11) }
	);

	const read = form => {
		const int = name => {
			const v = parseInt(form.elements.namedItem(name)?.value, 10);
			return Number.isFinite(v) ? v : 0;
		};
		return {
			dod: int("dod"),
			nonproficiency: int("nonproficiency"),
			multipleactionscount: int("multipleactionscount"),
			modifier: int("modifier")
		};
	};

	return foundry.applications.api.DialogV2.wait({
		window: { title: "HELLAS.roll.modifiers.dialog.title" },
		content,
		buttons: [
			{
				action: "roll",
				label: "HELLAS.roll.modifiers.dialog.button.roll.label",
				default: true,
				callback: (event, button) => read(button.form)
			},
			{
				action: "cancel",
				label: "HELLAS.roll.modifiers.dialog.button.cancel.label",
				callback: () => null
			}
		],
		rejectClose: false,
		render: (event, dialog) => {
			const dodInput = dialog.element.querySelector("input[name=dod]");
			dodInput?.focus();
			dodInput?.select();
		}
	});
}
