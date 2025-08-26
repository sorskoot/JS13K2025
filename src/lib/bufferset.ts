/*
MIT License

Copyright (c) 2020 Cody Ebberson
https://github.com/codyebberson/js13k-minipunk

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

Timmy Kokke, Sorskoot - 2025
Changes:
- Converted to TypeScript
- Changed to Three.js


*/

import {BufferGeometry, Mesh, MeshStandardMaterial, Scene, Vector3} from 'three';

/**
 * Default maximum quads per VBO.
 * @const {number}
 */
let DEFAULT_MAX_QUADS = 1000;

export class BufferSet {
    geometry: BufferGeometry;
    material: MeshStandardMaterial;
    mesh: Mesh;
    positions: number[];
    colors: number[];
    normals: number[];
    vertexCount: number;

    constructor() {
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.MeshStandardMaterial({vertexColors: true});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.positions = [];
        this.colors = [];
        this.normals = [];
        this.vertexCount = 0;
    }

    resetBuffers() {
        this.positions = [];
        this.colors = [];
        this.normals = [];
        this.vertexCount = 0;
        this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([]), 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array([]), 3));
        this.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([]), 3));
        this.geometry.setIndex([]);
    }

    /**
     *
     * @param {!Array.<!vec3>} points Array of 4 corners.
     * @param {number} color The quad color.
     */
    addQuad(points: Array<Vector3>, color: number) {
        // Calculate normal
        const v0 = points[0],
            v1 = points[1],
            v2 = points[2],
            v3 = points[3];
        const normal = new THREE.Vector3().subVectors(v1, v0).cross(new THREE.Vector3().subVectors(v3, v0)).normalize();

        // Indices for two triangles
        const indices = [0, 1, 2, 0, 2, 3];
        for (let k = 0; k < 6; k++) {
            const i = indices[k];
            this.positions.push(points[i].x, points[i].y, points[i].z);
            this.normals.push(normal.x, normal.y, normal.z);

            // Convert color (number) to RGB
            const r = ((color >> 16) & 0xff) / 255;
            const g = ((color >> 8) & 0xff) / 255;
            const b = (color & 0xff) / 255;
            this.colors.push(r, g, b);

            this.vertexCount++;
        }
    }

    /**
     * Adds a cube to the buffer set.
     * @param {!cube} p
     * @param {number} color
     */
    addCube2(p: Array<Vector3>, color: number) {
        this.addQuad([p[0], p[1], p[2], p[3]], color); // top
        this.addQuad([p[7], p[6], p[5], p[4]], color); // bottom
        this.addQuad([p[1], p[0], p[4], p[5]], color); // north
        this.addQuad([p[3], p[2], p[6], p[7]], color); // south
        this.addQuad([p[0], p[3], p[7], p[4]], color); // west
        this.addQuad([p[2], p[1], p[5], p[6]], color); // east
    }

    /**
     * Adds a cube to the buffer set.
     * @param {number} cx Center x
     * @param {number} cy Center y
     * @param {number} cz Center z
     * @param {number} r Radius (half width)
     * @param {number} color The color
     */
    addCube(cx: number, cy: number, cz: number, r: number, color: number) {
        const p1 = new THREE.Vector3(cx - r, cy + r, cz + r);
        const p2 = new THREE.Vector3(cx + r, cy + r, cz + r);
        const p3 = new THREE.Vector3(cx + r, cy + r, cz - r);
        const p4 = new THREE.Vector3(cx - r, cy + r, cz - r);
        const p5 = new THREE.Vector3(cx - r, cy - r, cz + r);
        const p6 = new THREE.Vector3(cx + r, cy - r, cz + r);
        const p7 = new THREE.Vector3(cx + r, cy - r, cz - r);
        const p8 = new THREE.Vector3(cx - r, cy - r, cz - r);
        this.addQuad([p1, p2, p3, p4], color); // top
        this.addQuad([p8, p7, p6, p5], color); // bottom
        this.addQuad([p2, p1, p5, p6], color); // north
        this.addQuad([p4, p3, p7, p8], color); // south
        this.addQuad([p1, p4, p8, p5], color); // west
        this.addQuad([p3, p2, p6, p7], color); // east
    }

    /**
     * Adds a rotated cube to the buffer set.
     * @param {number} cx Center x
     * @param {number} cy Center y
     * @param {number} cz Center z
     * @param {number} r Radius (half width)
     * @param {number} color The color
     * @param {number} theta The rotation (in radians)
     */
    addRotatedCube(cx: number, cy: number, cz: number, r: number, color: number, theta: number) {
        const cp = new THREE.Vector3(cx, cy, cz);
        const origin = new THREE.Vector3(0, 0, 0);
        const p = [
            new THREE.Vector3(-r, r, r),
            new THREE.Vector3(r, r, r),
            new THREE.Vector3(r, r, -r),
            new THREE.Vector3(-r, r, -r),
            new THREE.Vector3(-r, -r, r),
            new THREE.Vector3(r, -r, r),
            new THREE.Vector3(r, -r, -r),
            new THREE.Vector3(-r, -r, -r),
        ];
        for (let i = 0; i < p.length; i++) {
            p[i].applyAxisAngle(new THREE.Vector3(0, 1, 0), theta);
            p[i].add(cp);
        }
        this.addQuad([p[0], p[1], p[2], p[3]], color); // top
        this.addQuad([p[7], p[6], p[5], p[4]], color); // bottom
        this.addQuad([p[1], p[0], p[4], p[5]], color); // north
        this.addQuad([p[3], p[2], p[6], p[7]], color); // south
        this.addQuad([p[0], p[3], p[7], p[4]], color); // west
        this.addQuad([p[2], p[1], p[5], p[6]], color); // east
    }

    /**
     * Updates the webgl buffers with the current buffer state.
     */
    updateBuffers() {
        this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.positions), 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.colors), 3));
        this.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.normals), 3));
        // Optionally, set index if needed for indexed drawing
        // this.geometry.setIndex([...]);
        this.geometry.computeVertexNormals();
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.normal.needsUpdate = true;
    }

    /**
     * Draw the scene.
     */
    render(scene: Scene) {
        if (this.vertexCount === 0) {
            return;
        }
        if (!scene.children.includes(this.mesh)) {
            scene.add(this.mesh);
        }
    }
}
