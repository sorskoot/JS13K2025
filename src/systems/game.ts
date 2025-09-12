import {System} from 'aframe';
import {DataOf} from '../lib/aframe-utils.js';
import {addModelFromEncoded} from '../lib/encoder.js';
import {HoleSpec, InteractEvent} from '../types/world-types.js';
import {Coroutine, CoroutineSystem, waitForSeconds} from './coroutine.js';
import {Intersection, Object3D, Vector3} from 'three';
import {VoxelEngine} from '../lib/voxelengine.js';
import {plank} from '../models.js';

declare const DEBUG: boolean;
const schema = {} as const;

const v = new THREE.Vector3();
type GameData = DataOf<typeof schema>;
export type NavGrid = {
    w: number;
    d: number;
    occ: Uint8Array;
};
export type GameSystem = System<GameData> & {
    grid: NavGrid;
    setGrid: (w: number, d: number, occ: Uint8Array) => void;
    registerMouseHole: (hole: HoleSpec) => void;
    blockMouseHole: (x: number, z: number) => void;
    isEmpty: (x: number, z: number) => boolean;
    /**
     * Casts a ray and returns the intersection data (or null if no intersection)
     */
    rayCast(this: GameSystem, from: Vector3, to: Vector3): Intersection | null;
    /*
     * Regular raycast that returns the intersection data (or null if no intersection)
     */
    rayCastD(this: GameSystem, from: Vector3, to: Vector3): Intersection | null;
    removeMouse: (mouse: Object3D) => void;
    _mouseHoles: Map<string, HoleSpec>;
    _coroutines: Map<string, number>;
    _coroutineSystem: CoroutineSystem;
    _activateMouseHole: (hole: HoleSpec) => boolean;
    _spawnMouseAt: (hole: HoleSpec) => Generator<any, void, unknown>;
    _getPlayerPosition: () => [number, number];
    currentPlayerPos: [number, number];
    worldMesh?: Object3D;
    _objs: Object3D[];
};

AFRAME.registerSystem('game', {
    schema,
    init(this: GameSystem) {
        this._mouseHoles = new Map();
        this._coroutines = new Map();
        this._objs = [];
        this._coroutineSystem = this.el.sceneEl!.systems['coroutine'] as CoroutineSystem;

        this.el.sceneEl!.addEventListener('interact', (event: Event) => {
            const detail = (event as CustomEvent<InteractEvent>).detail;
            this.blockMouseHole(detail.pos.x, detail.pos.z);
        });
    },
    tick: function (this: GameSystem, time: number, timeDelta: number) {
        // update mouse holes and spawn mice as needed
        this._mouseHoles.forEach((hole) => {
            if (hole.active) return;
            hole.active = this._activateMouseHole(hole);
        });
        this.currentPlayerPos = this._getPlayerPosition();
    },
    isEmpty(this: GameSystem, x: number, z: number): boolean {
        const g = this.grid;
        return x >= 0 && z >= 0 && x < g.w && z < g.d && g.occ[z * g.w + x] === 0;
    },
    rayCastD(this: GameSystem, from: Vector3, dir: Vector3): Intersection | null {
        // Create raycaster (one-off, not continuous)
        const raycaster = new THREE.Raycaster(from, dir, 0.25, 25);

        // Cast ray against world mesh
        const intersects = raycaster.intersectObjects([this.worldMesh!, ...this._objs], true);

        if (intersects.length > 0) {
            return intersects[0];
        }

        return null;
    },

    rayCast(this: GameSystem, from: Vector3, to: Vector3): Intersection | null {
        const direction = to.clone().sub(from).normalize();
        return this.rayCastD(from, direction);
    },

    setGrid(this: GameSystem, w: number, d: number, occ: Uint8Array) {
        this.grid = {w, d, occ};
        if (DEBUG) {
            //draw grid to canvas for debugging, is removed in production build
            const canvas = document.createElement('canvas');
            canvas.width = (w - 7) * 10;
            canvas.height = (d - 12) * 10;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < occ.length; i++) {
                const x = (i % w) * 10;
                const y = Math.floor(i / w) * 10;
                ctx.fillStyle = 'lightgray';
                ctx.fillRect(x + 1, y + 1, 8, 8);
                ctx.fillStyle = 'black';
                if (occ[i] & 1) ctx.fillRect(x + 2, y + 6, 6, 2); // south wall
                if (occ[i] & 2) ctx.fillRect(x + 2, y + 2, 6, 2); // north wall
                if (occ[i] & 4) ctx.fillRect(x + 2, y + 2, 2, 6); // west wall
                if (occ[i] & 8) ctx.fillRect(x + 6, y + 2, 2, 6); // east wall
                if (occ[i] & 16) {
                    // Mouse hole
                    ctx.fillStyle = 'brown';
                    ctx.fillRect(x + 3, y + 3, 4, 4);
                }
                if (occ[i] & 32) {
                    // occupied
                    ctx.fillStyle = 'red';
                    ctx.fillRect(x + 3, y + 3, 4, 4);
                }
            }
            document.body.appendChild(canvas);
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
        }
    },
    registerMouseHole(this: GameSystem, hole: HoleSpec) {
        const key = `${hole.x},${hole.z}`;
        this._mouseHoles.set(key, hole);
    },
    /**
     * Block a mouse hole at the specified coordinates.
     * When a player leftclicks a mouse hole, a board is placed over it.
     * The mouse hole is just removed from the list to prevent further mice spawning.
     * @param x
     * @param z
     */
    blockMouseHole(this: GameSystem, x: number, z: number) {
        //TK: What happens to mice that have already spawned from this hole and need to hide?
        x = x | 0; // coerce to int
        z = z | 0; // coerce to int
        const key = `${x},${z}`;
        const h = this._mouseHoles.get(key);

        if (h) {
            const p = document.createElement('a-entity');
            const pe = new VoxelEngine({metersX: 1, metersY: 1, metersZ: 1}); // Small engine for plank
            addModelFromEncoded(plank, pe, h.rotation, new THREE.Vector3());
            p.setObject3D('mesh', pe.getMesh());
            p.setAttribute('position', `${h.x} 0 ${h.z}`);
            this.el.sceneEl?.appendChild(p);

            this._coroutineSystem.stopCoroutine(this._coroutines.get(key)!);
            this._mouseHoles.delete(key);
        }
    },
    playerPos(this: GameSystem): [number, number] {
        return this.currentPlayerPos;
    },
    _getPlayerPosition: function (this: GameSystem): [number, number] {
        this.el.sceneEl!.camera!.getWorldPosition(v);
        return [v.x, v.z];
    },
    _activateMouseHole(this: GameSystem, hole: HoleSpec): boolean {
        // normally we should check if the
        const id = this._coroutineSystem.addCoroutine(new Coroutine(this._spawnMouseAt(hole)));
        this._coroutines.set(`${hole.x},${hole.z}`, id);
        return true;
    },
    removeMouse(this: GameSystem, mouse: Object3D) {
        const idx = this._objs.indexOf(mouse);
        if (idx !== -1) {
            this._objs.splice(idx, 1);
        }
    },
    _spawnMouseAt: function* (this: GameSystem, hole: HoleSpec) {
        // wait a random time up to 10 seconds before first spawn so not all mice appear at once
        yield* waitForSeconds(Math.random() * 10);
        while (true) {
            // spawn mice at the set interval until the hole is blocked
            const mouseEl = document.createElement('a-entity');
            mouseEl.setAttribute('mixin', 'ms');
            mouseEl.classList.add('r', 'm'); // make raycastable, and "m" for mouse
            // const mouseEl = document.createElement('a-entity');
            // mouseEl.setAttribute('mouse', {t: 0.5});
            mouseEl.setAttribute('position', {x: hole.x + 0.5, y: 0, z: hole.z + 0.5});
            this.el.sceneEl?.appendChild(mouseEl);
            this._objs.push(mouseEl.object3D);
            yield* waitForSeconds(hole.spawnRate || 15);
        }
    },
});
