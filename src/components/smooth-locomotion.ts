import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {Vector3} from 'three';
import {GameSystem, NavGrid} from '../systems/game.js';

const schema = {
    speed: {type: 'number', default: 0.005},
    camera: {type: 'selector', default: '#camera'},
    rig: {type: 'selector', default: '#rig'},
} as const;

type SmoothLocomotionData = DataOf<typeof schema>;
type SmoothLocomotionComponent = Component<SmoothLocomotionData> & {
    _axisMoveHandler: (event: Event) => void;
    _velocity: Vector3;
    _navGrid?: NavGrid;
};

interface AxisMoveEvent {
    axis: [number, number, number, number];
    changed: [boolean, boolean, boolean, boolean];
}

const directionVector = new THREE.Vector3();
const rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const newPosition = new THREE.Vector3();

AFRAME.registerComponent('smooth-locomotion', {
    schema,
    init: function (this: SmoothLocomotionComponent) {
        this._velocity = new THREE.Vector3();
        const gameSystem = this.el.sceneEl?.systems['game'] as GameSystem;
        this._navGrid = gameSystem.grid;

        this._axisMoveHandler = (event: Event) => {
            const {axis} = (event as CustomEvent<AxisMoveEvent>).detail;
            const s = this.data.speed;
            this._velocity.z = axis[3] * s;
            this._velocity.x = axis[2] * s;
        };
    },
    play: function (this: SmoothLocomotionComponent) {
        this.el.addEventListener('axismove', this._axisMoveHandler);
    },
    pause: function (this: SmoothLocomotionComponent) {
        this.el.removeEventListener('axismove', this._axisMoveHandler);
    },
    tick: function (this: SmoothLocomotionComponent, time: number, timeDelta: number) {
        const rotation = this.data.camera.getAttribute('rotation');
        const rigRotation = this.data.rig.getAttribute('rotation');
        directionVector.copy(this._velocity).multiplyScalar(timeDelta);
        rotationEuler.set(
            ((rotation.x + rigRotation.x) * Math.PI) / 180,
            ((rotation.y + rigRotation.y) * Math.PI) / 180,
            0
        );
        directionVector.applyEuler(rotationEuler);
        const pos = this.data.rig.object3D.position;

        // 2D grid collision (ignore floor layers)
        const g = this._navGrid!;
        const r = 0.2; // player radius (meters). Tweak 0.25–0.35 for door clearance.
        const offX = 5,
            offZ = 10; // world entity is positioned at (-5, 0, -5) → shift to grid indices
        const blocked = (x: number, z: number) => {
            const W = g.w,
                D = g.d,
                O = g.occ;
            const c = (xx: number, zz: number) => {
                // apply world→grid meter offset, then clamp
                let xi = (xx + offX) | 0;
                if (xi < 0) xi = 0;
                else if (xi >= W) xi = W - 1;
                let zi = (zz + offZ) | 0;
                if (zi < 0) zi = 0;
                else if (zi >= D) zi = D - 1;
                return O[xi + zi * W];
            };
            return (c(x - r, z) | c(x + r, z) | c(x, z - r) | c(x, z + r)) > 0;
        };

        const nx = pos.x + directionVector.x;
        const nz = pos.z + directionVector.z;

        if (!blocked(nx, nz)) {
            pos.set(nx, pos.y, nz);
        } else if (!blocked(nx, pos.z)) {
            pos.x = nx;
        } else if (!blocked(pos.x, nz)) {
            pos.z = nz;
        }

        // newPosition.copy(pos).add(directionVector); // move
        // newPosition.y = pos.y; // lock y
        this.data.rig.object3D.position.copy(pos);
    },
});
