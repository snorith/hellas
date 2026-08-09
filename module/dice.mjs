/**
 * HELLAS omega-table outcome + multiple-action penalty. See z/SPEC.md §6.1/§6.3.
 */

/**
 * @typedef {"critfail"|"fail"|"partialsuccess"|"success"|"critsuccess"} DieRollOutcome
 */

/**
 * Determine the omega-table outcome for a final roll total.
 * @param {number} total
 * @returns {DieRollOutcome}
 */
export function determineDieRollOutcome(total) {
	if ( total <= 0 ) return "critfail";
	if ( total <= 5 ) return "fail";
	if ( total <= 10 ) return "partialsuccess";
	if ( total <= 19 ) return "success";
	return "critsuccess";
}

/**
 * The multiple-action penalty, including the SPD offset.
 * −5 per action after the first (count starts at 0); when any extra actions
 * are taken SPD is added back once; the result is clamped to ≤ 0 so a very
 * high SPD never turns extra actions into a bonus.
 *
 * @param {number} multipleActionsCount  Number of extra actions (first action = 0).
 * @param {number} spd                   The character's SPD value.
 * @returns {number} Penalty (≤ 0).
 */
export function multipleActionPenalty(multipleActionsCount, spd) {
	let penalty = multipleActionsCount * -5;
	if ( multipleActionsCount > 0 ) penalty += spd;
	return Math.min(penalty, 0);
}
