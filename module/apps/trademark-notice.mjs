const { api } = foundry.applications;

/**
 * Read-only settings-menu application displaying the Khepera Publishing
 * trademark/license notice (legacy: a type:null world setting whose hint
 * carried this text — not a valid v13 idiom). Text preserved verbatim.
 */
export default class TrademarkNotice extends api.HandlebarsApplicationMixin(api.ApplicationV2) {

	/** @override */
	static DEFAULT_OPTIONS = {
		id: "hellas-trademark-notice",
		classes: ["hellas"],
		position: { width: 480, height: "auto" },
		window: {
			title: "HELLAS.settings.trademark.name",
			resizable: false
		}
	};

	/** @override */
	static PARTS = {
		notice: { template: "systems/hellas/templates/apps/trademark-notice.hbs" }
	};
}
