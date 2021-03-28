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
import {HellasArmorItem} from "./HellasArmorItem"
import {HellasDynamismItem} from "./HellasDynamismItem"
import {HellasTalentItem} from "./HellasTalentItem"

export const HellasItem = new Proxy(function () {}, {

    //Calling a constructor from this proxy object
    construct: function (target, info, ...args) {
        const [data, newTarget] = info

        switch (data.type) {
            case HellasSkillItem.type:
                return new HellasSkillItem(data, newTarget)
			case HellasWeaponItem.type:
				return new HellasWeaponItem(data, newTarget)
			case HellasArmorItem.type:
				return new HellasArmorItem(data, newTarget)
			case HellasDynamismItem.type:
				return new HellasDynamismItem(data, newTarget)
			case HellasTalentItem.type:
				return new HellasTalentItem(data, newTarget)
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
						case HellasArmorItem.type:
							return HellasArmorItem.create(data, options)
						case HellasDynamismItem.type:
							return HellasDynamismItem.create(data, options)
						case HellasTalentItem.type:
							return HellasTalentItem.create(data, options)
                    }
                };

            case Symbol.hasInstance:
                //Applying the "instanceof" operator on the instance object
                return function (instance) {
                    return (
                        instance instanceof HellasSkillItem ||
							HellasWeaponItem ||
							HellasArmorItem ||
							HellasDynamismItem ||
							HellasTalentItem ||
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

