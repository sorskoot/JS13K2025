/// <reference path="./parse-magica-voxel.d.ts" />
// Simple parser/encoder for MagicaVoxel .vox files that writes per-model JSON outputs.
// Usage: npx ts-node tools/parse-vox.ts path/to/file.vox

import * as fs from 'fs';
import * as path from 'path';
import parseMagicaVoxel from 'parse-magica-voxel';

type Voxel = any;
type VoxDocument = any;

type Output = {
    data: number[][];
    palette?: number[];
    paletteMap?: Record<number, number>;
    columnDict?: string[];
    columnIndex?: string;
    encoded?: string;
};

const inputPath: string = process.argv[2] || './3x3x3.vox';

if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    process.exit(1);
}

const buffer = fs.readFileSync(inputPath);
const parsed: VoxDocument = parseMagicaVoxel(buffer);
const parsedPath = path.parse(inputPath);
const outputBase = path.join(parsedPath.dir || '.', parsedPath.name);

const sizes: Array<{x: number; y: number; z: number}> = Array.isArray(parsed.SIZE)
    ? parsed.SIZE
    : [parsed.SIZE || {x: 8, y: 8, z: 8}];

const rawXYZI = parsed.XYZI as any[];
const modelsVoxels: Voxel[][] = [];

if (Array.isArray(rawXYZI)) {
    let leading: Voxel[] = [];
    for (const item of rawXYZI) {
        if (Array.isArray(item)) {
            if (leading.length) {
                modelsVoxels.push(leading);
                leading = [];
            }
            modelsVoxels.push(item as Voxel[]);
        } else if (item && typeof item.x === 'number') {
            leading.push(item as Voxel);
        }
    }
    if (leading.length) modelsVoxels.push(leading);
}

if (modelsVoxels.length === 0 && Array.isArray(parsed.XYZI)) modelsVoxels.push(parsed.XYZI as Voxel[]);
if (modelsVoxels.length === 0) {
    console.warn('No voxel models found in', inputPath);
    process.exit(0);
}

function rgbDist2(a: {r: number; g: number; b: number}, b: {r: number; g: number; b: number}) {
    const dr = a.r - b.r,
        dg = a.g - b.g,
        db = a.b - b.b;
    return dr * dr + dg * dg + db * db;
}

const paletteRGB = [
    'd9d3d9',
    'b8b0b9',
    '9a919b',
    '6d606d',
    '000000',
    '2a202a',
    'c28683',
    'a7776b',
    '865d56',
    '694744',
    '3e2730',
    '8a2e3f',
    'a83f48',
    'c55650',
    'd37755',
    'dc995d',
    'dec575',
    'a8b164',
    '6f975e',
    '3b6b58',
    '2d494b',
    '466f77',
    '6c9ba7',
    '9db8c5',
    '7e8aa7',
    '524f73',
    '483355',
    '613661',
    '823e69',
    'b6607c',
    'd3a092',
    'd6b7b1',
    '5f80a6',
    '566794',
    '74628f',
    '6c437a',
    '54373a',
    '612b38',
    '36373d',
    '432d42',
];
function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace(/^#/, '').trim();
    if (h.length === 3) {
        const r = parseInt(h[0] + h[0], 16);
        const g = parseInt(h[1] + h[1], 16);
        const b = parseInt(h[2] + h[2], 16);
        return [r, g, b];
    } else if (h.length === 6) {
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return [r, g, b];
    } else {
        throw new Error(`Invalid hex color: "${hex}"`);
    }
}
const ENGINE_PALETTE: [number, number, number][] = paletteRGB.map(hexToRgb);
// [
//     [-1, -1, -1],
//     [0, 0, 170],
//     [0, 170, 0],
//     [0, 170, 170],
//     [170, 0, 0],
//     [170, 0, 170],
//     [0, 0, 0],
//     [170, 170, 170],
//     [85, 85, 85],
//     [85, 85, 255],
//     [85, 255, 85],
//     [85, 255, 255],
//     [255, 85, 85],
//     [255, 85, 255],
//     [255, 255, 85],
//     [255, 255, 255],
// ];

function nearestEngineIndex(r: number, g: number, b: number) {
    let best = 0,
        bestD = Infinity;
    for (let i = 0; i < ENGINE_PALETTE.length; i++) {
        const [er, eg, eb] = ENGINE_PALETTE[i];
        const dr = r - er,
            dg = g - eg,
            db = b - eb;
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) {
            bestD = d;
            best = i;
        }
    }
    return best;
}

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
const SWAP_YZ = true;

const allEncoded: string[] = [];
const allMetadata: Output[] = [];

for (let mi = 0; mi < modelsVoxels.length; mi++) {
    const modelVoxels = modelsVoxels[mi];
    const sizeObj = sizes[mi] || sizes[0] || {x: 8, y: 8, z: 8};
    const sizeX = sizeObj.x || 8,
        sizeY = sizeObj.y || 8,
        sizeZ = sizeObj.z || 8;

    const output: Output = {data: []};

    for (const v of modelVoxels) {
        const x = v.x,
            y = v.y,
            z = v.z,
            c = v.c || 0;
        if (!output.data[z]) output.data[z] = [];
        if (output.data[z][y] === undefined) output.data[z][y] = 0;
        const byteIndex = Math.floor(x / 2);
        const nibbleShift = x % 2 === 0 ? 0 : 4;
        const shift = byteIndex * 8 + nibbleShift;
        output.data[z][y] = output.data[z][y] | (((c & 0xf) as number) << shift);
    }

    const paletteArray: number[] = [];
    for (const v of modelVoxels) {
        const c = v.c || 0;
        if (c === 0) continue;
        if (!paletteArray.includes(c)) paletteArray.push(c);
    }

    const paletteMap = new Map<number, number>();
    for (let i = 0; i < paletteArray.length; i++) paletteMap.set(paletteArray[i], i + 1);

    const colorGrid: number[][][] = [];
    for (let x = 0; x < sizeX; x++) {
        colorGrid[x] = [];
        for (let y = 0; y < sizeY; y++) colorGrid[x][y] = new Array(sizeZ).fill(0);
    }
    for (const v of modelVoxels) {
        const mx = v.x,
            my = v.y,
            mz = v.z;
        const ex = mx;
        const ey = SWAP_YZ ? mz : my;
        const ez = SWAP_YZ ? my : mz;
        if (ex >= 0 && ex < sizeX && ey >= 0 && ey < sizeY && ez >= 0 && ez < sizeZ) colorGrid[ex][ey][ez] = v.c || 0;
    }

    const dict: string[] = [];
    const dictMap = new Map<string, number>();
    let indexChars = '';
    for (let x = 0; x < sizeX; x++) {
        for (let z = 0; z < sizeZ; z++) {
            let key = '';
            for (let y = 0; y < sizeY; y++) {
                const raw = colorGrid[x][y][z] || 0;
                if (raw === 0) key += '0';
                else {
                    const local = paletteMap.get(raw) || 0;
                    key += local.toString(16);
                }
            }
            let idx = dictMap.get(key);
            if (idx === undefined) {
                idx = dict.length;
                dict.push(key);
                dictMap.set(key, idx);
            }
            if (idx >= ALPHABET.length) throw new Error('Too many unique columns for ALPHABET');
            indexChars += ALPHABET[idx];
        }
    }

    const paletteEntries: number[] = paletteArray.map((raw) => {
        const col = (parsed.RGBA && parsed.RGBA[raw - 1]) || {r: 255, g: 255, b: 255};
        return nearestEngineIndex(col.r, col.g, col.b) + 1;
    });

    const paletteCSV = paletteEntries.join(',');
    const encoded = dict.join(',') + '|' + indexChars + '|' + paletteCSV;

    output.palette = paletteArray;
    output.paletteMap = Object.fromEntries(Array.from(paletteMap.entries()));
    output.columnDict = dict;
    output.columnIndex = indexChars;
    output.encoded = encoded;
    allEncoded.push(encoded);
    allMetadata.push(output);
    console.log('Model', mi, 'encoded length', encoded.length);
}

// write single combined output containing the encoded array plus metadata per model
const combined: any = {
    source: path.basename(inputPath),
    modelCount: modelsVoxels.length,
    encoded: allEncoded,
    models: allMetadata,
};

const combinedOutPath = `${outputBase}.json`;
fs.writeFileSync(combinedOutPath, JSON.stringify(combined, null, 2));
console.log('Wrote combined output', combinedOutPath, 'models:', modelsVoxels.length);
