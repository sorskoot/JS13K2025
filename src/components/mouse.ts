import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {addModelFromEncoded} from '../lib/encoder.js';
import {VoxelEngine} from '../lib/voxelengine.js';
import {Coroutine, CoroutineSystem, waitForSeconds} from '../systems/coroutine.js';
import {Vector3} from 'three';

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
     * ag: aggro radius
     */
    ag: {type: 'number', default: 1.6},
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
    _hasLOS: (targetPos: Vector3) => boolean;
};
enum State {
    wander = 0,
    attack = 1,
    hide = 2,
}

AFRAME.registerComponent('mouse', {
    schema,
    init: function (this: MouseComponent) {
        const engine = new VoxelEngine({metersX: 1, metersY: 1, metersZ: 1});
        const mouse =
            '00000000,22000000,20000000,03000000,03300000,13300000,03330000,03333000,00333000,13332300,03333300,03430000|000122200344432005666520066666000766670089a6a98006b6b60000030000|4,30,3,12';

        addModelFromEncoded(mouse, engine);
        const voxelMesh = engine.getMesh();
        this.el.setObject3D('mesh', voxelMesh);
        this._originPosition = this.el.object3D.position.clone();
        // this.data.t;

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
    _hasLOS: function (this: MouseComponent, targetPos: Vector3) {
        const THREE = (AFRAME as any).THREE;
        const scene = this.el.sceneEl!;
        // Try to get the game's nav grid from the Game system
        const gameSys = scene.systems && (scene.systems['game'] as any);
        const grid = gameSys && (gameSys.grid as {w: number; d: number; occ: Uint8Array} | undefined);

        // Get horizontal integer cell coords (x -> width, z -> depth)
        const start = new THREE.Vector3();
        this.el.object3D.getWorldPosition(start);
        const sx = Math.floor(start.x);
        const sz = Math.floor(start.z);
        const tx = Math.floor(targetPos.x);
        const tz = Math.floor(targetPos.z);

        // If no grid available, fallback to simple unobstructed assumption (caller may add a raycast fallback later)
        if (!grid || !grid.occ || typeof grid.w !== 'number' || typeof grid.d !== 'number') {
            // permissive fallback — treat as visible (safe default so mice still react)
            return true;
        }

        const w = grid.w;
        const d = grid.d;
        const occ = grid.occ;

        const inBounds = (x: number, z: number) => x >= 0 && z >= 0 && x < w && z < d;

        // Bresenham's line algorithm on integer grid from (sx,sz) -> (tx,tz)
        let x0 = sx,
            y0 = sz,
            x1 = tx,
            y1 = tz;
        const dx = Math.abs(x1 - x0);
        const sxStep = x0 < x1 ? 1 : -1;
        const dy = Math.abs(y1 - y0);
        const syStep = y0 < y1 ? 1 : -1;
        let err = (dx > dy ? dx : -dy) / 2;

        // Walk the grid cells and fail if an occupied cell (==1) is encountered.
        while (true) {
            if (inBounds(x0, y0)) {
                // occ indexing: row-major with z as row and x as column: index = z * w + x
                if (occ[y0 * w + x0]) {
                    // blocked
                    return false;
                }
            }
            if (x0 === x1 && y0 === y1) break;
            const e2 = err;
            if (e2 > -dx) {
                err -= dy;
                x0 += sxStep;
            }
            if (e2 < dy) {
                err += dx;
                y0 += syStep;
            }
        }

        // no blockers found on the grid line -> visible
        return true;
    },
    _getPlayerPosition: function (this: MouseComponent) {
        const scene = this.el.sceneEl!;
        const camEl = scene.camera!;
        if (!camEl) return null;
        const v = new THREE.Vector3();
        camEl.getWorldPosition(v);
        return v;
    },
    ai: function* (this: MouseComponent) {
        let state = State.wander;
        while (true) {
            // indefinite loop
            yield* waitForSeconds(2); // let things settle
            console.log('Wandering around...');
        }
    },
});

type Point = [number, number];

function astar(grid: number[][], start: Point, goal: Point): Point[] | null {
    const rows = grid.length;
    const cols = grid[0].length;
    const openSet: [number, Point][] = [[0, start]];
    const cameFrom = new Map<string, Point>();
    const gScore = new Map<string, number>();
    gScore.set(start.toString(), 0);

    const h = (pos: Point): number => Math.abs(pos[0] - goal[0]) + Math.abs(pos[1] - goal[1]);

    const neighbors = (pos: Point): Point[] => {
        const [x, y] = pos;
        return [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
        ]
            .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < rows && ny < cols && grid[nx][ny] === 0)
            .map(([nx, ny]) => [nx, ny] as Point);
    };

    while (openSet.length > 0) {
        openSet.sort((a, b) => a[0] - b[0]);
        const [, current] = openSet.shift()!;
        const key = current.toString();

        if (current[0] === goal[0] && current[1] === goal[1]) {
            const path: Point[] = [];
            let currKey = key;
            while (cameFrom.has(currKey)) {
                const prev = cameFrom.get(currKey)!;
                path.push([+currKey.split(',')[0], +currKey.split(',')[1]]);
                currKey = prev.toString();
            }
            path.push(start);
            return path.reverse();
        }

        for (const neighbor of neighbors(current)) {
            const neighborKey = neighbor.toString();
            const tentativeG = gScore.get(key)! + 1;
            if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeG);
                const fScore = tentativeG + h(neighbor);
                openSet.push([fScore, neighbor]);
            }
        }
    }

    return null;
}
