import type {Component, Entity} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';

const schema = {
    height: {type: 'number', default: 0.5}, // target head height in meters
    Camera: {type: 'selector', default: '#camera'},
} as const;

type HeadOffsetData = DataOf<typeof schema>;
type HeadOffsetComponent = Component<HeadOffsetData> & {
    _originalPosition: {x: number; y: number; z: number};
    _tries: number;
    _maxTries: number;
    _adjusting: boolean;
    _cameraEl: Entity;
};

// Component to shift the rig so the user's head appears at a target absolute height (meters).
AFRAME.registerComponent('head-offset', {
    schema,
    init: function (this: HeadOffsetComponent) {
        this._originalPosition = this.el.getAttribute('position');
        this._tries = 0;
        this._maxTries = 30;
        this._adjusting = false;

        this.el.sceneEl!.addEventListener('enter-vr', () => {
            this._tries = 0;
            this._adjusting = true; // begin checking in tick()
        });
    },
    tick: function (this: HeadOffsetComponent, time: number, timeDelta: number) {
        // If we're not in the middle of adjusting, nothing to do.
        if (!this._adjusting) return;

        const worldPos = new THREE.Vector3();
        this.data.Camera.object3D.getWorldPosition(worldPos);
        const currentY = worldPos.y;

        // If pose hasn't been populated or is near-zero, wait a few ticks (but don't loop forever).
        if ((this._tries || 0) < (this._maxTries || 30) && Math.abs(currentY) < 0.001) {
            this._tries = (this._tries || 0) + 1;
            return;
        }

        // Compute offset to apply to the rig so worldHeadY becomes target.
        const target = this.data.height;
        const offsetY = target - currentY;
        // Apply offset to the rig's position.y
        const pos = this.el.getAttribute('position') || {x: 0, y: 0, z: 0};
        const newY = pos.y + offsetY;
        this.el.setAttribute('position', {x: pos.x, y: newY, z: pos.z});
        // done adjusting
        this._adjusting = false;
    },
});
