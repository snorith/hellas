export type dieRollOutcomeT = 'critfail' | 'fail' | 'partialsuccess' | 'success' | 'critsuccess'

// determine the omega table outcome
export function determineDieRollOutcome( total: number ): dieRollOutcomeT {
	if (total <= 0)
		return 'critfail'
	if (total <= 5)
		return 'fail'
	if (total <= 10)
		return 'partialsuccess'
	if (total <= 19)
		return 'success'
	return 'critsuccess'
}
