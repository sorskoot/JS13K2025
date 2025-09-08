/**
 * A lightweight coroutine system registered as the "coroutine" A-Frame system.
 *
 * This system schedules user-defined coroutines implemented as JavaScript
 * Generators. Once per A-Frame frame it advances each coroutine with
 * `generator.next(deltaMs)`, where `deltaMs` is the time elapsed since the
 * previous tick in milliseconds. When a generator completes (`done === true`),
 * the coroutine is removed automatically.
 *
 * Use this for simple frame-driven async logic (timers, sequences, state
 * machines) without Promises. The delta time for each frame is provided to the
 * generator via `next(value)`.
 *
 * Important generator semantics:
 * - The argument passed to the very first `next(value)` call is ignored by the
 *   JS generator spec. To receive a delta on your first loop, start your
 *   coroutine with a `yield;` to "prime" it, then read the delta on subsequent
 *   resumes.
 * - The `deltaMs` value is in milliseconds. Helpers in this file accepting
 *   seconds convert appropriately.
 *
 * Key behaviors:
 * - Coroutines are stored in a Map keyed by numeric id.
 * - `addCoroutine` returns a numeric id that can be used with `stopCoroutine`.
 * - The system's `tick` advances each coroutine and removes finished ones.
 *
 * Examples
 * --------
 * 1) Run for ~1 second and toggle visibility:
 *
 * const sys = AFRAME.scenes[0].systems['coroutine'] as unknown as CoroutineSystem;
 * const id = sys.addCoroutine(new Coroutine(function* () {
 *   let t = 0;
 *   yield; // prime so the next resume delivers the first deltaMs
 *   while (t < 1000) {
 *     const dt = (yield) as number; // dt in ms
 *     t += dt;
 *     // do per-frame work (e.g., toggle)
 *   }
 * }()));
 * // sys.stopCoroutine(id) to cancel early
 *
 * 2) Inside an A-Frame component (typed):
 *
 * AFRAME.registerComponent('blinker', {
 *   schema: { ms: { type: 'number', default: 1000 } },
 *   init: function () {
 *     const sys = this.el.sceneEl!.systems['coroutine'] as unknown as CoroutineSystem;
 *     const el = this.el;
 *     this._co = sys.addCoroutine(new Coroutine(function* () {
 *       let acc = 0; yield; // prime
 *       while (acc < (this.data as any).ms) {
 *         const dt = (yield) as number; acc += dt;
 *         el.object3D.visible = (acc % 200) < 100;
 *       }
 *       el.object3D.visible = true;
 *     }.call(this)));
 *   },
 *   remove: function () {
 *     const sys = this.el.sceneEl!.systems['coroutine'] as unknown as CoroutineSystem;
 *     if (this._co != null) sys.stopCoroutine(this._co);
 *   }
 * });
 *
 * 3) Using helpers:
 *
 * // Fire a 3-shot burst with 0.2s spacing
 * function* burst() {
 *   yield; // prime
 *   for (let i = 0; i < 3; i++) {
 *     // fire();
 *     yield* waitForSeconds(0.2);
 *   }
 * }
 *
 * // Wait until a condition becomes true
 * function* waitUntilVisible(el: AFRAME.Entity) {
 *   yield* waitForCondition(() => el.object3D.visible);
 *   // proceed...
 * }
 *
 * // Await a promise without async/await
 * function* loadData() {
 *   const data = yield* waitForPromise(fetch('/api').then(r => r.json()));
 *   // use data
 * }
 *
 * @remarks
 * - Exceptions thrown inside a coroutine propagate out of `tick`; prefer
 *   try/catch inside your generator if a failure is expected.
 * - Keep coroutine work lightweight; it runs every frame.
 */

/**
 * Represents the runtime API of the coroutine system exposed to other code.
 *
 * @public
 * @property addCoroutine - Add a Coroutine instance to the scheduler. Returns a unique numeric id.
 * @property stopCoroutine - Stop and remove a coroutine by id.
 */

/**
 * A single coroutine wrapper around a Generator instance.
 *
 * Construct with a generator (Generator<any, void, unknown>). Each tick the
 * system calls update(deltaTime) which advances the generator by calling
 * generator.next(deltaTime). The value passed into next is the delta time (ms)
 * since the last tick, allowing the coroutine to perform time-based logic.
 *
 * Methods:
 * - constructor(generator): Wraps the provided generator.
 * - update(deltaTime): Advances the generator. Returns true to keep the coroutine
 *   active, or false to indicate the coroutine has finished and should be removed.
 *
 * Example:
 * @example
 * const gen = function* () {
 *   // on first resume, deltaTime will be the first tick's delta
 *   let dt = yield;
 *   // ...
 * };
 * const coroutine = new Coroutine(gen());
 * // coroutine.update(deltaMs) -> advances generator and continues or finishes
 */
import {System} from 'aframe';
import {DataOf} from '../lib/aframe-utils.js';

const schema = {} as const;
type CoroutineData = DataOf<typeof schema>;
export type CoroutineSystem = System<CoroutineData> & {
    addCoroutine: (coroutine: Coroutine) => number;
    stopCoroutine: (id: number) => void;
    _coroutines: Map<number, Coroutine>;
    _nextId: number;
};

AFRAME.registerSystem('coroutine', {
    schema: {},
    init(this: CoroutineSystem) {
        this._coroutines = new Map();
        this._nextId = 0;
    },
    tick: function (this: CoroutineSystem, time: number, timeDelta: number) {
        for (const [id, coroutine] of this._coroutines.entries()) {
            if (!coroutine.update(timeDelta)) {
                this._coroutines.delete(id);
            }
        }
    },
    addCoroutine(this: CoroutineSystem, coroutine: Coroutine): number {
        const id = this._nextId++;
        this._coroutines.set(id, coroutine);
        return id;
    },
    stopCoroutine(this: CoroutineSystem, id: number): void {
        this._coroutines.delete(id);
    },
});

export class Coroutine {
    private generator: Generator<any, void, unknown>;
    constructor(generator: Generator<any, void, unknown>) {
        this.generator = generator;
    }

    update(deltaTime: number): boolean {
        const result = this.generator.next(deltaTime);
        if (result.done) {
            return false; // Remove this coroutine.
        }
        return true; // Continue running this coroutine in the next frame.
    }
}

/**
 * Waits for a number of seconds to pass before continuing.
 * @param seconds Number of seconds to wait (can be fractional)
 */
export function* waitForSeconds(seconds: number) {
    let elapsedSec = 0;
    // prime so first real delta arrives on the next resume
    // (safe even if caller already primed before delegating)
    // Note: Intentionally not reading the yielded value here.
    // The first `next(value)`'s value is ignored by generators per spec.
    while (elapsedSec < seconds) {
        const deltaMs: number = yield;
        elapsedSec += deltaMs / 1000;
    }
}

/**
 * Waits until a predicate returns true, then continues.
 * @param conditionFn Function returning a boolean; checked once per frame
 */
export function* waitForCondition(conditionFn: () => boolean) {
    while (!conditionFn()) {
        yield;
    }
}

/**
 * Delegates until a Promise settles, then returns its resolved value or throws.
 * @param promise The promise to await
 */
export function* waitForPromise<T>(promise: Promise<T>) {
    let isResolved = false;
    let result: T | undefined;
    let error: any;

    promise.then(
        (res) => {
            isResolved = true;
            result = res;
        },
        (err) => {
            isResolved = true;
            error = err;
        }
    );

    while (!isResolved) yield;

    if (error) throw error;
    return result;
}
