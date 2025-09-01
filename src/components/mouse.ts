import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {addModelFromEncoded} from '../lib/encoder.js';
import {VoxelEngine} from '../lib/voxelengine.js';

const schema = {
    // example: myProp: { type: 'number', default: 0 },
} as const;

type MouseData = DataOf<typeof schema>;

AFRAME.registerComponent('mouse', {
    schema,
    init: function (this: Component<MouseData>) {
        const engine = new VoxelEngine({metersX: 1, metersY: 1, metersZ: 1});
        const mouse =
            '00000000,22000000,20000000,03000000,03300000,13300000,03330000,03333000,00333000,13332300,03333300,03430000|000122200344432005666520066666000766670089a6a98006b6b60000030000|8,12,7,4';

        addModelFromEncoded(mouse, engine);
        // addModelFromEncoded(mouse, engine, new THREE.Vector3(1.5, 0.125, 0));
        // addModelFromEncoded(mouse, engine, new THREE.Vector3(3, 0.125, 0));
        // addModelFromEncoded(mouse, engine, new THREE.Vector3(4.5, 0.125, 0));
        // addModelFromEncoded(mouse, engine, new THREE.Vector3(6, 0.125, 0));
        const voxelMesh = engine.getMesh();
        // Convert THREE.Mesh to an A-Frame entity
        this.el.setObject3D('mesh', voxelMesh);
    },
    update: function (this: Component<MouseData>, oldData: Readonly<MouseData>) {},
});
