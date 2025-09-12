import type {Rotation} from '../lib/encoder.js';

export type vec3 = [number, number, number];

export type DoorSpec = {
    // local coords relative to room origin: x in [0..w-1], z in [0..d-1], y floor-level
    x: number;
    z: number;
    rotation: Rotation;
};

export type HoleSpec = {
    x: number;
    z: number;
    rotation: Rotation;
    spawnRate?: number; // mice per minute, default 1
    active?: boolean; // if false, no mice will spawn
};

export type Room = {
    origin: vec3; // world origin for the room (lower-left corner)
    size: vec3; // in voxels/meters in X, Y, Z
    floorModel: string;
    ceilingModel: string;
    wallModel: string; // single or array indexed by side if needed
    doors?: DoorSpec[];
    mouseHoles?: HoleSpec[];
    contents?: {model: string; pos: vec3; rot?: Rotation}[]; // chairs, bombs etc
};

export interface ButtonEvent {
    id: number;
}

export interface InteractEvent {
    pos: {
        x: number;
        y: number;
        z: number;
    };
}
