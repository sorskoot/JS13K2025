import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {VoxelEngine} from '../lib/voxelengine.js';
import {addModelFromEncoded} from '../lib/encoder.js';
import {bomb} from '../models.js';
import {GameState, StateChangeEvent} from '../types/world-types.js';
import {Coroutine, CoroutineSystem, waitForSeconds} from '../systems/coroutine.js';
import {GameSystem} from '../systems/game.js';

const schema = {
    // example: myProp: { type: 'number', default: 0 },
} as const;

type BombData = DataOf<typeof schema>;
export type BombComponent = Component<BombData> & {
    // Add custom properties/methods here
    start: () => void;
    _coroutineId?: number;
    _countDown: () => Generator<any, void, unknown>;
};

AFRAME.registerComponent('bomb', {
    schema,
    init: function (this: BombComponent) {
        const pe = new VoxelEngine({metersX: 1, metersY: 1, metersZ: 1}); // Small engine for plank
        addModelFromEncoded(bomb, pe, 0, new THREE.Vector3());
        this.el.setObject3D('mesh', pe.getMesh());
        this.el.sceneEl!.addEventListener('gamestatechange', (event) => {
            const detail = (event as CustomEvent<StateChangeEvent>).detail;
            if (detail.newState === GameState.Playing) {
                this.start();
            } else {
                (this.el.sceneEl!.systems.coroutine as CoroutineSystem).stopCoroutine(this._coroutineId!);
            }
        });
    },

    start: function (this: BombComponent) {
        this._coroutineId = (this.el.sceneEl!.systems.coroutine as CoroutineSystem).addCoroutine(
            new Coroutine(this._countDown())
        );
    },
    _countDown: function* (this: BombComponent) {
        // wait for 10 minutes
        yield* waitForSeconds(600);
        // tell game system the bomb has exploded
        (this.el.sceneEl!.systems.game as GameSystem).boom();

        // Do something dramatic here
    },
});
