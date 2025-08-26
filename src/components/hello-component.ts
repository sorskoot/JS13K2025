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
            [129, null, null, null, null, null, null, 129],
            [129, null, null, null, null, null, null, 129],
            [129, null, null, null, null, null, null, 129],
            [255, 255, 255, 255, 255, 255, 255, 255],
            [129, 1, 1, 1, 1, 1, 1, 129],
            [129, 1, 1, 1, 1, 1, 1, 129],
            [255, 1, 1, 1, 1, 1, 1, 255],
            [1, 1, 1, 1, 1, 1, 1, 1],
        ];

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
    for (let y = 0; y < model.length; y++) {
        const row = model[y];
        for (let x = 0; x < row.length; x++) {
            const column = model[y][x];
            for (let z = 0; z < VOXELS_PER_METER; z++) {
                if (column != null && (column & (1 << z)) !== 0) {
                    // compute positions in meters and apply offset
                    const px = x / VOXELS_PER_METER + offset.x;
                    const py = y / VOXELS_PER_METER + offset.y;
                    const pz = z / VOXELS_PER_METER + offset.z;
                    engine.setCube(px, py, pz, 3);
                }
            }
        }
    }
}
