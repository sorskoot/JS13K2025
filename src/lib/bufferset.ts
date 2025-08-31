/*
 This file was originally based on Minipunk by Cody Ebberson.
 See NOTICE for details.
*/

import {BufferGeometry, Mesh, MeshStandardMaterial, Scene, Vector3} from 'three';

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
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
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
