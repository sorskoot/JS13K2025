import {System} from 'aframe';
import {DataOf} from '../lib/aframe-utils.js';

const schema = {} as const;

type GameData = DataOf<typeof schema>;
type GameSystem = System<GameData> & {};

AFRAME.registerSystem('game', {
    schema: {},

    init(this: GameSystem) {},
    tick: function (this: GameSystem, time: number, timeDelta: number) {
        // Called each frame before render
    },
});
