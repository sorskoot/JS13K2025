import type {Component, Entity} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';

const schema = {
    ray: {type: 'selector', default: '#gunray'},
} as const;

type ShootData = DataOf<typeof schema>;
type ShootComponent = Component<ShootData> & {
    _buttonDown: (event: Event) => void;
};
interface ButtonEvent {
    id: number;
}
AFRAME.registerComponent('shoot', {
    schema,
    init: function (this: ShootComponent) {
        this._buttonDown = (event: Event) => {
            const buttonEvent = event as CustomEvent<ButtonEvent>;
            if (buttonEvent.detail.id !== 0) return; // only respond to trigger button

            const intersects: Entity[] = this.data.ray.components.raycaster.intersectedEls;
            if (intersects.length > 0) {
                const hit = intersects[0];
                if (hit.classList.contains('m')) {
                    hit.setAttribute('self-destruct', {timer: 50});
                }
            }
        };
    },
    play: function (this: ShootComponent) {
        this.el.addEventListener('buttondown', this._buttonDown);
    },
    pause: function (this: ShootComponent) {
        this.el.removeEventListener('buttondown', this._buttonDown);
    },
});
