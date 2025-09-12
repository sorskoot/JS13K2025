import {Entity, System} from 'aframe';
import {DataOf} from '../lib/aframe-utils.js';
import {addModelFromEncoded} from '../lib/encoder.js';
import {GameState, HoleSpec, InteractEvent} from '../types/world-types.js';
import {Coroutine, CoroutineSystem, waitForSeconds} from './coroutine.js';
import {Intersection, Object3D, Vector3} from 'three';
import {VoxelEngine} from '../lib/voxelengine.js';
import {plank} from '../models.js';
import {BombComponent} from '../components/bomb.js';
import {neighbors, rooms} from '../map.js';

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
    currentPlayerPos: [number, number];
    worldMesh?: Object3D;
    bomb?: BombComponent;
    boom: () => void;
    gameState: GameState;
    changeGameState: (newState: GameState) => void;
    gameOver: () => void;
    addLamp: (lamp: Entity) => void;
    updateLamps: () => void;
    bite: () => void;
    _lamps: Entity[];
    _mouseHoles: Map<string, HoleSpec>;
    _coroutines: Map<string, number>;
    _coroutineSystem: CoroutineSystem;
    _activateMouseHole: (hole: HoleSpec) => boolean;
    _spawnMouseAt: (hole: HoleSpec) => Generator<any, void, unknown>;
    _getPlayerPosition: () => [number, number];
    _objs: Object3D[];
    _lives: number;
    currentRoom: number;
    notify: (message: string) => void;
    notifyCR: (message: string) => Generator<any, void, unknown>;
    notifyCRID?: number;
    text: Entity;
};

AFRAME.registerSystem('game', {
    schema,
    init(this: GameSystem) {
        this.gameState = GameState.Title;
        this._lives = 9;
        this._mouseHoles = new Map();
        this._coroutines = new Map();
        this._objs = [];
        this._lamps = [];
        this._coroutineSystem = this.el.sceneEl!.systems['coroutine'] as CoroutineSystem;
        this.currentRoom = -1;
        this.text = this.el.sceneEl!.querySelector('#t')!;
        this.text.setAttribute('visible', 'false');
        this.el.sceneEl!.addEventListener('enter-vr', () => {
            this.changeGameState(GameState.Playing);
        });

        this.el.sceneEl!.addEventListener('interact', (event: Event) => {
            const detail = (event as CustomEvent<InteractEvent>).detail;
            if (this.grid.occ[(detail.pos.x | 0) + (detail.pos.z | 0) * this.grid.w] & 64) {
                // touching the bomb
                // Game Win!
                if (this.bomb) {
                    this.bomb.el.setAttribute('visible', 'false');
                    this.changeGameState(GameState.Win);
                }
            } else {
                this.blockMouseHole(detail.pos.x, detail.pos.z);
            }
        });
        this.el.sceneEl!.addEventListener('interactEnd', (event: Event) => {});
    },
    notify(this: GameSystem, message: string) {
        if (this.notifyCRID) {
            this._coroutineSystem.stopCoroutine(this.notifyCRID);
        }
        this.notifyCRID = this._coroutineSystem.addCoroutine(new Coroutine(this.notifyCR(message)));
    },
    bite(this: GameSystem) {
        this._lives--;
        if (this._lives <= 0) {
            this.gameOver();
        } else {
            // Maybe flash the screen red or something
            this.notify(`Ouch! You have ${this._lives} lives left.`);
        }
    },
    notifyCR: function* (this: GameSystem, message: string) {
        this.text.setAttribute('text', 'value', message);
        this.text.setAttribute('visible', 'true');
        yield* waitForSeconds(3);
        this.text.setAttribute('visible', 'false');
    },
    updateLamps(this: GameSystem) {
        for (let i = 0; i < this._lamps.length; i++) {
            if (i === this.currentRoom || neighbors[this.currentRoom]?.includes(i)) {
                this._lamps[i].setAttribute('visible', 'true');
            } else {
                this._lamps[i].setAttribute('visible', 'false');
            }
        }
    },

    tick: function (this: GameSystem, time: number, timeDelta: number) {
        if (this.gameState !== GameState.Playing) {
            return;
        }

        // update mouse holes and spawn mice as needed
        // this._mouseHoles.forEach((hole) => {
        //     if (hole.active) return;
        //     hole.active = this._activateMouseHole(hole);
        // });
        this.currentPlayerPos = this._getPlayerPosition();

        // check what room the player is in
        let [px, pz] = this.currentPlayerPos;
        px = px | 0;
        pz = pz | 0;
        rooms.forEach((r, i) => {
            if (
                px >= r.origin[0] &&
                px < r.origin[0] + r.size[0] &&
                pz >= r.origin[2] &&
                pz < r.origin[2] + r.size[1]
            ) {
                if (this.currentRoom !== i) {
                    this.currentRoom = i;
                    this.updateLamps();

                    this._mouseHoles.forEach((hole) => {
                        if (hole.roomid === i) {
                            if (!hole.active) {
                                hole.active = this._activateMouseHole(hole);
                            }
                        } else {
                            hole.active = false;
                            const key = `${hole.x},${hole.z}`;
                            this._coroutineSystem.stopCoroutine(this._coroutines.get(key)!);
                            this._coroutines.delete(key);
                        }
                    });
                }
            }
        });
    },
    isEmpty(this: GameSystem, x: number, z: number): boolean {
        const g = this.grid;
        return x >= 0 && z >= 0 && x < g.w && z < g.d && g.occ[z * g.w + x] === 0;
    },
    addLamp(this: GameSystem, lamp: Entity) {
        this._lamps.push(lamp);
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
    changeGameState(this: GameSystem, newState: GameState) {
        this.gameState = newState;
        this.el.sceneEl!.emit('gamestatechange', {newState});
    },
    boom(this: GameSystem) {
        console.log('BOOM! Game Over!');
        this.gameOver();
    },
    gameOver(this: GameSystem) {
        this.changeGameState(GameState.GameOver);

        this._coroutines.forEach((id) => {
            this._coroutineSystem.stopCoroutine(id);
        });
        const m = document.getElementsByClassName('m');
        for (let i = 0; i < m.length; i++) {
            m[i].remove();
        }
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
            p.classList.add('b'); // mark as board
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
        yield* waitForSeconds(Math.random() * 2);
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
            yield* waitForSeconds(hole.spawnRate || 8);
        }
    },
});
