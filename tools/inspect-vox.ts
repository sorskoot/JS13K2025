import * as fs from 'fs';
import parseMagicaVoxel from 'parse-magica-voxel';

const inputPath = process.argv[2] || 'tools/Mouse.vox';
const buffer = fs.readFileSync(inputPath);
const parsed: any = parseMagicaVoxel(buffer);

// temporary file to inspect parsed structure
fs.writeFileSync('test.json', JSON.stringify(parsed, null, 2));

// Reconstruct paletteArray like parse-vox.ts
const paletteMap = new Map<number, number>();
const paletteArray: number[] = [];
for (const v of parsed.XYZI) {
    const c = v.c || 0;
    if (c === 0) continue;
    if (!paletteMap.has(c)) {
        paletteMap.set(c, paletteArray.length + 1);
        paletteArray.push(c);
    }
}

console.log('paletteArray:', paletteArray);
console.log('paletteMap:', Object.fromEntries(Array.from(paletteMap.entries())));
console.log('\nParsed RGBA length:', parsed.RGBA ? parsed.RGBA.length : 0);
if (parsed.RGBA) {
    paletteArray.forEach((raw) => {
        const col = parsed.RGBA[raw - 1];
        console.log(`raw ${raw} -> RGBA =`, col);
    });
}

const paletteRGB = [
    'd9d3d9',
    'b8b0b9',
    '9a919b',
    '6d606d',
    '473c47',
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

function nearestEngineIndexWithDists(r: number, g: number, b: number) {
    const dists: {i: number; d: number}[] = [];
    for (let i = 0; i < ENGINE_PALETTE.length; i++) {
        const [er, eg, eb] = ENGINE_PALETTE[i];
        const dr = r - er;
        const dg = g - eg;
        const db = b - eb;
        const d = dr * dr + dg * dg + db * db;
        dists.push({i, d});
    }
    dists.sort((a, b) => a.d - b.d);
    return dists;
}

console.log('\nNearest engine distances per palette entry:');
if (parsed.RGBA) {
    paletteArray.forEach((raw) => {
        const col = parsed.RGBA[raw - 1] || {r: 255, g: 255, b: 255};
        const dists = nearestEngineIndexWithDists(col.r, col.g, col.b);
        console.log(`raw ${raw} -> nearest: ${dists[0].i} (d=${dists[0].d}) ; second: ${dists[1].i} (d=${dists[1].d})`);
    });
}

console.log('\nFull parsed.RGBA (first 20):');
if (parsed.RGBA) console.log(parsed.RGBA.slice(0, 20));
else console.log('no RGBA');
