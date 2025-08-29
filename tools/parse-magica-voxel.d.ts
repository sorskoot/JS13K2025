declare module 'parse-magica-voxel' {
    type Input = Buffer | Uint8Array | ArrayBuffer | string;

    export interface Size {
        x: number;
        y: number;
        z: number;
    }

    export interface Voxel {
        x: number;
        y: number;
        z: number;
        c: number;
    }

    export interface NTRNEntry {
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

    export interface Layer {
        id: number;
        attributes: Record<string, number>;
        reserved_id: number;
    }

    export interface Color {
        r: number;
        g: number;
        b: number;
        a: number;
    }

    export interface MatlItem {
        id: number;
        properties: Record<string, number>;
    }

    export type RObjEntry = Record<string, number>;

    export interface RCamItem {
        id: number;
        attribute: Record<string, number>;
    }

    export interface NoteSection {
        color_names: string[];
    }

    export interface VoxDocument {
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

    export default function parseMagicaVoxel(input: Input): VoxDocument;
}
