/*
 This file was originally based on Minipunk by Cody Ebberson.
 See NOTICE for details.
*/

import {Mesh, Scene, Vector3} from 'three';
import {BufferSet} from './bufferset.js';
import {getTileColor, intbound, signum} from './utils.js';

/*
 * Dimensions of the world in meters (default unit).
 */

//TODO: The world size is way to big for my version. This needs to be reduced.

/**
 * Size of the world in meters on the x-axis.
 * @const {number}
 */
const METERS_PER_WORLD_X = 10;

/**
 * Size of the world in meters on the y-axis.
 * @const {number}
 */
const METERS_PER_WORLD_Y = 10;

/**
 * Size of the world in meters on the z-axis.
 * @const {number}
 */
const METERS_PER_WORLD_Z = 10;

/**
 * Number of voxels per meter.
 * @const {number}
 */
export const VOXELS_PER_METER = 8;

/**
 * Size of a voxel in meters (uniform across X/Y/Z).
 * @const {number}
 */
export const VOXEL_SCALE = 1 / VOXELS_PER_METER;

/*
 * Voxels per world.
 * These are internal constants.
 */

/**
 * Size of the world in voxels on the x-axis.
 * @const {number}
 */
const VOXELS_PER_WORLD_X = METERS_PER_WORLD_X / VOXEL_SCALE;

/**
 * Size of the world in voxels on the y-axis.
 * @const {number}
 */
const VOXELS_PER_WORLD_Y = METERS_PER_WORLD_Y / VOXEL_SCALE;

/**
 * Size of the world in voxels on the z-axis.
 * @const {number}
 */
const VOXELS_PER_WORLD_Z = METERS_PER_WORLD_Z / VOXEL_SCALE;

/**
 * Empty tile.
 * @const {number}
 */
const TILE_EMPTY = 0;

export class VoxelEngine {
    private _data: Uint8Array;
    private _bufferSet: BufferSet | null;
    // Instance configuration
    private _metersX: number;
    private _metersY: number;
    private _metersZ: number;
    private _voxelsPerMeter: number;
    private _voxelScale: number;
    private _voxelsX: number;
    private _voxelsY: number;
    private _voxelsZ: number;
    // Cached derived sizes for faster indexing
    private _planeSize: number;
    private _totalVoxels: number;
    private _origin: {x: number; y: number; z: number};

    /**
     * Creates a new voxel engine.
     */
    constructor(opts?: {
        metersX?: number;
        metersY?: number;
        metersZ?: number;
        voxelsPerMeter?: number;
        origin?: {x: number; y: number; z: number};
    }) {
        /**
         * Array of tile data.
         * 3D array flattened into a 1D array.
         * @type {!Uint8Array}
         * @private
         * @const
         */
        // Configure instance sizes (defaults match previous globals)
        this._metersX = opts?.metersX ?? METERS_PER_WORLD_X;
        this._metersY = opts?.metersY ?? METERS_PER_WORLD_Y;
        this._metersZ = opts?.metersZ ?? METERS_PER_WORLD_Z;

        this._voxelsPerMeter = opts?.voxelsPerMeter ?? VOXELS_PER_METER;
        this._voxelScale = 1 / this._voxelsPerMeter;

        this._voxelsX = Math.max(0, (this._metersX / this._voxelScale) | 0);
        this._voxelsY = Math.max(0, (this._metersY / this._voxelScale) | 0);
        this._voxelsZ = Math.max(0, (this._metersZ / this._voxelScale) | 0);

        this._origin = opts?.origin ?? {x: 0, y: 0, z: 0};

        this._planeSize = this._voxelsX * this._voxelsY;
        this._totalVoxels = this._planeSize * this._voxelsZ;
        this._data = new Uint8Array(this._totalVoxels);

        /**
         * WebGL buffers.
         * @type {?BufferSet}
         * @private
         */
        this._bufferSet = null;
    }

    /**
     * Returns true if the specified cube is out of range of the world.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {boolean}
     */
    private _isOutOfRange(x: number, y: number, z: number) {
        // Treat x,y,z as world-space meters; convert to local by subtracting origin
        const lx = x - this._origin.x;
        const ly = y - this._origin.y;
        const lz = z - this._origin.z;
        return lx < 0 || lx >= this._metersX || ly < 0 || ly >= this._metersY || lz < 0 || lz >= this._metersZ;
    }

    /**
     * Returns the array index for the tile.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {number}
     */
    private _getIndex(x: number, y: number, z: number) {
        // x,y,z expected in world-space meters. Convert to local voxel indices.
        const lx = x - this._origin.x;
        const ly = y - this._origin.y;
        const lz = z - this._origin.z;
        let x2 = (lx / this._voxelScale) | 0;
        let y2 = (ly / this._voxelScale) | 0;
        let z2 = (lz / this._voxelScale) | 0;
        return z2 * this._voxelsX * this._voxelsY + y2 * this._voxelsX + x2;
    }

    /**
     * Fast voxel-space helpers (integer voxel coords).
     */
    private _inBoundsVoxel(xi: number, yi: number, zi: number) {
        return xi >= 0 && xi < this._voxelsX && yi >= 0 && yi < this._voxelsY && zi >= 0 && zi < this._voxelsZ;
    }

    private _voxelIndex(xi: number, yi: number, zi: number) {
        return zi * this._planeSize + yi * this._voxelsX + xi;
    }

    private _isVoxelEmpty(xi: number, yi: number, zi: number) {
        if (!this._inBoundsVoxel(xi, yi, zi)) return true;
        return this._data[this._voxelIndex(xi, yi, zi)] === TILE_EMPTY;
    }

    /**
     * Returns the tile type for the tile.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {number}
     */
    getCube(x: number, y: number, z: number): number {
        if (this._isOutOfRange(x, y, z)) {
            return TILE_EMPTY;
        }
        return this._data[this._getIndex(x, y, z)];
    }

    /**
     * Sets the tile type for the tile.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} v The tile type.
     */
    setCube(x: number, y: number, z: number, v: number) {
        if (this._isOutOfRange(x, y, z)) {
            return;
        }
        this._data[this._getIndex(x, y, z)] = v;
    }

    /**
     * Returns if the tiles is empty or out of range.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {boolean}
     */
    private _isEmpty(x: number, y: number, z: number): boolean {
        return this.getCube(x, y, z) === TILE_EMPTY;
    }

    /**
     * Builds the WebGL BufferSet based on the tile data.
     */
    private _buildBuffers() {
        // Build buffers directly using voxel-space neighbor checks.
        this._bufferSet = new BufferSet();
        let i = 0;
        for (let z = 0; z < this._voxelsZ; z++) {
            for (let y = 0; y < this._voxelsY; y++) {
                for (let x = 0; x < this._voxelsX; x++) {
                    let t = this._data[i++];
                    if (t === TILE_EMPTY) {
                        continue;
                    }

                    let color = getTileColor(t);

                    // Local voxel -> world-space meters
                    let x1 = x * this._voxelScale + this._origin.x;
                    let y1 = y * this._voxelScale + this._origin.y;
                    let z1 = z * this._voxelScale + this._origin.z;

                    let x2 = x1 + this._voxelScale;
                    let y2 = y1 + this._voxelScale;
                    let z2 = z1 + this._voxelScale;

                    let p1 = new THREE.Vector3(x1, y2, z2);
                    let p2 = new THREE.Vector3(x2, y2, z2);
                    let p3 = new THREE.Vector3(x2, y2, z1);
                    let p4 = new THREE.Vector3(x1, y2, z1);
                    let p5 = new THREE.Vector3(x1, y1, z2);
                    let p6 = new THREE.Vector3(x2, y1, z2);
                    let p7 = new THREE.Vector3(x2, y1, z1);
                    let p8 = new THREE.Vector3(x1, y1, z1);

                    if (this._isVoxelEmpty(x, y + 1, z)) {
                        this._bufferSet!.addQuad([p1, p2, p3, p4], color); // top
                    }

                    if (this._isVoxelEmpty(x, y - 1, z)) {
                        this._bufferSet!.addQuad([p8, p7, p6, p5], color); // bottom
                    }

                    if (this._isVoxelEmpty(x, y, z + 1)) {
                        this._bufferSet!.addQuad([p2, p1, p5, p6], color); // north
                    }

                    if (this._isVoxelEmpty(x, y, z - 1)) {
                        this._bufferSet!.addQuad([p4, p3, p7, p8], color); // south
                    }

                    if (this._isVoxelEmpty(x - 1, y, z)) {
                        this._bufferSet!.addQuad([p1, p4, p8, p5], color); // west
                    }

                    if (this._isVoxelEmpty(x + 1, y, z)) {
                        this._bufferSet!.addQuad([p3, p2, p6, p7], color); // east
                    }
                }
            }
        }

        this._bufferSet!.updateBuffers();
    }

    /**
     * Returns the THREE.Mesh representing the voxel world.
     * If buffers are not built yet, builds them first.
     */
    getMesh(): Mesh {
        if (!this._bufferSet) {
            this._buildBuffers();
        }
        // @ts-ignore
        return this._bufferSet!.mesh;
    }

    /**
     * Renders the chunk.
     */
    render(scene: Scene) {
        if (this._bufferSet) {
            this._bufferSet.render(scene);
        }
    }

    /**
     * Raycasts from origin to direction.
     *
     * Source:
     * https://gamedev.stackexchange.com/a/49423
     *
     * Call the callback with (x,y,z,value,face) of all blocks along the line
     * segment from point 'origin' in vector direction 'direction' of length
     * 'radius'. 'radius' may be infinite.
     *
     * 'face' is the normal vector of the face of that block that was entered.
     * It should not be used after the callback returns.
     *
     * If the callback returns a true value, the traversal will be stopped.
     *
     * @param {!vec3} origin
     * @param {!vec3} direction
     * @param {number} radius
     * @return {?number} Undefined if no collision; the distance if collision.
     */
    raycast(origin: Vector3, direction: Vector3, radius: number): number | null {
        // Convert to voxel-space so the algorithm assumes unit-sized cubes.
        let sOrigin = [origin[0] / this._voxelScale, origin[1] / this._voxelScale, origin[2] / this._voxelScale];
        let sDirection = [
            direction[0] / this._voxelScale,
            direction[1] / this._voxelScale,
            direction[2] / this._voxelScale,
        ];

        // Cube containing origin point (in voxel coords).
        let x = Math.floor(sOrigin[0]);
        let y = Math.floor(sOrigin[1]);
        let z = Math.floor(sOrigin[2]);

        // Break out direction vector (in voxel coords).
        let dx = sDirection[0];
        let dy = sDirection[1];
        let dz = sDirection[2];

        // Direction to increment x,y,z when stepping.
        const stepX = signum(dx);
        const stepY = signum(dy);
        const stepZ = signum(dz);

        // See description above. The initial values depend on the fractional
        // part of the origin. Guard zero components.
        let tMaxX = dx === 0 ? Infinity : intbound(sOrigin[0], dx);
        let tMaxY = dy === 0 ? Infinity : intbound(sOrigin[1], dy);
        let tMaxZ = dz === 0 ? Infinity : intbound(sOrigin[2], dz);

        // The change in t when taking a step (always positive).
        let tDeltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
        let tDeltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
        let tDeltaZ = dz === 0 ? Infinity : Math.abs(1 / dz);

        // Avoids an infinite loop when direction is zero
        if (dx === 0 && dy === 0 && dz === 0) {
            throw new RangeError();
        }

        // Convert radius into voxel-space units before normalizing by |direction|.
        radius = radius / this._voxelScale;
        // Rescale from units of 1 cube-edge to units of 'direction' so we can
        // compare with 't'.
        const dirLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
        radius /= dirLen;

        // Quick early-out: if origin is inside a solid voxel
        if (!this._isVoxelEmpty(x, y, z)) {
            return 0;
        }

        let t = Math.min(tMaxX, tMaxY, tMaxZ);

        while (t <= radius) {
            // Step the axis with smallest tMax
            if (tMaxX < tMaxY) {
                if (tMaxX < tMaxZ) {
                    x += stepX;
                    t = tMaxX;
                    tMaxX += tDeltaX;
                } else {
                    z += stepZ;
                    t = tMaxZ;
                    tMaxZ += tDeltaZ;
                }
            } else {
                if (tMaxY < tMaxZ) {
                    y += stepY;
                    t = tMaxY;
                    tMaxY += tDeltaY;
                } else {
                    z += stepZ;
                    t = tMaxZ;
                    tMaxZ += tDeltaZ;
                }
            }

            // If we've left the voxel grid entirely -> stop
            if (!this._inBoundsVoxel(x, y, z)) {
                return null;
            }

            // If the voxel is solid, return the intersection distance
            if (!this._isVoxelEmpty(x, y, z)) {
                return t * this._voxelScale;
            }
        }
        // No intersection within radius
        return null;
    }
}
