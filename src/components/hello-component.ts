import {VoxelEngine, VOXELS_PER_METER} from '../lib/voxelengine.js';
import {addModelFromEncoded} from '../lib/encoder.js';

AFRAME.registerComponent('hello-world', {
    init: function () {
        console.log('Hello, A-Frame with TypeScript!');

        // Create a voxel engine instance
        const engine = new VoxelEngine();

        const mouse =
            //'00000000,00777000,07000000,87700000,07770000,07777000,8777c700,07700000,07777700,07470000,cc000000,c0000000|000001000234564007444890a7444442b7444890b2345640bbb0010000000000';
            '00000000,22000000,20000000,03000000,03300000,13300000,03330000,03333000,00333000,13332300,03333300,03430000|000122200344432005666520066666000766670089a6a98006b6b60000030000|8,12,7,4';
        //  '10000555,10001616,16161616,16160616,477b0ccf,20000500,25555200,22222200,477bbc00,20000000,25888500,22999900,000bbc00,25808500,22a0992d,22a0992e,2200992e,2290992e,22202200,0000bc00,00000000,2220222d,0000bccf,2299992d,2299992e,2222222d,000bbccf,20000022,25555522,2222222e,000b00cf,00003033,00003333,0000333d,3333333d|01112334567777789abbbb7c9defghij9defkhlm9anokopqrsptttpuvwxxyyyu|14,11,5,0,3,10,8,2,7,9,4,6,1,15,12';
        addModelFromEncoded(mouse, engine, new THREE.Vector3(0, 0.125, 0));
        addModelFromEncoded(mouse, engine, new THREE.Vector3(1.5, 0.125, 0));
        addModelFromEncoded(mouse, engine, new THREE.Vector3(3, 0.125, 0));
        addModelFromEncoded(mouse, engine, new THREE.Vector3(4.5, 0.125, 0));
        addModelFromEncoded(mouse, engine, new THREE.Vector3(6, 0.125, 0));

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
        voxelMesh.position.set(0, 0, -3);
        voxelMesh.rotation.set(0, -90, 0);
    },
});
