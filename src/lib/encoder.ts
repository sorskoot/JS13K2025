import type {Vector3} from 'three';
import {VoxelEngine, VOXELS_PER_METER} from './voxelengine.js';

// --- Column-dictionary decoder ---
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'; // 64 chars

export function addModelFromEncoded(
    encoded: string,
    engine: VoxelEngine,
    offset: Vector3 = new THREE.Vector3(0, 0, 0)
) {
    const size = VOXELS_PER_METER;
    const parts = encoded.split('|');
    const dictPart = parts[0] || '';
    const indexPart = parts[1] || '';
    const palettePart = parts[2] || '';
    const dict = dictPart ? dictPart.split(',') : [];

    // parse optional palette: palettePart is comma-separated numeric engine indices
    // palette[localIndex] -> engineIndex (local indices 1..15), index 0 reserved for empty
    const palette: number[] = [];
    if (palettePart) {
        const entries = palettePart.split(',').filter(Boolean);
        for (let i = 0; i < entries.length; i++) {
            const n = parseInt(entries[i], 10);
            palette[i + 1] = isNaN(n) ? 0 : n;
        }
    }

    // Expect compact single-char-per-position index string (no fallbacks)
    if (indexPart.length !== size * size) {
        throw new Error(`Invalid encoded index length ${indexPart.length}, expected ${size * size}`);
    }

    let pos = 0;
    for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
            const ch = indexPart[pos++];
            const dictIdx = ALPHABET.indexOf(ch);
            const key = dict[dictIdx];
            if (!key) continue;
            for (let y = 0; y < size; y++) {
                const local = parseInt(key[y] || '0', 16);
                if (local !== 0) {
                    const color = palette[local] !== undefined ? palette[local] : local;
                    const px = x / VOXELS_PER_METER + offset.x;
                    const py = y / VOXELS_PER_METER + offset.y;
                    const pz = z / VOXELS_PER_METER + offset.z;
                    engine.setCube(px, py, pz, color);
                }
            }
        }
    }
}
