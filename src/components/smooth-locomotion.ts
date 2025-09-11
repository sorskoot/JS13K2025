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
        const blocked = (x: number, z: number) => {
            const c = (xx: number, zz: number) => {
                let xi = xx | 0;
                if (xi < 0) xi = 0;
                else if (xi >= g.w) xi = g.w - 1;
                let zi = zz | 0;
                if (zi < 0) zi = 0;
                else if (zi >= g.d) zi = g.d - 1;
                return g.occ[xi + zi * g.w];
            };
            /*TK: This needs to change when colliding with walls. Walls are not full cells.
                O[] & 1 => south wall - +y
                O[] & 2 => north wall - -y
                O[] & 4 => west wall - -x
                O[] & 8 => east wall - +x
                O[] & 16 => Mouse hole - We can ignore this, because they are inside the walls
                O[] & 32 => occupied - treat as full block

                // We now check the position in 4 locations around the player.
                // If one of these location is 32 (occupied) we block movement.
                // Since we need to be able to move closer to the walls, we need to allow a bit more.
                //
            */
            if ((c(x - r, z) | c(x + r, z) | c(x, z - r) | c(x, z + r)) & 32) return true; // One of the positions is occupied, block movement
            // Now check for walls
            if (directionVector.x > 0 && c(x - r, z) & 8) return true; // east wall
            if (directionVector.x < 0 && c(x + r, z) & 4) return true; // west wall
            if (directionVector.z > 0 && c(x, z - r) & 1) return true; // south wall
            if (directionVector.z < 0 && c(x, z + r) & 2) return true; // north wall

            return false;
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
