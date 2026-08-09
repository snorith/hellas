/**
 * Shared field factories. All numeric fields are nullable so blank legacy
 * values migrated to null are stored as null rather than 0-cast; display and
 * roll code treats null as 0 via prepareDerivedData.
 */

/**
 * An integer NumberField.
 * @param {number} [initial]
 * @returns {foundry.data.fields.NumberField}
 */
export function intField(initial = 0) {
	return new foundry.data.fields.NumberField({
		required: true, nullable: true, integer: true, initial
	});
}

/**
 * A {value, max} pair of integers.
 * @param {number} [valueInitial]
 * @param {number} [maxInitial]
 * @returns {foundry.data.fields.SchemaField}
 */
export function valueMaxField(valueInitial = 0, maxInitial = 0) {
	return new foundry.data.fields.SchemaField({
		value: intField(valueInitial),
		max: intField(maxInitial)
	});
}

/**
 * A plain (non-HTML) string field, default "".
 * @param {string} [initial]
 * @returns {foundry.data.fields.StringField}
 */
export function textField(initial = "") {
	return new foundry.data.fields.StringField({ required: true, initial });
}
