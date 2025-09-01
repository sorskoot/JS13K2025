import {VoxelEngine, VOXELS_PER_METER} from '../lib/voxelengine.js';
import {addModelFromEncoded} from '../lib/encoder.js';

AFRAME.registerComponent('world', {
    init: function () {
        // Create a voxel engine instance
        const engine = new VoxelEngine();

        const floor =
            '10000000,20000000,30000000|0001000101120112011201121222122200010001011201120112011212221222|7,8,15';

        // Generate a mesh or geometry from the engine
        for (let x = 0; x <= 25; x++) {
            for (let z = 0; z <= 25; z++) {
                addModelFromEncoded(floor, engine, new THREE.Vector3(x, 0, z));
            }
        }

        const voxelMesh = engine.getMesh();
        // Convert THREE.Mesh to an A-Frame entity
        this.el.setObject3D('mesh', voxelMesh);

        // Optionally, position the mesh
        voxelMesh.position.set(0, -0.125, 0);
        // voxelMesh.rotation.set(0, -90, 0);
    },
});
