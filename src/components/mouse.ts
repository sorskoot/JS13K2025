import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';

const schema = {
    // example: myProp: { type: 'number', default: 0 },
} as const;

type MouseData = DataOf<typeof schema>;

AFRAME.registerComponent('mouse', {
    schema,
    init: function (this: Component<MouseData>) {},
    update: function (this: Component<MouseData>, oldData: Readonly<MouseData>) {},
});
