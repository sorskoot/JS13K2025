import {VoxelEngine} from '../lib/voxelengine.js';
import {addModelFromEncoded, Rotation} from '../lib/encoder.js';
import {ZeroCurvatureEnding} from 'three';

const floor = '10000000,20000000,30000000|0001000101120112011201121222122200010001011201120112011212221222|3,2,1';
const ceiling = '00000012,00000002|0000000001111110011111100111111001111110011111100111111000000000|37,2';
const walls = [
    '11111111,22222222,00000000|0110011001100110222222222222222222222222222222222222222222222222|19,20',
    '00000000,33330000,33333000,11111111,22222222,00002222,00000111|0012210034566543000000000000000000000000000000000000000000000000|19,20,5',
    '12232333,12231223,11121223,23331223,12231112,00000000|0112311401123114555555555555555555555555555555555555555555555555|12,13,14',
    '00000000,22220000,22222000,13343444,13341334,00001334,00000334,13341113|0012210034566547000000000000000000000000000000000000000000000000|12,5,13,14',
];
const chair =
    '00022222,11111100,00020000,00020100|0000000012222221322222233222222332222223322222231222222122222222|10,38';
const bomb =
    '14410000,04410000,04010000,10010000,10410000,11110000,00000000,14010000,35353600,33333600,14410600,35353700,25252000,25252600,00000600|0120034567000005664000566689a056668ba5666cdedc666cc6cc6666666666|16,12,38,17,6,2,1';
const door = [
    '00000000,11111111,00000001|0000000100000002000000020000000200000002000000020000000200000001|37',
    '00000000,11111111|0000000100000000000000000000000000000000000000000000000000000001|37',
];

type vec3 = [number, number, number];

type DoorSpec = {
    // local coords relative to room origin: x in [0..w-1], z in [0..d-1], y floor-level
    x: number;
    z: number;
    rotation: Rotation;
};

type HoleSpec = {
    x: number;
    z: number;
    // More to come :)
};

type Room = {
    origin: vec3; // world origin for the room (lower-left corner)
    size: vec3; // in voxels/meters in X, Y, Z
    floorModel: string;
    ceilingModel: string;
    wallModel: string; // single or array indexed by side if needed
    doors?: DoorSpec[];
    mouseHoles?: HoleSpec[];
    contents?: {model: string; pos: vec3; rot?: Rotation}[]; // chairs, bombs etc
};
// Build a single room into the engine
function buildRoom(engine: any, room: Room) {
    const ox = room.origin[0];
    const oy = room.origin[1];
    const oz = room.origin[2];

    const w = room.size[0];
    const d = room.size[1];
    const h = room.size[2];

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

    // place contents (chairs, bombs, etc)
    if (room.contents) {
        for (const c of room.contents) {
            addModelFromEncoded(
                c.model,
                engine,
                c.rot ?? Rotation.None,
                new THREE.Vector3(ox + c.pos[0], oy + c.pos[1], oz + c.pos[2])
            );
        }
    }
}

// Example rooms array that recreates your current layout
const rooms: Room[] = [
    {
        origin: [0, 0, 0],
        size: [9, 9, 3],
        floorModel: floor,
        ceilingModel: ceiling,
        wallModel: walls[0],
        doors: [
            // a door at x=4 z=9 (matching previous door placements)
            {x: 9, z: 4, rotation: Rotation.Clockwise90},
            //{x: 4, z: 10, rotation: Rotation.Clockwise180}, // second room door
        ],
        mouseHoles: [{x: 0, z: 4}], // mouse hole at x=0,z=4
        contents: [
            {model: chair, pos: [4, 0.125, 4]}, // chair
            {model: bomb, pos: [2, 0.125, 2]}, // bomb
        ],
    },
    {
        origin: [9, 0, 0],
        size: [9, 9, 3],

        floorModel: floor,
        ceilingModel: ceiling,
        wallModel: walls[2],
        doors: [
            // door at local x=4,z=0 relative to origin x: 10+4=14 -> corresponds to your second block placement
            {x: 0, z: 4, rotation: Rotation.Clockwise270},
        ],
    },
];

// // compute engine bounds from rooms (simple AABB)
// let maxX = 0, maxY = 0, maxZ = 0;
// for (const r of rooms) {
//     maxX = Math.max(maxX, r.origin.x + r.width + 1);
//     maxY = Math.max(maxY, (r.origin.y ?? 0) + r.height + 1);
//     maxZ = Math.max(maxZ, r.origin.z + r.depth + 1);
// }

AFRAME.registerComponent('world', {
    init: function () {
        // Create a voxel engine instance
        const engine = new VoxelEngine({metersX: 30, metersY: 4, metersZ: 30});
        for (const r of rooms) buildRoom(engine, r);
        // // Generate a mesh or geometry from the engine
        // for (let x = 0; x < 10; x++) {
        //     for (let y = 0; y < 3; y++) {
        //         addModelFromEncoded(walls[0], engine, Rotation.None, new THREE.Vector3(0, y + 0.125, x));

        //         addModelFromEncoded(walls[0], engine, Rotation.Clockwise180, new THREE.Vector3(9.1, y + 0.125, x));

        //         addModelFromEncoded(walls[0], engine, Rotation.Clockwise270, new THREE.Vector3(x, y + 0.125, 0));
        //         if (x !== 4 || (x === 4 && y === 2)) {
        //             addModelFromEncoded(walls[0], engine, Rotation.Clockwise90, new THREE.Vector3(x, y + 0.125, 9.1)); // z=9.875
        //         }
        //     }
        // }
        // for (let x = 0; x < 10; x++) {
        //     for (let y = 0; y < 3; y++) {
        //         addModelFromEncoded(walls[2], engine, Rotation.None, new THREE.Vector3(0, y + 0.125, x + 10));

        //         addModelFromEncoded(walls[2], engine, Rotation.Clockwise180, new THREE.Vector3(9.1, y + 0.125, x + 10));
        //         if (x !== 4 || (x === 4 && y === 2)) {
        //             addModelFromEncoded(walls[2], engine, Rotation.Clockwise270, new THREE.Vector3(x, y + 0.125, 10));
        //         }
        //         addModelFromEncoded(walls[2], engine, Rotation.Clockwise90, new THREE.Vector3(x, y + 0.125, 9.1 + 10)); // z=9.875
        //     }
        // }
        // for (let x = 0; x <= 10; x++) {
        //     for (let z = 0; z <= 20; z++) {
        //         addModelFromEncoded(floor, engine, Rotation.None, new THREE.Vector3(x, 0, z));
        //         addModelFromEncoded(ceiling, engine, Rotation.None, new THREE.Vector3(x, 2.2, z));
        //     }
        // }

        // addModelFromEncoded(chair, engine, Rotation.None, new THREE.Vector3(4, 0.125, 4));
        // addModelFromEncoded(bomb, engine, Rotation.None, new THREE.Vector3(2, 0.125, 2));

        // addModelFromEncoded(door[1], engine, Rotation.None, new THREE.Vector3(4, 0.125, 9));
        // addModelFromEncoded(door[0], engine, Rotation.None, new THREE.Vector3(4, 1.125, 9));
        // addModelFromEncoded(door[1], engine, Rotation.Clockwise180, new THREE.Vector3(4, 0.125, 10));
        // addModelFromEncoded(door[0], engine, Rotation.Clockwise180, new THREE.Vector3(4, 1.125, 10));

        const voxelMesh = engine.getMesh();
        // Convert THREE.Mesh to an A-Frame entity
        this.el.setObject3D('mesh', voxelMesh);

        // Optionally, position the mesh
        voxelMesh.position.set(0, -0.125, 0);
        // voxelMesh.rotation.set(0, -90, 0);
    },
});
