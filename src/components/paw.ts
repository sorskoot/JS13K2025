import {Vector3} from 'three';
import {VoxelEngine, VOXELS_PER_METER} from '../lib/voxelengine.js';
import {addModelFromEncoded} from '../lib/encoder.js';
import {DataOf} from '../lib/aframe-utils.js';
import {Component} from 'aframe';
const schema = {
    gun: {type: 'boolean', default: false},
} as const;

type PawData = DataOf<typeof schema>;
type PawComponent = Component<PawData> & {};
AFRAME.registerComponent('paw', {
    schema,
    init: function (this: PawComponent) {
        // Create a voxel engine instance
        const engine = new VoxelEngine({metersX: 1, metersY: 1, metersZ: 2});

        const paw = [
            '11000000,11100000,00000000|0000000011111111111111111111111111111111111111110000000022222222|5',
            '11000000,00000000,11100000,21100000|0000001123223201333222202333232033322220232232010000001111111111|5,31',
            '00000000,00000100,11000200,00000200,00001410,11102120,00001110,00002120,00003333,00003113,11121113,00001113,00002113,00000500|012113100456676089abbc6d0456676d89abbc6d045667600121131000000000|3,4,1,12,33',
        ];

        addModelFromEncoded(paw[0], engine, new THREE.Vector3(0, 0, 0));
        addModelFromEncoded(paw[1], engine, new THREE.Vector3(0, 0, 1));
        if (this.data.gun) {
            addModelFromEncoded(paw[2], engine, new THREE.Vector3(0, 0, 0.5));
        }

        // Generate a mesh or geometry from the engine
        const voxelMesh = engine.getMesh();

        // Convert THREE.Mesh to an A-Frame entity
        this.el.setObject3D('mesh', voxelMesh);

        // Optionally, position the mesh
        //voxelMesh.position.set(0, 0, -3);
    },
});
