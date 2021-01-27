

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class HellasActor extends Actor {
	prepareData() {
		super.prepareData();

		const actorData = this.data

		if (actorData.type == 'character')
			this._prepareCharacterData(actorData)
	}

	/**
	 * Calculate derived values
	 *
	 * @param actorData
	 */
	_prepareCharacterData(actorData: Actor.Data<any>) {
		const data = actorData.data
	}
}
