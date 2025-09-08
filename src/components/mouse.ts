import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {addModelFromEncoded} from '../lib/encoder.js';
import {VoxelEngine} from '../lib/voxelengine.js';
import {Coroutine, CoroutineSystem, waitForSeconds} from '../systems/coroutine.js';

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
    _id?: number;
    validate: () => Generator<any, void, unknown>;
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
        this.data.t;

        // dummy A* example
        const grid = [
            [0, 0, 0, 0],
            [1, 1, 0, 1],
            [0, 0, 0, 0],
            [0, 1, 1, 0],
        ];

        const start: [number, number] = [0, 0];
        const goal: [number, number] = [3, 3];

        const path = astar(grid, start, goal);
        console.log(path);

        this._id = (this.el.sceneEl!.systems.coroutine as CoroutineSystem).addCoroutine(new Coroutine(this.validate()));
    },
    update: function (this: MouseComponent, oldData: Readonly<MouseData>) {},
    validate: function* (this: MouseComponent) {
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
