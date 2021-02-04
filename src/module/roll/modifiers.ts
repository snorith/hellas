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
				cancel: {
					label: game.i18n.localize("HELLAS.roll.modifiers.dialog.button.cancel.label"),
					callback: html => resolve({ discriminator: "cancelled" })
				},
				normal: {
					label: game.i18n.localize("HELLAS.roll.modifiers.dialog.button.roll.label"),
					callback: html => resolve(_processRollDialog(html[0].querySelector("form")))
				}
			},
			default: "normal",
			close: () => resolve({ discriminator: "cancelled" })
		}
		new Dialog(data, null).render(true)
	})
}

function _processRollDialog(form: HTMLFormElement): modifierDialogFieldsT {
	const elements = form.elements

	// @ts-ignore
	return {
		discriminator: "fields",
		dod: parseInt((elements.namedItem('dod') as HTMLInputElement).value),
		nonproficiency: parseInt((elements.namedItem('nonproficiency') as HTMLInputElement).value),
		multipleactionscount: parseInt((elements.namedItem('multipleactionscount') as HTMLInputElement).value),
		modifier: parseInt((elements.namedItem('modifier') as HTMLInputElement).value)
	}
}
