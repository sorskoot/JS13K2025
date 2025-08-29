/// <reference path="./parse-magica-voxel.d.ts" />
// Local fallback types (keeps this script simple without changing tsconfig)
type Voxel = any;
type VoxDocument = any;
import * as fs from 'fs';
import * as path from 'path';
import parseMagicaVoxel from 'parse-magica-voxel';

const inputPath: string = process.argv[2] || './3x3x3.vox';

type Output = {
    data: number[][];
};

fs.readFile(inputPath, (err: NodeJS.ErrnoException | null, buffer: Buffer) => {
    if (err) throw err;
    const parsed: VoxDocument = parseMagicaVoxel(buffer);

    const output: Output = {data: []};

    // build output path with same name but .json extension
    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(parsedPath.dir || '.', parsedPath.name + '.json');

    parsed.XYZI.forEach((voxel: Voxel) => {
        const {x, y, z, c} = voxel;

        // write the data in bits. Assume max size 8x8x8 for now
        // per voxel, we want to use 4 bits to identify the color.
        // So each x row is a bitfield of 4-bit color values.
        // e.g. if we have voxels at (0,0,0) with color 3 and (2,0,0) with color 5,
        // then row 0 (y=0,z=0) would be: 0b01010011 = 0x53
        // We can store two colors per byte, so we need Math.ceil(size.x / 2) bytes per row.
        // We'll store rows in an array indexed by z, then y.
        // So output.data[z][y] = bitfield for that row.
        if (!output.data[z]) {
            output.data[z] = [];
        }
        if (output.data[z][y] === undefined) {
            output.data[z][y] = 0;
        }
        // Pack 4-bit color values, two colors per byte.
        // For voxel at x: determine which byte and which nibble (low/high) to store the color.
        const byteIndex = Math.floor(x / 2);
        const nibbleShift = x % 2 === 0 ? 0 : 4;
        const shift = byteIndex * 8 + nibbleShift; // place nibble inside the correct byte
        const colorNibble = (c & 0xf) << shift;
        output.data[z][y] = output.data[z][y] | colorNibble;
    });

    // Build a small per-model palette mapping (local indices 1..N) from encountered color ids in the VOX
    // We'll record the original color indices (c) encountered so tooling can map them to engine palette indices.
    // Enhanced: merge very-similar colors and quantize to MAX_LOCAL (k-means) to avoid >15 colors and noisy gradients
    const MAX_LOCAL = 15;
    const MERGE_SIMILAR = true;
    const MERGE_THRESH = 30 * 30; // squared distance threshold for merging very similar colors

    const rawColorCounts = new Map<number, number>();
    for (const v of parsed.XYZI as Voxel[]) {
        const c = v.c || 0;
        if (c === 0) continue;
        rawColorCounts.set(c, (rawColorCounts.get(c) || 0) + 1);
    }
    // paletteArray holds encountered raw ids in order of first appearance
    const paletteArray: number[] = [];
    for (const v of parsed.XYZI as Voxel[]) {
        const c = v.c || 0;
        if (c === 0) continue;
        if (!paletteArray.includes(c)) paletteArray.push(c);
    }

    // helper: squared RGB distance
    function rgbDist2(a: {r: number; g: number; b: number}, b: {r: number; g: number; b: number}) {
        const dr = a.r - b.r,
            dg = a.g - b.g,
            db = a.b - b.b;
        return dr * dr + dg * dg + db * db;
    }

    // Build array of color entries with RGBA
    const rawColors = paletteArray.map((rawId) => {
        const col = (parsed.RGBA && parsed.RGBA[rawId - 1]) || {r: 255, g: 255, b: 255};
        return {rawId, r: col.r, g: col.g, b: col.b};
    });

    // merge very similar colors (deterministic greedy)
    function mergeSimilar(colors: {rawId: number; r: number; g: number; b: number}[]) {
        const reps: {rawId: number; r: number; g: number; b: number}[] = [];
        const mapRawToRep = new Map<number, number>();
        for (const c of colors) {
            let found = false;
            for (const r of reps) {
                if (rgbDist2(c, r) <= MERGE_THRESH) {
                    mapRawToRep.set(c.rawId, r.rawId);
                    found = true;
                    break;
                }
            }
            if (!found) {
                reps.push(c);
                mapRawToRep.set(c.rawId, c.rawId);
            }
        }
        return {reps, mapRawToRep};
    }

    // k-means clustering (small, deterministic initialization)
    function kmeansCluster(colors: {rawId: number; r: number; g: number; b: number}[], targetK: number, iters = 8) {
        if (colors.length <= targetK) {
            const mapping = new Map<number, number>();
            colors.forEach((c, i) => mapping.set(c.rawId, i + 1));
            return {clusters: colors.map((c) => [c.rawId]), mapping};
        }
        const centroids = colors.slice(0, targetK).map((c) => ({r: c.r, g: c.g, b: c.b}));
        let assignment = new Array(colors.length).fill(0);
        for (let it = 0; it < iters; it++) {
            for (let i = 0; i < colors.length; i++) {
                let best = 0,
                    bestD = Infinity;
                for (let k = 0; k < centroids.length; k++) {
                    const d = rgbDist2(colors[i], centroids[k]);
                    if (d < bestD) {
                        bestD = d;
                        best = k;
                    }
                }
                assignment[i] = best;
            }
            for (let k = 0; k < centroids.length; k++) {
                let cnt = 0,
                    sr = 0,
                    sg = 0,
                    sb = 0;
                for (let i = 0; i < colors.length; i++)
                    if (assignment[i] === k) {
                        cnt++;
                        sr += colors[i].r;
                        sg += colors[i].g;
                        sb += colors[i].b;
                    }
                if (cnt > 0) {
                    centroids[k].r = Math.round(sr / cnt);
                    centroids[k].g = Math.round(sg / cnt);
                    centroids[k].b = Math.round(sb / cnt);
                }
            }
        }
        const mapping = new Map<number, number>();
        const clusters: number[][] = Array.from({length: centroids.length}, () => []);
        for (let i = 0; i < colors.length; i++) {
            const ci = assignment[i];
            mapping.set(colors[i].rawId, ci + 1);
            clusters[ci].push(colors[i].rawId);
        }
        return {clusters, mapping};
    }

    const merged = MERGE_SIMILAR ? mergeSimilar(rawColors) : {reps: rawColors, mapRawToRep: new Map<number, number>()};
    const repList = merged.reps;

    const rawToLocal = new Map<number, number>();
    const localRepresentatives: number[] = [];
    if (repList.length > MAX_LOCAL) {
        const {mapping} = kmeansCluster(repList, MAX_LOCAL, 10);
        for (const c of rawColors) {
            const repRaw = merged.mapRawToRep.get(c.rawId) || c.rawId;
            const local = mapping.get(repRaw) || 1;
            rawToLocal.set(c.rawId, local);
        }
        const repsByLocal: Map<number, number[]> = new Map();
        for (const c of repList) {
            const repLocal = mapping.get(c.rawId)!;
            const arr = repsByLocal.get(repLocal) || [];
            arr.push(c.rawId);
            repsByLocal.set(repLocal, arr);
        }
        for (let i = 1; i <= MAX_LOCAL; i++) {
            const arr = repsByLocal.get(i) || [];
            localRepresentatives[i - 1] = arr.length ? arr[0] : repList[0].rawId;
        }
    } else {
        for (let i = 0; i < repList.length; i++) {
            const repRawId = repList[i].rawId;
            localRepresentatives[i] = repRawId;
        }
        for (const c of rawColors) {
            const repRaw = merged.mapRawToRep.get(c.rawId) || c.rawId;
            const localIdx = localRepresentatives.indexOf(repRaw) + 1;
            rawToLocal.set(c.rawId, localIdx || 1);
        }
    }

    // Rebuild paletteMap/paletteArray using rawToLocal mapping
    const paletteMap = new Map<number, number>();
    const newPaletteArray: number[] = [];
    for (const [raw, local] of rawToLocal.entries()) {
        paletteMap.set(raw, local);
    }
    const maxLocal = Math.max(...Array.from(rawToLocal.values()), 0);
    for (let i = 1; i <= maxLocal; i++) {
        const rep =
            localRepresentatives[i - 1] ||
            Array.from(paletteMap.keys()).find((k) => paletteMap.get(k) === i) ||
            paletteArray[0];
        newPaletteArray.push(rep as number);
    }
    // overwrite paletteArray with representative rawIds
    paletteArray.length = 0;
    for (let i = 0; i < newPaletteArray.length; i++) paletteArray.push(newPaletteArray[i]);

    // Attach palette info to output so callers can build encoded strings referencing a per-model palette
    (output as any).palette = paletteArray; // palette[0] is local index 1
    (output as any).paletteMap = Object.fromEntries(Array.from(paletteMap.entries()));

    // --- Build final encoded string in the strict format expected at runtime:
    // dictCSV|indexChars|paletteCSV
    // where dict keys are vertical columns along Y (key[y] = local nibble 0..f),
    // indexChars is sizeX*sizeZ characters from ALPHABET mapping to dict indices,
    // and paletteCSV maps localIndex (1..N) -> engine palette index (0..15).
    const sizeX = parsed.SIZE.x || 8;
    const sizeY = parsed.SIZE.y || 8;
    const sizeZ = parsed.SIZE.z || 8;

    const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

    // If your MagicaVoxel exported axes differ from the engine (Z vs Y), enable SWAP_YZ
    const SWAP_YZ = true;

    function getNibble(x: number, y: number, z: number): number {
        // If SWAP_YZ is true, map engine (x,y,z) -> magica (x, z, y) because output.data is indexed by [magicaZ][magicaY]
        const mz = y;
        const my = z;
        const slice = output.data[mz];
        if (!slice) return 0;
        const row = slice[my];
        if (row === undefined) return 0;
        const byteIndex = Math.floor(x / 2);
        const nibbleShift = x % 2 === 0 ? 0 : 4;
        const shift = byteIndex * 8 + nibbleShift;
        return (row >>> shift) & 0xf;
    }

    // Build a 3D color grid from parsed voxels (raw color ids), mapping Magica coords into engine coords if needed
    const colorGrid: number[][][] = [];
    for (let x = 0; x < sizeX; x++) {
        colorGrid[x] = [];
        for (let y = 0; y < sizeY; y++) {
            colorGrid[x][y] = new Array(sizeZ).fill(0);
        }
    }
    for (const v of parsed.XYZI as Voxel[]) {
        const mx = v.x;
        const my = v.y;
        const mz = v.z;
        const ex = mx;
        const ey = SWAP_YZ ? mz : my;
        const ez = SWAP_YZ ? my : mz;
        if (ex >= 0 && ex < sizeX && ey >= 0 && ey < sizeY && ez >= 0 && ez < sizeZ) {
            colorGrid[ex][ey][ez] = v.c || 0;
        }
    }

    // Use paletteMap/paletteArray built earlier: rawColor -> localIndex
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

    // Build paletteCSV mapping localIndex -> engineIndex by nearest color in parsed.RGBA
    const ENGINE_PALETTE: [number, number, number][] = [
        [-1, -1, -1], // index 0 = empty and does not render
        [0, 0, 170],
        [0, 170, 0],
        [0, 170, 170],
        [170, 0, 0],
        [170, 0, 170],
        [0, 0, 0],
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
    function nearestEngineIndex(r: number, g: number, b: number) {
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < ENGINE_PALETTE.length; i++) {
            const [er, eg, eb] = ENGINE_PALETTE[i];
            const dr = r - er;
            const dg = g - eg;
            const db = b - eb;
            const d = dr * dr + dg * dg + db * db;
            if (d < bestDist) {
                bestDist = d;
                best = i;
            }
        }
        return best;
    }

    // Assign each local palette color to a unique engine palette index via optimal assignment (Hungarian)
    const paletteEntries: number[] = [];
    const m = paletteArray.length;
    const n = ENGINE_PALETTE.length;
    // build cost matrix rows=m cols=n (squared distances)
    const costRect: number[][] = new Array(m);
    for (let i = 0; i < m; i++) {
        const raw = paletteArray[i];
        let r = 255,
            g = 255,
            b = 255;
        if (parsed.RGBA && parsed.RGBA[raw - 1]) {
            const col = parsed.RGBA[raw - 1];
            r = col.r;
            g = col.g;
            b = col.b;
        }
        costRect[i] = new Array(n);
        for (let j = 0; j < n; j++) {
            const [er, eg, eb] = ENGINE_PALETTE[j];
            const dr = r - er;
            const dg = g - eg;
            const db = b - eb;
            costRect[i][j] = dr * dr + dg * dg + db * db;
        }
    }

    // Hungarian (Munkres) algorithm for square matrix. We'll pad to size N = max(m,n)
    function hungarianSolve(rect: number[][]) {
        const rows = rect.length;
        const cols = rect[0].length;
        const N = Math.max(rows, cols);
        const INF = 1e12;
        const a: number[][] = new Array(N);
        for (let i = 0; i < N; i++) {
            a[i] = new Array(N).fill(INF);
        }
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) a[i][j] = rect[i][j];
        }

        const u = new Array(N + 1).fill(0);
        const v = new Array(N + 1).fill(0);
        const p = new Array(N + 1).fill(0);
        const way = new Array(N + 1).fill(0);

        for (let i = 1; i <= N; i++) {
            p[0] = i;
            let j0 = 0;
            const minv = new Array(N + 1).fill(Infinity);
            const used = new Array(N + 1).fill(false);
            do {
                used[j0] = true;
                const i0 = p[j0];
                let delta = Infinity;
                let j1 = 0;
                for (let j = 1; j <= N; j++)
                    if (!used[j]) {
                        const cur = a[i0 - 1][j - 1] - u[i0] - v[j];
                        if (cur < minv[j]) {
                            minv[j] = cur;
                            way[j] = j0;
                        }
                        if (minv[j] < delta) {
                            delta = minv[j];
                            j1 = j;
                        }
                    }
                for (let j = 0; j <= N; j++) {
                    if (used[j]) {
                        u[p[j]] += delta;
                        v[j] -= delta;
                    } else minv[j] -= delta;
                }
                j0 = j1;
            } while (p[j0] != 0);
            do {
                const j1 = way[j0];
                p[j0] = p[j1];
                j0 = j1;
            } while (j0 !== 0);
        }

        const assignment = new Array(N).fill(-1);
        for (let j = 1; j <= N; j++) if (p[j] > 0) assignment[p[j] - 1] = j - 1;
        // return assignment for first 'rows' rows
        return assignment.slice(0, rows);
    }

    const assigned = m ? hungarianSolve(costRect) : [];
    for (let i = 0; i < m; i++) {
        const col = assigned[i];
        if (col === -1 || col >= n) {
            // fallback to nearest if something odd happens
            let best = 0;
            let bestD = Infinity;
            for (let j = 0; j < n; j++) {
                if (costRect[i][j] < bestD) {
                    bestD = costRect[i][j];
                    best = j;
                }
            }
            paletteEntries.push(best);
        } else {
            paletteEntries.push(col);
        }
    }

    const paletteCSV = paletteEntries.join(',');
    const encoded = dict.join(',') + '|' + indexChars + '|' + paletteCSV;

    (output as any).columnDict = dict;
    (output as any).columnIndex = indexChars;
    (output as any).encoded = encoded;

    fs.writeFile(outputPath, JSON.stringify(output, null, 2), (werr: NodeJS.ErrnoException | null) => {
        if (werr) throw werr;
        console.log('Wrote JSON to', outputPath);
        console.log('Encoded string:', encoded);
    });
});
