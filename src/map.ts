import {Rotation} from './lib/encoder.js';
import {bomb, ceiling, chair, floor, walls, furniture} from './models.js';
import {Room} from './types/world-types.js';

// how rooms are connected: index into rooms array, each entry is an array of neighbor room indices
export const neighbors = [[1, 2], [0], [0, 3], [2, 4], [3, 5, 6], [4, 10], [4, 7, 8], [6], [6, 9], [8], [5]];

// Example rooms array that recreates your current layout
export const rooms: Room[] = [
    {
        'origin': [0, 0, 5],
        'size': [7, 9, 3],
        'wallModel': 2,
        'doors': [
            {
                'x': 7,
                'z': 1,
                'rotation': 1,
            },
            {
                'x': 1,
                'z': 9,
                'rotation': 0,
            },
        ],
        'mouseHoles': [],
        'contents': [
            {
                'model': furniture[0],
                'pos': [5, 0.125, 0],
                'rot': 3,
            },
            {
                'model': furniture[0],
                'pos': [5, 1.125, 0],
                'rot': 1,
            },
            {
                'model': furniture[4],
                'pos': [2, 1.125, 0.125],
                'rot': 3,
            },
            {
                'model': furniture[4],
                'pos': [1, 1.125, 0.125],
                'rot': 3,
            },
            {
                'model': furniture[6],
                'pos': [1, 0.125, 0],
                'rot': 3,
            },
            {
                'model': furniture[13],
                'pos': [5, 0.125, 7],
                'rot': 3,
            },
            {
                'model': furniture[13],
                'pos': [4, 0.125, 7],
                'rot': 2,
            },
            {
                'model': furniture[13],
                'pos': [5, 0.125, 6],
                'rot': 0,
            },
            {
                'model': furniture[13],
                'pos': [4, 0.125, 6],
                'rot': 1,
            },
            {
                'model': furniture[11],
                'pos': [5, 0.125, 5],
                'rot': 3,
            },
        ],
    },
    {
        'origin': [7, 0, 5],
        'size': [5, 4, 3],
        'wallModel': 4,
        'doors': [
            {
                'x': 0,
                'z': 1,
                'rotation': 3,
            },
        ],
        'mouseHoles': [
            {
                'x': 3,
                'z': 4,
                'rotation': 1,
            },
        ],
        'contents': [
            {
                'model': furniture[0],
                'pos': [2, 0.125, 3],
                'rot': 1,
            },
            {
                'model': furniture[0],
                'pos': [2, 1.125, 3],
                'rot': 3,
            },
        ],
    },
    {
        'origin': [0, 0, 14],
        'size': [7, 4, 3],
        'wallModel': 2,
        'doors': [
            {
                'x': 1,
                'z': 0,
                'rotation': 2,
            },
            {
                'x': 7,
                'z': 1,
                'rotation': 1,
            },
        ],
        'mouseHoles': [
            {
                'x': 0,
                'z': 2,
                'rotation': 0,
            },
        ],
        'contents': [
            {
                'model': furniture[4],
                'pos': [3, 1.125, 2.875],
                'rot': 1,
            },
            {
                'model': furniture[4],
                'pos': [2, 1.125, 2.875],
                'rot': 1,
            },
            {
                'model': furniture[5],
                'pos': [3, 1.125, 0.25],
                'rot': 3,
            },
        ],
    },
    {
        'origin': [7, 0, 12],
        'size': [5, 5, 3],
        'wallModel': 4,
        'doors': [
            {
                'x': 0,
                'z': 3,
                'rotation': 3,
            },
            {
                'x': 3,
                'z': 0,
                'rotation': 2,
            },
        ],
        'mouseHoles': [
            {
                'x': 2,
                'z': 5,
                'rotation': 1,
            },
            {
                'x': 1,
                'z': 0,
                'rotation': 3,
            },
        ],
        'contents': [
            {
                'model': furniture[14],
                'pos': [3.75, 0.125, 2],
                'rot': 2,
            },
            {
                'model': furniture[6],
                'pos': [3.75, 0.125, 3],
                'rot': 2,
            },
            {
                'model': furniture[1],
                'pos': [3.75, 0.625, 3],
                'rot': 2,
            },
        ],
    },
    {
        'origin': [7, 0, 9],
        'size': [8, 3, 3],
        'wallModel': 2,
        'doors': [
            {
                'x': 3,
                'z': 3,
                'rotation': 0,
            },
            {
                'x': 6,
                'z': 0,
                'rotation': 2,
            },
            {
                'x': 6,
                'z': 3,
                'rotation': 0,
            },
        ],
        'mouseHoles': [
            {
                'x': 2,
                'z': 0,
                'rotation': 3,
            },
            {
                'x': 8,
                'z': 1,
                'rotation': 2,
            },
        ],
        'contents': [
            {
                'model': furniture[12],
                'pos': [0.25, 0.125, 1],
                'rot': 0,
            },
            {
                'model': furniture[12],
                'pos': [0.25, 1.125, 1],
                'rot': 0,
            },
            {
                'model': furniture[5],
                'pos': [3, 1.125, 0.25],
                'rot': 3,
            },
        ],
    },
    {
        'origin': [12, 0, 12],
        'size': [6, 6, 3],
        'wallModel': 2,
        'doors': [
            {
                'x': 1,
                'z': 0,
                'rotation': 2,
            },
            {
                'x': 6,
                'z': 1,
                'rotation': 1,
            },
        ],
        'mouseHoles': [
            {
                'x': 1,
                'z': 6,
                'rotation': 1,
            },
            {
                'x': 4,
                'z': 0,
                'rotation': 3,
            },
        ],
        'contents': [
            {
                'model': furniture[7],
                'pos': [3, 0.125, 4.75],
                'rot': 1,
            },
            {
                'model': furniture[7],
                'pos': [4, 0.125, 4.75],
                'rot': 1,
            },
            {
                'model': furniture[7],
                'pos': [3, 0.125, 3.75],
                'rot': 3,
            },
            {
                'model': furniture[7],
                'pos': [4, 0.125, 3.75],
                'rot': 3,
            },
            {
                'model': furniture[6],
                'pos': [2, 0.125, 4.75],
                'rot': 0,
            },
            {
                'model': furniture[0],
                'pos': [3, 0.125, 0],
                'rot': 3,
            },
            {
                'model': furniture[0],
                'pos': [3, 1.125, 0],
                'rot': 1,
            },
        ],
    },
    {
        'origin': [12, 0, 5],
        'size': [6, 4, 3],
        'wallModel': 2,
        'doors': [
            {
                'x': 1,
                'z': 4,
                'rotation': 0,
            },
            {
                'x': 2,
                'z': 0,
                'rotation': 2,
            },
            {
                'x': 6,
                'z': 1,
                'rotation': 1,
            },
        ],
        'mouseHoles': [
            {
                'x': 0,
                'z': 2,
                'rotation': 0,
            },
        ],
        'contents': [
            {
                'model': furniture[11],
                'pos': [4.5, 0.125, 2.5],
                'rot': 2,
            },
            {
                'model': furniture[12],
                'pos': [0.25, 0.125, 1],
                'rot': 0,
            },
            {
                'model': furniture[12],
                'pos': [0.25, 1.125, 1],
                'rot': 0,
            },
        ],
    },
    {
        'origin': [12, 0, 0],
        'size': [5, 5, 3],
        'wallModel': 4,
        'doors': [
            {
                'x': 2,
                'z': 5,
                'rotation': 0,
            },
        ],
        'mouseHoles': [
            {
                'x': 0,
                'z': 2,
                'rotation': 0,
            },
            {
                'x': 0,
                'z': 3,
                'rotation': 0,
            },
            {
                'x': 5,
                'z': 1,
                'rotation': 2,
            },
        ],
        'contents': [],
    },
    {
        'origin': [18, 0, 4],
        'size': [5, 5, 3],
        'wallModel': 0,
        'doors': [
            {
                'x': 0,
                'z': 2,
                'rotation': 3,
            },
            {
                'x': 3,
                'z': 5,
                'rotation': 0,
            },
        ],
        'mouseHoles': [
            {
                'x': 5,
                'z': 3,
                'rotation': 2,
            },
            {
                'x': 1,
                'z': 5,
                'rotation': 1,
            },
        ],
        'contents': [
            {
                'model': furniture[10],
                'pos': [0.25, 0.125, 0.25],
                'rot': 3,
            },
            {
                'model': furniture[10],
                'pos': [0.25, 1.125, 0.25],
                'rot': 3,
            },
            {
                'model': furniture[9],
                'pos': [1.25, 0.125, 0.25],
                'rot': 3,
            },
            {
                'model': furniture[9],
                'pos': [2.25, 0.125, 0.25],
                'rot': 3,
            },
            {
                'model': furniture[9],
                'pos': [3.25, 0.125, 0.25],
                'rot': 3,
            },
            {
                'model': furniture[8],
                'pos': [3.25, 1.5, 0.25],
                'rot': 3,
            },
        ],
    },
    {
        'origin': [18, 0, 9],
        'size': [5, 3, 3],
        'wallModel': 4,
        'doors': [
            {
                'x': 3,
                'z': 0,
                'rotation': 2,
            },
        ],
        'mouseHoles': [
            {
                'x': 2,
                'z': 3,
                'rotation': 1,
            },
            {
                'x': 0,
                'z': 1,
                'rotation': 0,
            },
        ],
        'contents': [],
    },
    {
        'origin': [18, 0, 12],
        'size': [5, 4, 3],
        'wallModel': 0,
        'doors': [
            {
                'x': 0,
                'z': 1,
                'rotation': 3,
            },
        ],
        'mouseHoles': [
            {
                'x': 2,
                'z': 4,
                'rotation': 1,
            },
            {
                'x': 2,
                'z': 0,
                'rotation': 3,
            },
        ],
        'contents': [
            {
                'model': furniture[3],
                'pos': [3.5, 0.125, 2],
                'rot': 1,
            },
            {
                'model': furniture[3],
                'pos': [3.5, 0.125, 1],
                'rot': 3,
            },
            {
                'model': furniture[2],
                'pos': [0.25, 0.125, 2.5],
                'rot': 0,
            },
        ],
    },
];
/**
// ALTERNATIVE IMPLEMENTATION USING TUPLES AND TYPE DEFINITIONS
// to posibly reduce file size after minification

// Define a tuple type for the room structure
type RoomTuple = [
    origin: [number, number, number],
    size: [number, number, number],
    floorModel: typeof floor,
    ceilingModel: typeof ceiling,
    wallModel: typeof walls[number],
    doors: {x: number, z: number, rotation: Rotation}[],
    mouseHoles: {x: number, z: number, rotation: Rotation}[],
    contents: {model: any, pos: [number, number, number]}[]
];

// Example rooms array using tuples
export const rooms: RoomTuple[] = [
    [
        [0, 0, 0], // origin
        [9, 9, 3], // size
        floor, // floorModel
        ceiling, // ceilingModel
        walls[0], // wallModel
        [
            {x: 9, z: 4, rotation: Rotation.Clockwise90}, // door
            // {x: 4, z: 10, rotation: Rotation.Clockwise180}, // second room door
        ],
        [{x: 0, z: 4, rotation: Rotation.None}], // mouseHoles
        [
            {model: chair, pos: [2, 0.125, 4]}, // contents
        ],
    ],
    [
        [9, 0, 0], // origin
        [9, 9, 3], // size
        floor, // floorModel
        ceiling, // ceilingModel
        walls[2], // wallModel
        [
            {x: 0, z: 4, rotation: Rotation.Clockwise270}, // door
        ],
        [], // mouseHoles
        [
            {model: bomb, pos: [4, 0.125, 4]}, // contents
        ],
    ],
];


 */
