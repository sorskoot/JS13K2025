import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {addModelFromEncoded} from '../lib/encoder.js';
import {VoxelEngine} from '../lib/voxelengine.js';
import {Coroutine, CoroutineSystem, waitForSeconds} from '../systems/coroutine.js';
import {BufferGeometry, Vector3} from 'three';
import {GameSystem} from '../systems/game.js';

const schema = {
    /**
     * tick in ms
     */
    t: {type: 'number', default: 200},
    /**
     * s: speed per tick (m)
     */
    s: {type: 'number', default: 0.02},
    /**
     * ar: attack radius
     */
    ar: {type: 'number', default: 1.0},
    /**
     * hm: hide ms
     */
    hm: {type: 'number', default: 1200},
    /**
     * r: wander radius
     */
    r: {type: 'number', default: 2},
} as const;

type MouseData = DataOf<typeof schema>;
type MouseComponent = Component<MouseData> & {
    _coroutineId?: number;

    /**
     * Coroutine for mouse AI
     */
    ai: () => Generator<any, void, unknown>;

    /**
     * Original position where the mouse has spawned.
     * When hiding it runs back to this position.
     */
    _originPosition: Vector3;

    _getPlayerPosition: () => Vector3;

    /**
     * Check if there is a line of sight to the target position
     * @param targetPos The position to check
     * @returns True if there is a line of sight, false otherwise
     */
    _hasLOS: () => boolean;

    _game: GameSystem;
    _moveTo?: [number, number, number, number]; // x,z old and x,z target position to move to, undefined when not moving
    _t?: number; // time accumulator for movement
    _die: () => void;
};
enum State {
    wander = 0,
    attack = 1,
    hide = 2,
}

const c1 = new THREE.Vector3(); // temp vectors for LOS
const c2 = new THREE.Vector3();

AFRAME.registerComponent('mouse', {
    schema,
    init: function (this: MouseComponent) {
        const engine = new VoxelEngine({metersX: 1, metersY: 1, metersZ: 1});
        const mouse =
            '00000000,22000000,20000000,03000000,03300000,13300000,03330000,03333000,00333000,13332300,03333300,03430000|000122200344432005666520066666000766670089a6a98006b6b60000030000|4,30,3,12';

        addModelFromEncoded(mouse, engine);
        const voxelMesh = engine.getMesh();
        const geom = voxelMesh.geometry as BufferGeometry;
        geom.computeBoundingBox();
        const bb = geom.boundingBox!;
        const centerX = (bb.min.x + bb.max.x) / 2;
        const centerZ = (bb.min.z + bb.max.z) / 2;
        // translate so center X/Z -> 0, but keep Y so minY -> 0
        geom.translate(-centerX, -bb.min.y, -centerZ);
        //geom.computeBoundingSphere();

        this.el.setObject3D('mesh', voxelMesh);
        this._originPosition = this.el.object3D.position.clone();
        // this.data.t;
        this._game = this.el.sceneEl!.systems['game'] as GameSystem;
        // // dummy A* example
        // const grid = [
        //     [0, 0, 0, 0],
        //     [1, 1, 0, 1],
        //     [0, 0, 0, 0],
        //     [0, 1, 1, 0],
        // ];

        // const start: [number, number] = [0, 0];
        // const goal: [number, number] = [3, 3];

        // const path = astar(grid, start, goal);

        this._coroutineId = (this.el.sceneEl!.systems.coroutine as CoroutineSystem).addCoroutine(
            new Coroutine(this.ai())
        );
    },
    tick: function (this: MouseComponent, time: number, timeDelta: number) {
        if (this._moveTo) {
            if (this._t === undefined) {
                this._t = 0;
            }
            this._t += (timeDelta / 1000) * 1.3;
            // somehow lerp from old to new position over time
            const x = THREE.MathUtils.lerp(this._moveTo[0], this._moveTo[2], this._t);
            const z = THREE.MathUtils.lerp(this._moveTo[1], this._moveTo[3], this._t);
            this.el.setAttribute('position', {x, y: 0, z});
            // rotate to movement direction
            const dir = Math.atan2(this._moveTo[2] - this._moveTo[0], this._moveTo[3] - this._moveTo[1]);
            this.el.setAttribute('rotation', {x: 0, y: (dir * 180) / Math.PI - 90, z: 0});
            if (this._t > 1) {
                this._t = undefined;
                this._moveTo = undefined;
            }
        }
    },
    _hasLOS: function (this: MouseComponent): boolean {
        c1.set(this.el.object3D.position.x, 0.5, this.el.object3D.position.z);
        c2.set(this._game.currentPlayerPos[0], 0.5, this._game.currentPlayerPos[1]);
        const i = this._game.rayCast(c1, c2)!;
        // We have a LOS if the raycast does not hit anything or
        // hits something further away than the player
        //return i != null && i.distance < c1.distanceTo(c2);
        return i.distance > c1.distanceTo(c2);
    },
    _die: function (this: MouseComponent) {
        this._game.removeMouse(this.el.object3D);
        this.el.setAttribute('self-destruct', {timer: 1});
    },
    ai: function* (this: MouseComponent) {
        let state = State.wander;
        let d = 0; // counter for getting stuck state. If stuck for too long... Just kill it.
        while (true) {
            const pos = this.el.object3D.position;
            //if pos is outside level kill it
            if (pos.x < -1 || pos.x > this._game.grid.w || pos.z < -1 || pos.z > this._game.grid.d) {
                this._die();
                return;
            }
            if (state === State.hide) {
                // run back to origin
                const dirX = this._originPosition.x - pos.x;
                const dirZ = this._originPosition.z - pos.z;
                const dist = Math.sqrt(dirX * dirX + dirZ * dirZ);
                if (dist > 1.8) {
                    const normX = dirX / dist;
                    const normZ = dirZ / dist;
                    const stepX = Math.abs(normX) < 0.5 ? 0 : normX > 0 ? 1 : -1;
                    const stepZ = Math.abs(normZ) < 0.5 ? 0 : normZ > 0 ? 1 : -1;
                    const targetX = ~~(pos.x + stepX);
                    const targetZ = ~~(pos.z + stepZ);
                    if (this._game.isEmpty(targetX, targetZ)) {
                        d = 0;
                        this._moveTo = [pos.x, pos.z, targetX + 0.5, targetZ + 0.5]; // add 0.5 to center in the cell
                        while (this._moveTo) {
                            yield;
                        }
                    } else {
                        d++;
                        if (d > 10) {
                            this._die();
                            return;
                        }
                        this._moveTo = undefined;
                        yield* waitForSeconds(0.2); // wait a bit
                    }
                } else {
                    this._die();
                    return; // reached origin, despawn end of coroutine
                }
                continue; // no other states, just run back to origin
            }

            // What do we need to do?
            if (state === State.wander && this._hasLOS()) {
                state = State.attack;
            }

            if (state === State.attack) {
                const dirX = this._game.currentPlayerPos[0] - pos.x;
                const dirZ = this._game.currentPlayerPos[1] - pos.z;
                const dist = Math.sqrt(dirX * dirX + dirZ * dirZ);
                //TODO: Might go back to wander if distance is too big.
                if (dist < this.data.ar) {
                    this._game.bite();
                    state = State.hide;
                    continue;
                }

                const normX = dirX / dist;
                const normZ = dirZ / dist;
                const stepX = Math.abs(normX) < 0.5 ? 0 : normX > 0 ? 1 : -1;
                const stepZ = Math.abs(normZ) < 0.5 ? 0 : normZ > 0 ? 1 : -1;
                const targetX = ~~(pos.x + stepX);
                const targetZ = ~~(pos.z + stepZ);
                if (this._game.isEmpty(targetX, targetZ)) {
                    this._moveTo = [pos.x, pos.z, targetX + 0.5, targetZ + 0.5]; // add 0.5 to center in the cell

                    while (this._moveTo) {
                        yield;
                    }
                } else {
                    this._moveTo = undefined;
                    state = State.wander;
                    // cant move directly towards player,
                    // wander 1 cycle, the try again if LOS.

                    // TODO: improvement would be to move at least left or right to try to get around obstacle
                }
            }

            if (state === State.wander) {
                // Just wandering around
                const randomX = Math.round(Math.random() * 2) - 1; // -1, 0, or 1
                const randomZ = Math.round(Math.random() * 2) - 1; // -1, 0, or 1
                // can we go there?

                const targetX = ~~(pos.x + randomX);
                const targetZ = ~~(pos.z + randomZ);
                if (!(randomX === 0 && randomZ === 0) && this._game.isEmpty(targetX, targetZ)) {
                    this._moveTo = [pos.x, pos.z, targetX + 0.5, targetZ + 0.5]; // add 0.5 to center in the cell
                } else {
                    this._moveTo = undefined;
                    yield;
                }
                while (this._moveTo) {
                    yield;
                }
            }
        }
    },
});
