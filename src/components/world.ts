import {VoxelEngine, VOXELS_PER_METER} from '../lib/voxelengine.js';
import {addModelFromEncoded, Rotation} from '../lib/encoder.js';

AFRAME.registerComponent('world', {
    init: function () {
        // Create a voxel engine instance
        const engine = new VoxelEngine();

        const floor =
            '10000000,20000000,30000000|0001000101120112011201121222122200010001011201120112011212221222|3,2,1';
        const walls = [
            '12232333,12231223,11121223,23331223,12231112,00000000|0112311455555555555555555555555555555555555555555555555555555555|12,13,14',
            '00000000,22220000,22222000,13343444,13341334,00001334,00000334,13341113|0012210034566547000000000000000000000000000000000000000000000000|12,5,13,14',
        ];
        const chair =
            '00022222,11111100,00020000,00020100|0000000012222221322222233222222332222223322222231222222122222222|10,38';
        // Generate a mesh or geometry from the engine
        for (let x = 0; x <= 10; x++) {
            for (let z = 0; z <= 10; z++) {
                addModelFromEncoded(floor, engine, Rotation.None, new THREE.Vector3(x, 0, z));
            }
        }
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 3; y++) {
                addModelFromEncoded(walls[0], engine, Rotation.None, new THREE.Vector3(0.125, y + 0.125, x));
                addModelFromEncoded(walls[0], engine, Rotation.Clockwise180, new THREE.Vector3(9, y + 0.125, x));
                addModelFromEncoded(walls[1], engine, Rotation.Clockwise270, new THREE.Vector3(x, y + 0.125, 0.125));
                addModelFromEncoded(walls[1], engine, Rotation.Clockwise90, new THREE.Vector3(x, y + 0.125, 9)); // z=9.875
            }
        }
        addModelFromEncoded(chair, engine, Rotation.None, new THREE.Vector3(4, 0, 4));

        const voxelMesh = engine.getMesh();
        // Convert THREE.Mesh to an A-Frame entity
        this.el.setObject3D('mesh', voxelMesh);

        // Optionally, position the mesh
        voxelMesh.position.set(0, -0.125, 0);
        // voxelMesh.rotation.set(0, -90, 0);
    },
});
