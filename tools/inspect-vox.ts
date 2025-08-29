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

const ENGINE_PALETTE: [number, number, number][] = [
    [0, 0, 0],
    [0, 0, 170],
    [0, 170, 0],
    [0, 170, 170],
    [170, 0, 0],
    [170, 0, 170],
    [170, 85, 0],
    [170, 170, 170],
    [85, 85, 85],
    [85, 85, 255],
    [85, 255, 85],
    [85, 255, 255],
    [255, 85, 85],
    [255, 85, 255],
    [255, 255, 85],
    [255, 255, 255],
];

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
