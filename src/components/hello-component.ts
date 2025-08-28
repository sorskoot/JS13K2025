import {Vector3} from 'three';
import {VoxelEngine, VOXELS_PER_METER} from '../lib/voxelengine.js';

AFRAME.registerComponent('hello-world', {
    init: function () {
        console.log('Hello, A-Frame with TypeScript!');

        // Create a voxel engine instance
        const engine = new VoxelEngine();

        const rows = [0b0010110, 0b0111110, 0b0000111, 0b0111110, 0b0111110];
        // const model = [
        //     [7, 5, 7],
        //     [5, null, 5],
        //     [7, 5, 7],
        // ];
        const model = [
            [null, 8390656, null, 12, 12, 8390668, 3276],
            [null, 125269872, 125269872, 2004318076, 125269872, 125269872],
            [7340032, 125269760, 74938224, 125269872, 74938224, 125269760, 7340032],
            [7340032, 125267968, 125269760, 125269760, 125269760, 125267968, 7340032],
            [7340032, 13041664, 7340032, null, 7340032, 13041664, 7340032],
            [null, 7340032, 7340032, null, 7340032, 7340032],
        ];
        // const model = [
        //     [268435457, null, null, null, null, null, null, 268435457],
        //     [1879048199, null, null, null, null, null, null, 1879048199],
        //     [268435457, null, null, null, null, null, null, 268435457],
        //     [322122556, -1145324619, -1145324612, -1141969996, -1141969996, -1145324619, -1145324612, 322122549],
        //     [268435468, 5, 12, 4, 4, 5, 12, 268435461],
        //     [268435468, 5, 12, 4, 4, 5, 12, 268435461],
        //     [-1861152484, 5, 12, 4, 4, 5, 12, -1861152491],
        //     [12, 5, 12, 4, 4, 5, 12, 5],
        // ];

        addModel(model, engine, new THREE.Vector3(0, 0, 0));
        addModel(model, engine, new THREE.Vector3(1.5, 0, 0));
        addModel(model, engine, new THREE.Vector3(3, 0, 0));
        addModel(model, engine, new THREE.Vector3(4.5, 0, 0));

        // engine.setCube(1, 1, 1, 1);
        // engine.setCube(1, 1.0625, 1, 2);

        // Generate a mesh or geometry from the engine
        const voxelMesh = engine.getMesh();

        // Convert THREE.Mesh to an A-Frame entity
        this.el.sceneEl!.object3D.add(voxelMesh);

        // Optionally, position the mesh
        voxelMesh.position.set(0, 0, -3);
    },
});
function addModel(model: (number | null)[][], engine: VoxelEngine, offset: Vector3 = new THREE.Vector3(0, 0, 0)) {
    // If the outer length matches the depth, treat the input as packed by z:
    // model[z][y] -> each number is a packed row across x where each byte holds two 4-bit nibbles (two x positions)
    // if (model.length === VOXELS_PER_METER) {
    for (let y = 0; y < VOXELS_PER_METER; y++) {
        const rowForY = model[y];
        if (!rowForY) continue;
        for (let x = 0; x < rowForY.length; x++) {
            const packedRow = rowForY[x];
            if (packedRow == null) continue;
            for (let z = 0; z < VOXELS_PER_METER; z++) {
                // byteIndex selects the byte for the x pair, nibbleShift selects low/high nibble in that byte
                const byteIndex = Math.floor(z / 2);
                const nibbleShift = z % 2 === 0 ? 0 : 4;
                const shift = byteIndex * 8 + nibbleShift;
                const colorNibble = (packedRow >>> shift) & 0xf;
                if (colorNibble !== 0) {
                    const px = x / VOXELS_PER_METER + offset.x;
                    const py = y / VOXELS_PER_METER + offset.y;
                    const pz = z / VOXELS_PER_METER + offset.z;
                    engine.setCube(px, py, pz, colorNibble);
                }
            }
        }
    }
    // return;
    //  }
}
