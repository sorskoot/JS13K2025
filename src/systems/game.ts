import {System} from 'aframe';
import {DataOf} from '../lib/aframe-utils.js';

const schema = {} as const;

type GameData = DataOf<typeof schema>;
export type NavGrid = {
    w: number;
    d: number;
    occ: Uint8Array;
};
export type GameSystem = System<GameData> & {
    grid: NavGrid;
};

AFRAME.registerSystem('game', {
    schema: {},

    init(this: GameSystem) {},
    tick: function (this: GameSystem, time: number, timeDelta: number) {
        // Called each frame before render
    },
});
