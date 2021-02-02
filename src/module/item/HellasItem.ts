/**
 * Maelstrom item base class
 *
 * Acts as a mix of factory and proxy: depending on its "type" argument,
 * creates an object of the right class (also extending Item) and simply
 * overrides its own properties with that of that new objects.
 *
 * This is used since Item doesn't really allow for real inheritance, so
 * we're simply faking it. #yolo #ididntchoosethethuglife
 *
 * @export
 * @class HellasItem
 * @extends {Item}
 */
import {HellasSkillItem, SkillItemType} from "./HellasSkillItem"
import {SPECIFY_SUBTYPE} from "../config"
import {isEmptyOrSpaces} from "../settings"

export const HellasItem = new Proxy(function () {}, {

    //Calling a constructor from this proxy object
    construct: function (target, info, ...args) {
        const [data, newTarget] = info

        console.log('construct item type = ' + data.type)

        switch (data.type) {
            case HellasSkillItem.type:
                return new HellasSkillItem(data, newTarget)
        }
    },

    //Property access on this weird, dirty proxy object
    get: function (target, prop, receiver) {
        switch (prop) {
            case "create":
                //Calling the class' create() static function
                return function (data, options) {
                    console.log('new item type = ' + data.type)

                    switch (data.type) {
                        case HellasSkillItem.type:
                            return HellasSkillItem.create(data, options)
                    }
                };

            case Symbol.hasInstance:
                //Applying the "instanceof" operator on the instance object
                return function (instance) {
                    return (
                        instance instanceof HellasSkillItem ||
                        // other instanceof
                        false
                    );
                };

            default:
                //Just forward any requested properties to the base Actor class
                return Item[prop];
        }
    },
});

export function fullName(item: Item): string {
	switch (item.type) {
		case HellasSkillItem.type:
			let skill = item as unknown as SkillItemType;

			let skillName = skill.data.skill
			const specifier = skill.data.specifier
			const specifierCustom = skill.data.specifierCustom

			if (SPECIFY_SUBTYPE === specifier && !isEmptyOrSpaces(specifierCustom)) {
				skillName = `${skillName} ${specifierCustom}`
			}
			else if (!isEmptyOrSpaces(specifier))
				skillName = `${skillName} ${specifier}`

			return skillName
		default:
			break
	}

	return ''
}
