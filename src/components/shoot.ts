import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';

const schema = {
    // example: myProp: { type: 'number', default: 0 },
} as const;

type ShootData = DataOf<typeof schema>;
type ShootComponent = Component<ShootData> & {
    // Add custom properties/methods here
};

AFRAME.registerComponent('shoot', {
    schema,
    init: function (this: ShootComponent) {},
});
