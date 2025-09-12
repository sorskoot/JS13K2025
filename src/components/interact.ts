import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {ButtonEvent} from '../types/world-types.js';

const schema = {
    // example: myProp: { type: 'number', default: 0 },
} as const;

type InteractData = DataOf<typeof schema>;
type InteractComponent = Component<InteractData> & {
    _buttonDown: (event: Event) => void;
    _buttonUp: (event: Event) => void;
};
const pos = new THREE.Vector3();
AFRAME.registerComponent('interact', {
    schema,
    init: function (this: InteractComponent) {
        this._buttonDown = (event: Event) => {
            const buttonEvent = event as CustomEvent<ButtonEvent>;
            if (buttonEvent.detail.id !== 0) return; // only respond to trigger button
            // handle a buttonpress and emit an event
            this.el.object3D.getWorldPosition(pos);
            this.el.sceneEl!.emit('interact', {
                pos: pos.clone(),
            });
        };
        this._buttonUp = (event: Event) => {
            const buttonEvent = event as CustomEvent<ButtonEvent>;
            if (buttonEvent.detail.id !== 0) return; // only respond to trigger button
            this.el.sceneEl!.emit('interactEnd');
        };
    },
    play: function (this: InteractComponent) {
        this.el.addEventListener('buttondown', this._buttonDown);
        this.el.addEventListener('buttonup', this._buttonUp);
    },
    pause: function (this: InteractComponent) {
        this.el.removeEventListener('buttondown', this._buttonDown);
        this.el.removeEventListener('buttonup', this._buttonUp);
    },
});
