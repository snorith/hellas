export const systemName = "hellas"
export const systemBasePath = `systems/${systemName}`

export const registerSettings = function() {
	// Register any custom system settings here

	// Register custom Handlebar helpers

	// concatenate some number of strings passed as parameters
	Handlebars.registerHelper('concat', function() {
		let outStr = ''
		for (let arg in arguments) {
			if (typeof arguments[arg] != 'object') {
				outStr += arguments[arg]
			}
		}
		return outStr
	})

	/**
	 * Given an array of objects, return the first entry where the object's property named 'key' has the value 'value'
	 */
	Handlebars.registerHelper('findEntryByKeyValue', function (arr: object[], key: string, value: any, options): object {
		if (!Array.isArray(arr)) {
			console.log('first param is not an array: ' + arr)
			return null
		}

		for (let i = 0; i < arr.length; i++) {
			const entry = arr[i]
			if (!entry.hasOwnProperty(key))
				continue
			if (entry[key] === value)
				return entry
		}

		return null
	})

	// if 'elem' is in an array
	Handlebars.registerHelper('ifIn', function(elem, list, options) {
		if(list.indexOf(elem) > -1) {
			return options.fn(this);
		}
		return options.inverse(this);
	});

	// repeat something 'n' times
	Handlebars.registerHelper("repeat", function (times, opts) {
		let out = "";
		let i;
		let data = {} as any;

		if ( times && Number.isFinite(times) ) {
			for ( i = 0; i < times; i++ ) {
				data.index = i
				data.num = i + 1
				data.first = i === 0
				data.last = i === (times - 1)
				out += opts.fn(this, {
					data: data
				});
			}
		} else {
			out = opts.inverse(this)
		}

		return out;
	});

	Handlebars.registerHelper("setVar", function(varName, varValue, options) {
		options.data.root[varName] = varValue;
	})

	Handlebars.registerHelper('toLowerCase', function(str) {
		return str.toLowerCase()
	})

	Handlebars.registerHelper("selected", value => value ? "selected" : "")
	Handlebars.registerHelper("disabled", value => value ? "disabled" : "")

	// https://stackoverflow.com/questions/39766555/how-to-check-for-empty-string-null-or-white-spaces-in-handlebar
	Handlebars.registerHelper('ifEmptyOrWhitespace', function (value, options) {
		if (!value) { return options.fn(this); }
		return value.replace(/\s*/g, '').length === 0
			? options.fn(this)
			: options.inverse(this)
	})

	Handlebars.registerHelper('isZeroThenBlank', function (value) {
		if (Number.isFinite(value)) {
			if (value == 0) {
				return ''
			}
			return value
		}
		return ''
	})

	Handlebars.registerHelper('isZero', (value) => {
		if (Number.isFinite(value)) {
			return value == 0;
		}
		return true
	})

	Handlebars.registerHelper('add', (a, b) => {
		if (Number.isFinite(a) && Number.isFinite(b)) {
			return a + b
		}
		return ''
	})

	Handlebars.registerHelper('sub', (a, b) => {
		if (Number.isFinite(a) && Number.isFinite(b)) {
			return a - b
		}
		return ''
	})
}

export function isEmptyOrSpaces(str: string): boolean {
	return str === null || str.match(/^[\s\n\r\t]*$/) !== null;
}

