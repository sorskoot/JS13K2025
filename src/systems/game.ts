import {System} from 'aframe';
import {DataOf} from '../lib/aframe-utils.js';
import {Rotation} from '../lib/encoder.js';
import {HoleSpec} from '../types/world-types.js';

const schema = {} as const;

type GameData = DataOf<typeof schema>;
export type NavGrid = {
    w: number;
    d: number;
    occ: Uint8Array;
};
export type GameSystem = System<GameData> & {
    grid: NavGrid;
    registerMouseHole: (x: number, z: number) => void;
    _mouseHoles: Map<string, HoleSpec>;
};

AFRAME.registerSystem('game', {
    schema: {},

    init(this: GameSystem) {},
    tick: function (this: GameSystem, time: number, timeDelta: number) {
        // Called each frame before render
    },
    registerMouseHole(this: GameSystem, hole: HoleSpec) {
        const key = `${hole.x},${hole.z}`;
        this._mouseHoles.set(key, hole);
    },
});
