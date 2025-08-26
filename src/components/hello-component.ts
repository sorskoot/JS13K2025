import {VoxelEngine} from '../lib/voxelengine';

AFRAME.registerComponent('hello-world', {
    init: function () {
        console.log('Hello, A-Frame with TypeScript!');

        // Create a voxel engine instance
        const engine = new VoxelEngine();

        engine.setCube(1, 1, 1, 1);
        // Generate a mesh or geometry from the engine
        // This assumes your engine has a method like getMesh() that returns a THREE.Mesh
        const voxelMesh = engine.getMesh();

        // Convert THREE.Mesh to an A-Frame entity
        // A-Frame exposes the three.js scene via this.el.sceneEl.object3D
        this.el.sceneEl!.object3D.add(voxelMesh);
        // Optionally, position the mesh
        voxelMesh.position.set(0, 0, 0);
    },
});
