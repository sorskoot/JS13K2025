import {System} from 'aframe';
import {DataOf} from '../lib/aframe-utils.js';
import {Rotation} from '../lib/encoder.js';
import {HoleSpec} from '../types/world-types.js';
import {Coroutine, CoroutineSystem, waitForSeconds} from './coroutine.js';

const schema = {} as const;

type GameData = DataOf<typeof schema>;
export type NavGrid = {
    w: number;
    d: number;
    occ: Uint8Array;
};
export type GameSystem = System<GameData> & {
    grid: NavGrid;
    registerMouseHole: (hole: HoleSpec) => void;
    blockMouseHole: (x: number, z: number) => void;
    _mouseHoles: Map<string, HoleSpec>;
    _coroutines: Map<string, number>;
    _coroutineSystem: CoroutineSystem;
    _activateMouseHole: (hole: HoleSpec) => boolean;
    _spawnMouseAt: (hole: HoleSpec) => Generator<any, void, unknown>;
};

AFRAME.registerSystem('game', {
    schema: {},

    init(this: GameSystem) {
        this._mouseHoles = new Map();
        this._coroutines = new Map();
        this._coroutineSystem = this.el.sceneEl!.systems['coroutine'] as CoroutineSystem;
    },
    tick: function (this: GameSystem, time: number, timeDelta: number) {
        // update mouse holes and spawn mice as needed
        this._mouseHoles.forEach((hole) => {
            if (hole.active) return;
            hole.active = this._activateMouseHole(hole);
        });
    },
    registerMouseHole(this: GameSystem, hole: HoleSpec) {
        // TODO: Add room offset too so holes are in `world` coords
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
        const key = `${x},${z}`;
        this._coroutineSystem.stopCoroutine(this._coroutines.get(key) || -1);
        this._mouseHoles.delete(key);
    },

    _activateMouseHole(this: GameSystem, hole: HoleSpec): boolean {
        // normally we should check if the
        const id = this._coroutineSystem.addCoroutine(new Coroutine(this._spawnMouseAt(hole)));
        this._coroutines.set(`${hole.x},${hole.z}`, id);
        return true;
    },
    _spawnMouseAt: function* (this: GameSystem, hole: HoleSpec) {
        // wait a random time up to 10 seconds before first spawn so not all mice appear at once
        yield* waitForSeconds(Math.random() * 10);
        while (true) {
            // spawn mice at the set interval until the hole is blocked
            const mouseEl = document.createElement('a-entity');
            mouseEl.setAttribute('mixin', 'ms');
            // const mouseEl = document.createElement('a-entity');
            // mouseEl.setAttribute('mouse', {t: 0.5});
            mouseEl.setAttribute('position', {x: hole.x + 0.5, y: 0, z: hole.z + 0.5});
            this.el.sceneEl?.appendChild(mouseEl);
            console.log('Spawned a mouse at', hole.x, hole.z);
            yield* waitForSeconds(hole.spawnRate || 15);
        }
    },
});
