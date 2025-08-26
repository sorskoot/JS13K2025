import {VoxelEngine} from '../lib/voxelengine';

AFRAME.registerComponent('hello-world', {
    init: function () {
        console.log('Hello, A-Frame with TypeScript!');

        // Create a voxel engine instance
        const engine = new VoxelEngine();

        engine.setCube(1, 1, 1, 1);
        engine.setCube(1, 1.0625, 1, 2);

        // Generate a mesh or geometry from the engine
        const voxelMesh = engine.getMesh();

        // Convert THREE.Mesh to an A-Frame entity
        this.el.sceneEl!.object3D.add(voxelMesh);

        // Optionally, position the mesh
        voxelMesh.position.set(0, 0, -3);
    },
});
