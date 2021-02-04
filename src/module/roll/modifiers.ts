import {systemBasePath} from "../settings"

interface dialogCancelledT {
	discriminator: "cancelled"
}

interface modifierDialogFieldsT {
	discriminator: "fields",
	dod: number,
	nonproficiency: number,
	multipleactionscount: number,
	modifier: number
}

type modifierDialogT = dialogCancelledT | modifierDialogFieldsT

export async function getRollModifiers(): Promise<modifierDialogT> {
	const template = `${systemBasePath}/templates/roll/modifiers.hbs`
	const html = await renderTemplate(template, {})

	return new Promise(resolve => {
		const data = {
			title: game.i18n.localize("HELLAS.roll.modifiers.dialog.title"),
			content: html,
			buttons: {
				normal: {
					label: game.i18n.localize("HELLAS.roll.modifiers.dialog.button.roll.label"),
					callback: html => resolve(_processRollDialog(html[0].querySelector("form")))
				},
				cancel: {
					label: game.i18n.localize("HELLAS.roll.modifiers.dialog.button.cancel.label"),
					callback: html => resolve({ discriminator: "cancelled" })
				}
			},
			default: "normal",
			close: () => resolve({ discriminator: "cancelled" })
		}
		new Dialog(data, null).render(true)
	})
}

function _processRollDialog(form): modifierDialogFieldsT {
	return {
		discriminator: "fields",
		dod: form.dod.value,
		nonproficiency: form.nonproficiency.value,
		multipleactionscount: form.multipleactionscount.value,
		modifier: form.modifier.value
	}
}
