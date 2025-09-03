import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';

const schema = {
    // example: myProp: { type: 'number', default: 0 },
} as const;

type SnapRotateData = DataOf<typeof schema>;
type SnapRotateComponent = Component<SnapRotateData> & {
    // Add custom properties/methods here
};

AFRAME.registerComponent('snap-rotate', {
    schema,
    init: function (this: SnapRotateComponent) {},
});
