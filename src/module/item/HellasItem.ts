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
import {HellasSkillItem} from "./HellasSkillItem"
import {HellasWeaponItem} from "./HellasWeaponItem"

export const HellasItem = new Proxy(function () {}, {

    //Calling a constructor from this proxy object
    construct: function (target, info, ...args) {
        const [data, newTarget] = info

        switch (data.type) {
            case HellasSkillItem.type:
                return new HellasSkillItem(data, newTarget)
			case HellasWeaponItem.type:
				return new HellasWeaponItem(data, newTarget)
        }
    },

    //Property access on this weird, dirty proxy object
    get: function (target, prop, receiver) {
        switch (prop) {
            case "create":
                //Calling the class' create() static function
                return function (data, options) {
                    switch (data.type) {
                        case HellasSkillItem.type:
                            return HellasSkillItem.create(data, options)
						case HellasWeaponItem.type:
							return HellasWeaponItem.create(data, options)
                    }
                };

            case Symbol.hasInstance:
                //Applying the "instanceof" operator on the instance object
                return function (instance) {
                    return (
                        instance instanceof HellasSkillItem ||
							HellasWeaponItem ||
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

