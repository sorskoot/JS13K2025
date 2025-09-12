import {VoxelEngine} from '../lib/voxelengine.js';
import {addModelFromEncoded, Rotation} from '../lib/encoder.js';
import {GameSystem} from '../systems/game.js';
import {Room} from '../types/world-types.js';
import {door, walls} from '../models.js';
import {rooms} from '../map.js';
import {DataOf} from '../lib/aframe-utils.js';
import {Component} from 'aframe';

// Build a single room into the engine
function buildRoom(engine: VoxelEngine, room: Room, occ: Uint8Array, gridW: number, gameSystem: GameSystem) {
    const ox = room.origin[0];
    const oy = room.origin[1];
    const oz = room.origin[2];

    const w = room.size[0];
    const d = room.size[1];
    const h = room.size[2];
    const idx = (x: number, z: number) => (x | 0) + (z | 0) * gridW;
    // place floor and ceiling tiles in the area
    for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
            addModelFromEncoded(room.floorModel, engine, Rotation.None, new THREE.Vector3(ox + x, oy + 0, oz + z));
            addModelFromEncoded(
                room.ceilingModel,
                engine,
                Rotation.None,
                new THREE.Vector3(ox + x, oy + (h - 1) + 0.2, oz + z)
            );
        }
    }

    // helper: true-ish when a door exists at (lx,lz) on the 2m door span (y = 0 or 1)
    const doorAt = (lx: number, ly: number, lz: number) => {
        if (!room.doors || ly >= 2) return undefined; // doors occupy y = 0 and y = 1 only
        return room.doors.find((d) => d.x === lx && d.z === lz);
    };

    const mouseHoleAt = (lx: number, ly: number, lz: number) => {
        if (!room.mouseHoles || ly >= 1) return undefined;
        return room.mouseHoles.find((h) => h.x === lx && h.z === lz);
    };

    // perimeter walls: north (+z), south (0), west (0), east (+x)
    // north wall (z = d)
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            // local coords
            if (!doorAt(x, y, d) && !mouseHoleAt(x, y, d)) {
                addModelFromEncoded(
                    Array.isArray(room.wallModel) ? room.wallModel[0] : room.wallModel,
                    engine,
                    Rotation.Clockwise90,
                    new THREE.Vector3(ox + x, oy + y + 0.125, oz + d - 1)
                );
                if (y === 0) occ[idx(ox + x, oz + d - 1)] |= 1;
            }
        }
    }
    // south wall (z = 0)
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            if (!doorAt(x, y, 0) && !mouseHoleAt(x, y, 0)) {
                addModelFromEncoded(
                    Array.isArray(room.wallModel) ? room.wallModel[0] : room.wallModel,
                    engine,
                    Rotation.Clockwise270,
                    new THREE.Vector3(ox + x, oy + y + 0.125, oz + 0)
                );
                if (y === 0) occ[idx(ox + x, oz + 0)] |= 2;
            }
        }
    }
    // west wall (x = 0)
    for (let z = 0; z < d; z++) {
        for (let y = 0; y < h; y++) {
            if (!doorAt(0, y, z) && !mouseHoleAt(0, y, z)) {
                addModelFromEncoded(
                    Array.isArray(room.wallModel) ? room.wallModel[0] : room.wallModel,
                    engine,
                    Rotation.None,
                    new THREE.Vector3(ox + 0, oy + y + 0.125, oz + z)
                );
                if (y === 0) occ[idx(ox + 0, oz + z)] |= 4;
            }
        }
    }
    // east wall (x = w)
    for (let z = 0; z < d; z++) {
        for (let y = 0; y < h; y++) {
            if (!doorAt(w, y, z) && !mouseHoleAt(w, y, z)) {
                addModelFromEncoded(
                    Array.isArray(room.wallModel) ? room.wallModel[0] : room.wallModel,
                    engine,
                    Rotation.Clockwise180,
                    new THREE.Vector3(ox + w - 1, oy + y + 0.125, oz + z)
                );
                if (y === 0) occ[idx(ox + w - 1, oz + z)] |= 8;
            }
        }
    }

    // place doors explicitly (if provided) with optional rotation
    if (room.doors) {
        for (const d of room.doors) {
            addModelFromEncoded(
                door[1],
                engine,
                d.rotation,
                new THREE.Vector3(
                    ox + (d.rotation === Rotation.Clockwise90 ? d.x - 1 : d.x),
                    0.125,
                    oz + (d.rotation === Rotation.None ? d.z - 1 : d.z)
                )
            );
            addModelFromEncoded(
                door[0],
                engine,
                d.rotation,
                new THREE.Vector3(
                    ox + (d.rotation === Rotation.Clockwise90 ? d.x - 1 : d.x),
                    1.125,
                    oz + (d.rotation === Rotation.None ? d.z - 1 : d.z)
                )
            );
        }
    }

    if (room.mouseHoles) {
        for (const d of room.mouseHoles) {
            const offsetx = d.rotation === Rotation.Clockwise180 ? -1 : 0;
            const offsety = d.rotation === Rotation.Clockwise90 ? -1 : 0;
            const cx = ox + d.x + offsetx;
            const cz = oz + d.z + offsety;
            occ[idx(cx, cz)] |=
                (d.rotation === Rotation.None
                    ? 4
                    : d.rotation === Rotation.Clockwise90
                    ? 1
                    : d.rotation === Rotation.Clockwise180
                    ? 8
                    : 2) + 16;
            gameSystem.registerMouseHole({
                x: cx,
                z: cz,
                rotation: d.rotation,
            });
            addModelFromEncoded(walls[1], engine, d.rotation, new THREE.Vector3(cx, 0.125, cz));
        }
    }

    // place contents (chairs, bombs, etc)
    if (room.contents) {
        for (const c of room.contents) {
            if (c.pos[1] < 1) {
                // something above 1 meter we can pass underneath, so no need to mark occupied
                const cx = ox + c.pos[0];
                const cz = oz + c.pos[2];
                occ[idx(cx, cz)] |= 32;
            }
            addModelFromEncoded(
                c.model,
                engine,
                c.rot ?? Rotation.None,
                new THREE.Vector3(ox + c.pos[0], oy + c.pos[1], oz + c.pos[2])
            );
        }
    }
}

// // compute engine bounds from rooms (simple AABB)
// let maxX = 0, maxY = 0, maxZ = 0;
// for (const r of rooms) {
//     maxX = Math.max(maxX, r.origin.x + r.width + 1);
//     maxY = Math.max(maxY, (r.origin.y ?? 0) + r.height + 1);
//     maxZ = Math.max(maxZ, r.origin.z + r.depth + 1);
// }
const schema = {} as const;

type WorldData = DataOf<typeof schema>;
export type WorldComponent = Component<WorldData> & {
    engine: VoxelEngine;
    game: GameSystem;
};
AFRAME.registerComponent('world', {
    init: function (this: WorldComponent) {
        // Create a voxel engine instance
        const metersX = 30,
            metersY = 4,
            metersZ = 30;
        this.engine = new VoxelEngine({metersX, metersY, metersZ});
        this.game = this.el.sceneEl?.systems['game'] as GameSystem;

        // 2D occupancy grid (meter-resolution)
        const occ = new Uint8Array(metersX * metersZ);
        for (const r of rooms) buildRoom(this.engine, r, occ, metersX, this.game);
        this.game.setGrid(metersX, metersZ, occ);

        const voxelMesh = this.engine.getMesh();
        this.el.setObject3D('mesh', voxelMesh);
        this.game.worldMesh = this.el.object3D.children[0];
        voxelMesh.position.set(0, -0.125, 0);
    },
});
