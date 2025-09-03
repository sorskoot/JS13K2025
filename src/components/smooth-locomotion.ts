import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {Vector3} from 'three';

const schema = {
    speed: {type: 'number', default: 0.005},
    camera: {type: 'selector', default: '#camera'},
    rig: {type: 'selector', default: '#rig'},
} as const;

type SmoothLocomotionData = DataOf<typeof schema>;
type SmoothLocomotionComponent = Component<SmoothLocomotionData> & {
    _axisMoveHandler: (event: Event) => void;
    _velocity: Vector3;
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
        const position = this.data.rig.object3D.position;
        // TODO: Add collision detection here

        newPosition.copy(position).add(directionVector); // move
        newPosition.y = position.y; // lock y
        this.data.rig.object3D.position.copy(newPosition);
    },
});
