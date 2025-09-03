import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {Vector3} from 'three';

const schema = {
    player: {type: 'selector', default: '#rig'},
    degrees: {type: 'int', default: 30},
} as const;

type SnapRotateData = DataOf<typeof schema>;
type SnapRotateComponent = Component<SnapRotateData> & {
    _axisMoveHandler: (event: Event) => void;
    _snapped: boolean;
    _lastHeadPos: Vector3;
    _currentHeadPos: Vector3;
    _delta: Vector3;
};

AFRAME.registerComponent('snap-rotate', {
    schema,
    init: function (this: SnapRotateComponent) {
        this._snapped = false;
        this._lastHeadPos = new THREE.Vector3();
        this._currentHeadPos = new THREE.Vector3();
        this._delta = new THREE.Vector3();

        // Handler listens to controller axismove events that provide axes as [x, y, x2, y2]
        this._axisMoveHandler = (event: Event) => {
            const detail = (event as CustomEvent).detail as {axis?: number[]};
            const axis = detail?.axis;
            if (!axis || axis.length < 3) return;

            const currentAxis = axis[2];

            // deadzone
            if (currentAxis > -0.2 && currentAxis < 0.2) {
                this._snapped = false;
                return;
            }
            // require strong deflection
            if (Math.abs(currentAxis) < 0.8) return;

            if (!this.data.player) return;

            // record head world position before rotation
            this.data.player.object3D.getWorldPosition(this._lastHeadPos);

            if (currentAxis < -0.8 && !this._snapped) {
                // rotate left (positive degrees)
                this.data.player.object3D.rotateY((this.data.degrees * Math.PI) / 180);
                this._snapped = true;
            }

            if (currentAxis > 0.8 && !this._snapped) {
                // rotate right (negative degrees)
                this.data.player.object3D.rotateY((-this.data.degrees * Math.PI) / 180);
                this._snapped = true;
            }

            // compute translation to keep head in the same world position
            this.data.player.object3D.getWorldPosition(this._currentHeadPos);
            this._delta.subVectors(this._lastHeadPos, this._currentHeadPos);

            // convert world delta to player's parent local space (so adding to position moves correctly)
            const parent = this.data.player.object3D.parent;
            if (parent) {
                parent.worldToLocal(this._delta);
            }

            this.data.player.object3D.position.add(this._delta);
        };
    },

    play: function (this: SnapRotateComponent) {
        this.el.addEventListener('axismove', this._axisMoveHandler);
    },

    pause: function (this: SnapRotateComponent) {
        this.el.removeEventListener('axismove', this._axisMoveHandler);
    },
});
