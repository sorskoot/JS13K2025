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

const directionVector = new THREE.Vector3(0, 0, 0);
const rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ');

export const smoothLocomotionComponent = {
    schema,
    init: function (this: SmoothLocomotionComponent) {
        this._velocity = new THREE.Vector3(0, 0, 0);
        this._axisMoveHandler = (event: Event) => {
            const evt = event as CustomEvent<AxisMoveEvent>;
            const {axis, changed} = evt.detail;

            // values are in range [-1, 1]
            const forward = THREE.MathUtils.lerp(-this.data.speed, this.data.speed, (axis[3] + 1) / 2);
            const right = THREE.MathUtils.lerp(-this.data.speed, this.data.speed, (axis[2] + 1) / 2);
            this._velocity.z = forward;
            this._velocity.x = right;
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
        directionVector.copy(this._velocity);
        directionVector.multiplyScalar(timeDelta);
        // Transform direction relative to heading.
        rotationEuler.set(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), 0);
        directionVector.applyEuler(rotationEuler);
        const newPosition = new THREE.Vector3();

        newPosition.copy(this.data.rig.object3D.position);
        newPosition.add(directionVector);
        console.log(newPosition);
        this.data.rig.object3D.position.copy(newPosition);
    },
};
