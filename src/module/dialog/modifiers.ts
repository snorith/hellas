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

export async function getRollModifiers(baseModifier = 0, dod = 0): Promise<modifierDialogT> {
	const template = `${systemBasePath}/templates/dialog/modifiers.hbs`
	const html = await renderTemplate(template, {
		dod,
		baseModifier
	})

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

/**
 * determine the multiple action penalty, including the SPD modifier
 *
 * decide whether SPD should be used as a modifier on multiple actions rolls
 * if the SPD is very high, say 6, then it starts adding to the multiple action penalty
 * and it actually becomes beneficial to take multiple actions which is not intended
 *
 * @param multipleActionsCount the number of multiple actions taken, starting count at zero (ie: the first action is action #0)
 * @param spd character's SPD
 * @returns penalty roll modifier
 */
export function multipleActionPenalty(multipleActionsCount: number, spd: number): number {
	let totalMultipleActionPenalty = multipleActionsCount * -5			// -5 per multiple action, first (counting from zero) is free
	const includeSPDModifier = multipleActionsCount > 0 ? 1 : 0				// if there are multiple actions then = 1, else 0
	const totalSpeedMultipleActionModifier = spd * includeSPDModifier

	totalMultipleActionPenalty += totalSpeedMultipleActionModifier
	if (totalMultipleActionPenalty > 0)
		return 0

	return totalMultipleActionPenalty
}
