import * as fs from 'fs';
import * as path from 'path';
import parseMagicaVoxel from 'parse-magica-voxel';
// parse-magica-voxel doesn't ship types here; treat as any/func
//const parseMagicaVoxel: (buf: Buffer) => any = require('parse-magica-voxel');

// Type definitions extracted from e:\Dev\JS13K2025\tools\3x3x3.json

interface Size {
    x: number;
    y: number;
    z: number;
}

interface Voxel {
    x: number;
    y: number;
    z: number;
    c: number;
}

interface NTRNEntry {
    node_id: number;
    attributes: Record<string, any>;
    child_id: number;
    reserved_id: number;
    layer_id: number;
    num_of_frames: number;
    frame_transforms: Array<Record<string, any>>;
}

export interface NGRP {
    id: number;
    attributes: Record<string, any>;
    num_of_children: number;
    child_ids: number[];
}

export interface NSHPModel {
    id: number;
    attributes: Record<string, any>;
}

export interface NSHP {
    id: number;
    attributes: Record<string, any>;
    num_of_models: number;
    models: NSHPModel[];
}

interface Layer {
    id: number;
    attributes: Record<string, number>;
    reserved_id: number;
}

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface MatlItem {
    id: number;
    properties: Record<string, number>;
}

type RObjEntry = Record<string, number>;

interface RCamItem {
    id: number;
    attribute: Record<string, number>;
}

interface NoteSection {
    color_names: string[];
}

interface VoxDocument {
    'VOX '?: number;
    SIZE: Size;
    XYZI: Voxel[];
    nTRN?: NTRNEntry[];
    nGRP?: NGRP;
    nSHP?: NSHP;
    LAYR?: Layer[];
    RGBA?: Color[];
    MATL?: MatlItem[];
    rOBJ?: RObjEntry[];
    rCAM?: RCamItem[];
    NOTE?: NoteSection;
    // allow additional unknown fields present in some VOX exports
    [key: string]: any;
}

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

    parsed.XYZI.forEach((voxel) => {
        const {x, y, z, c} = voxel;
        console.log(`Voxel at (${x},${y},${z}) with color ${c}`);
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

    fs.writeFile(outputPath, JSON.stringify(output, null, 2), (werr: NodeJS.ErrnoException | null) => {
        if (werr) throw werr;
        console.log('Wrote JSON to', outputPath);
    });
});
