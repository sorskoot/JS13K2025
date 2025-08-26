/*
 This file was originally based on Minipunk by Cody Ebberson.
 See NOTICE for details.
*/

import {Mesh, Scene} from 'three';
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
let TILE_EMPTY = 0;

export class VoxelEngine {
    data: Uint8Array<ArrayBuffer>;
    bufferSet: BufferSet | null;

    /**
     * Creates a new voxel engine.
     */
    constructor() {
        /**
         * Array of tile data.
         * 3D array flattened into a 1D array.
         * @type {!Uint8Array}
         * @private
         * @const
         */
        this.data = new Uint8Array(VOXELS_PER_WORLD_X * VOXELS_PER_WORLD_Y * VOXELS_PER_WORLD_Z);

        /**
         * WebGL buffers.
         * @type {?BufferSet}
         * @private
         */
        this.bufferSet = null;
    }

    /**
     * Returns true if the specified cube is out of range of the world.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {boolean}
     */
    isOutOfRange(x, y, z) {
        return x < 0 || x >= METERS_PER_WORLD_X || y < 0 || y >= METERS_PER_WORLD_Y || z < 0 || z >= METERS_PER_WORLD_Z;
    }

    /**
     * Returns the array index for the tile.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {number}
     */
    getIndex(x, y, z) {
        let x2 = (x / VOXEL_SCALE) | 0;
        let y2 = (y / VOXEL_SCALE) | 0;
        let z2 = (z / VOXEL_SCALE) | 0;
        return z2 * VOXELS_PER_WORLD_X * VOXELS_PER_WORLD_Y + y2 * VOXELS_PER_WORLD_X + x2;
    }

    /**
     * Returns the tile type for the tile.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {number}
     */
    getCube(x, y, z) {
        if (this.isOutOfRange(x, y, z)) {
            return TILE_EMPTY;
        }
        return this.data[this.getIndex(x, y, z)];
    }

    /**
     * Sets the tile type for the tile.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} v The tile type.
     */
    setCube(x: number, y: number, z: number, v: number) {
        if (this.isOutOfRange(x, y, z)) {
            return;
        }
        this.data[this.getIndex(x, y, z)] = v;
    }

    /**
     * Returns if the tiles is empty or out of range.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {boolean}
     */
    isEmpty(x, y, z) {
        return this.getCube(x, y, z) === TILE_EMPTY;
    }

    /**
     * Builds the WebGL BufferSet based on the tile data.
     */
    buildBuffers() {
        let i = 0;

        // Start with 6 quads for the skybox
        let count = 6;

        for (let z = 0; z < VOXELS_PER_WORLD_Z; z++) {
            for (let y = 0; y < VOXELS_PER_WORLD_Y; y++) {
                for (let x = 0; x < VOXELS_PER_WORLD_X; x++) {
                    let t = this.data[i++];
                    if (t === TILE_EMPTY) {
                        continue;
                    }
                    let x1 = x * VOXEL_SCALE;
                    let y1 = y * VOXEL_SCALE;
                    let z1 = z * VOXEL_SCALE;

                    if (this.isEmpty(x1, y1 + VOXEL_SCALE, z1)) {
                        count++; // top
                    }

                    if (this.isEmpty(x1, y1 - VOXEL_SCALE, z1)) {
                        count++; // bottom
                    }

                    if (this.isEmpty(x1, y1, z1 + VOXEL_SCALE)) {
                        count++; // north
                    }

                    if (this.isEmpty(x1, y1, z1 - VOXEL_SCALE)) {
                        count++; // south
                    }

                    if (this.isEmpty(x1 - VOXEL_SCALE, y1, z1)) {
                        count++; // west
                    }

                    if (this.isEmpty(x1 + VOXEL_SCALE, y1, z1)) {
                        count++; // east
                    }
                }
            }
        }

        this.bufferSet = new BufferSet();

        i = 0;
        for (let z = 0; z < VOXELS_PER_WORLD_Z; z++) {
            for (let y = 0; y < VOXELS_PER_WORLD_Y; y++) {
                for (let x = 0; x < VOXELS_PER_WORLD_X; x++) {
                    let t = this.data[i++];
                    if (t === TILE_EMPTY) {
                        continue;
                    }

                    let color = getTileColor(t);

                    let x1 = x * VOXEL_SCALE;
                    let y1 = y * VOXEL_SCALE;
                    let z1 = z * VOXEL_SCALE;

                    let x2 = x1 + VOXEL_SCALE;
                    let y2 = y1 + VOXEL_SCALE;
                    let z2 = z1 + VOXEL_SCALE;

                    let p1 = new THREE.Vector3(x1, y2, z2);
                    let p2 = new THREE.Vector3(x2, y2, z2);
                    let p3 = new THREE.Vector3(x2, y2, z1);
                    let p4 = new THREE.Vector3(x1, y2, z1);
                    let p5 = new THREE.Vector3(x1, y1, z2);
                    let p6 = new THREE.Vector3(x2, y1, z2);
                    let p7 = new THREE.Vector3(x2, y1, z1);
                    let p8 = new THREE.Vector3(x1, y1, z1);

                    if (this.isEmpty(x1, y1 + VOXEL_SCALE, z1)) {
                        this.bufferSet.addQuad([p1, p2, p3, p4], color); // top
                    }

                    if (this.isEmpty(x1, y1 - VOXEL_SCALE, z1)) {
                        this.bufferSet.addQuad([p8, p7, p6, p5], color); // bottom
                    }

                    if (this.isEmpty(x1, y1, z1 + VOXEL_SCALE)) {
                        this.bufferSet.addQuad([p2, p1, p5, p6], color); // north
                    }

                    if (this.isEmpty(x1, y1, z1 - VOXEL_SCALE)) {
                        this.bufferSet.addQuad([p4, p3, p7, p8], color); // south
                    }

                    if (this.isEmpty(x1 - VOXEL_SCALE, y1, z1)) {
                        this.bufferSet.addQuad([p1, p4, p8, p5], color); // west
                    }

                    if (this.isEmpty(x1 + VOXEL_SCALE, y1, z1)) {
                        this.bufferSet.addQuad([p3, p2, p6, p7], color); // east
                    }
                }
            }
        }

        this.bufferSet.updateBuffers();
    }

    /**
     * Returns the THREE.Mesh representing the voxel world.
     * If buffers are not built yet, builds them first.
     */
    getMesh(): Mesh {
        if (!this.bufferSet) {
            this.buildBuffers();
        }
        // @ts-ignore
        return this.bufferSet!.mesh;
    }

    /**
     * Renders the chunk.
     */
    render(scene: Scene) {
        if (this.bufferSet) {
            this.bufferSet.render(scene);
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
    raycast(origin, direction, radius) {
        // Convert to voxel-space so the algorithm assumes unit-sized cubes.
        let sOrigin = [origin[0] / VOXEL_SCALE, origin[1] / VOXEL_SCALE, origin[2] / VOXEL_SCALE];
        let sDirection = [direction[0] / VOXEL_SCALE, direction[1] / VOXEL_SCALE, direction[2] / VOXEL_SCALE];

        // Cube containing origin point (in voxel coords).
        var x = Math.floor(sOrigin[0]);
        var y = Math.floor(sOrigin[1]);
        var z = Math.floor(sOrigin[2]);

        // Break out direction vector (in voxel coords).
        var dx = sDirection[0];
        var dy = sDirection[1];
        var dz = sDirection[2];

        // Direction to increment x,y,z when stepping.
        var stepX = signum(dx);
        var stepY = signum(dy);
        var stepZ = signum(dz);

        // See description above. The initial values depend on the fractional
        // part of the origin.
        var tMaxX = intbound(sOrigin[0], dx);
        var tMaxY = intbound(sOrigin[1], dy);
        var tMaxZ = intbound(sOrigin[2], dz);

        // The change in t when taking a step (always positive).
        var tDeltaX = stepX / dx;
        var tDeltaY = stepY / dy;
        var tDeltaZ = stepZ / dz;

        // Buffer for reporting faces to the callback.
        var face = [0, 0, 0];

        // Avoids an infinite loop.
        if (dx === 0 && dy === 0 && dz === 0) {
            throw new RangeError();
        }

        // Convert radius into voxel-space units before normalizing by |direction|.
        radius = radius / VOXEL_SCALE;
        // Rescale from units of 1 cube-edge to units of 'direction' so we can
        // compare with 't'.
        radius /= Math.sqrt(dx * dx + dy * dy + dz * dz);

        let t = Math.min(tMaxX, tMaxY, tMaxZ);

        while (true) {
            if (face[0] > 0) {
                // Stepping west
                if (!this.isEmpty(x, y, z) || !this.isEmpty(x - 1, y, z)) {
                    return t * VOXEL_SCALE;
                }
            } else if (face[0] < 0) {
                // Stepping east
                if (!this.isEmpty(x, y, z) || !this.isEmpty(x + 1, y, z)) {
                    return t * VOXEL_SCALE;
                }
            }

            if (face[1] > 0) {
                // Stepping down
                if (!this.isEmpty(x, y, z) || !this.isEmpty(x, y - 1, z)) {
                    return t * VOXEL_SCALE;
                }
            } else if (face[1] < 0) {
                // Stepping up
                if (!this.isEmpty(x, y, z) || !this.isEmpty(x, y + 1, z)) {
                    return t * VOXEL_SCALE;
                }
            }

            if (face[2] > 0) {
                // Stepping south
                if (!this.isEmpty(x, y, z) || !this.isEmpty(x, y, z - 1)) {
                    return t * VOXEL_SCALE;
                }
            } else if (face[2] < 0) {
                // Stepping north
                if (!this.isEmpty(x, y, z) || !this.isEmpty(x, y, z + 1)) {
                    return t * VOXEL_SCALE;
                }
            }

            // tMaxX stores the t-value at which we cross a cube boundary along the
            // X axis, and similarly for Y and Z. Therefore, choosing the least tMax
            // chooses the closest cube boundary. Only the first case of the four
            // has been commented in detail.
            if (tMaxX < tMaxY) {
                if (tMaxX < tMaxZ) {
                    if (tMaxX > radius) {
                        break;
                    }
                    t = tMaxX;
                    // Update which cube we are now in.
                    x += stepX;
                    // Adjust tMaxX to the next X-oriented boundary crossing.
                    tMaxX += tDeltaX;
                    // Record the normal vector of the cube face we entered.
                    face[0] = -stepX;
                    face[1] = 0;
                    face[2] = 0;
                } else {
                    if (tMaxZ > radius) {
                        break;
                    }
                    t = tMaxZ;
                    z += stepZ;
                    tMaxZ += tDeltaZ;
                    face[0] = 0;
                    face[1] = 0;
                    face[2] = -stepZ;
                }
            } else {
                if (tMaxY < tMaxZ) {
                    if (tMaxY > radius) {
                        break;
                    }
                    t = tMaxY;
                    y += stepY;
                    tMaxY += tDeltaY;
                    face[0] = 0;
                    face[1] = -stepY;
                    face[2] = 0;
                } else {
                    // Identical to the second case, repeated for simplicity in
                    // the conditionals.
                    if (tMaxZ > radius) {
                        break;
                    }
                    t = tMaxZ;
                    z += stepZ;
                    tMaxZ += tDeltaZ;
                    face[0] = 0;
                    face[1] = 0;
                    face[2] = -stepZ;
                }
            }
        }

        return null;
    }
}
