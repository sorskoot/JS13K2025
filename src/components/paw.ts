import {Vector3} from 'three';
import {VoxelEngine, VOXELS_PER_METER} from '../lib/voxelengine.js';
import {addModelFromEncoded} from '../lib/encoder.js';

AFRAME.registerComponent('paw', {
    init: function () {
        // Create a voxel engine instance
        const engine = new VoxelEngine();

        const paw =
            '11000000,00000000,11100000,21100000|0000001123223201333222202333232033322220232232010000001111111111|6,7';
        addModelFromEncoded(paw, engine, new THREE.Vector3(0, 0, 0));

        // Generate a mesh or geometry from the engine
        const voxelMesh = engine.getMesh();

        // Convert THREE.Mesh to an A-Frame entity
        this.el.setObject3D('mesh', voxelMesh);

        // Optionally, position the mesh
        //voxelMesh.position.set(0, 0, -3);
    },
});
