import type {Component, Entity} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {GameSystem} from '../systems/game.js';
import {Object3D} from 'three';

const schema = {} as const;

type ShootData = DataOf<typeof schema>;
type ShootComponent = Component<ShootData> & {
    _buttonDown: (event: Event) => void;
    _g: GameSystem;
    _l: Entity;
};
interface ButtonEvent {
    id: number;
}
const from = new THREE.Vector3();
const dir = new THREE.Vector3();

AFRAME.registerComponent('shoot', {
    schema,
    init: function (this: ShootComponent) {
        this._g = this.el.sceneEl!.systems['game'] as GameSystem;
        const l = document.createElement('a-light');
        l.setAttribute('type', 'point');
        l.setAttribute('intensity', 0);
        l.setAttribute('distance', 10);
        l.setAttribute('color', 'cyan');
        l.setAttribute('position', '0.007 0.07 -.07');
        this.el.appendChild(l);
        const ll = document.createElement('a-box');
        ll.setAttribute('position', '0.007 0.07 -5.021');
        ll.setAttribute('depth', '10');
        ll.setAttribute('height', '0.007');
        ll.setAttribute('width', '0.007');
        ll.setAttribute('material', 'color: cyan; shader: flat');
        ll.setAttribute('visible', 'false');
        this.el.appendChild(ll);
        this._buttonDown = (event: Event) => {
            const buttonEvent = event as CustomEvent<ButtonEvent>;
            if (buttonEvent.detail.id !== 0) return; // only respond to trigger button
            this.el.object3D.getWorldPosition(from);
            from.y += 0.07;
            this.el.object3D.getWorldDirection(dir);
            dir.multiplyScalar(-1);
            const int = this._g.rayCastD(from, dir);
            ll.setAttribute('visible', 'true');
            // flash light
            // this._l.setAttribute('position', from);
            l.setAttribute('intensity', 2);
            setTimeout(() => {
                ll.setAttribute('visible', 'false');
                l.setAttribute('intensity', 0);
            }, 50);

            if ((int?.object as any).el.classList?.contains('m')) {
                let explosion = document.createElement('a-entity');
                explosion.setAttribute('position', int!.point);
                explosion.setAttribute('particles', {});
                this.el.sceneEl!.appendChild(explosion);
                (int?.object as any).el.components.mouse._die();
            } else if (int) {
                const cube = document.createElement('a-box');
                cube.setAttribute('position', int.point);
                cube.setAttribute('scale', {x: 0.05, y: 0.05, z: 0.05});
                cube.setAttribute('color', 'black');
                cube.setAttribute('self-destruct', {timer: 2500});
                this.el.sceneEl!.appendChild(cube);
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
