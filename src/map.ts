import {Rotation} from './lib/encoder.js';
import {bomb, ceiling, chair, floor, walls} from './models.js';
import {Room} from './types/world-types.js';

// Example rooms array that recreates your current layout
export const rooms: Room[] = [
    {
        'origin': [0, 0, 5],
        'size': [7, 9, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
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
        'mouseHoles': [
            // {'x': 7, 'z': 2, 'rotation': 2},
            // {'x': 0, 'z': 2, 'rotation': 0},
            // {'x': 2, 'z': 0, 'rotation': 3},
            {'x': 4, 'z': 9, 'rotation': 1},
        ],
        'contents': [{model: chair, pos: [2, 0.125, 4]}],
    },
    {
        'origin': [7, 0, 5],
        'size': [5, 4, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
        'doors': [
            {
                'x': 0,
                'z': 1,
                'rotation': 3,
            },
        ],
        'mouseHoles': [],
        'contents': [],
    },
    {
        'origin': [0, 0, 14],
        'size': [7, 4, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
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
        'mouseHoles': [],
        'contents': [],
    },
    {
        'origin': [7, 0, 12],
        'size': [5, 5, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
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
        'mouseHoles': [],
        'contents': [],
    },
    {
        'origin': [7, 0, 9],
        'size': [8, 3, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
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
        'mouseHoles': [],
        'contents': [],
    },
    {
        'origin': [12, 0, 12],
        'size': [6, 6, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
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
        'mouseHoles': [],
        'contents': [],
    },
    {
        'origin': [12, 0, 5],
        'size': [6, 4, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
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
        'mouseHoles': [],
        'contents': [],
    },
    {
        'origin': [12, 0, 0],
        'size': [5, 5, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
        'doors': [
            {
                'x': 2,
                'z': 5,
                'rotation': 0,
            },
        ],
        'mouseHoles': [],
        'contents': [],
    },
    {
        'origin': [18, 0, 4],
        'size': [5, 5, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
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
        'mouseHoles': [],
        'contents': [],
    },
    {
        'origin': [18, 0, 9],
        'size': [5, 3, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
        'doors': [
            {
                'x': 3,
                'z': 0,
                'rotation': 2,
            },
        ],
        'mouseHoles': [],
        'contents': [],
    },
    {
        'origin': [18, 0, 12],
        'size': [5, 3, 3],
        'floorModel': floor,
        'ceilingModel': ceiling,
        'wallModel': walls[0],
        'doors': [
            {
                'x': 0,
                'z': 1,
                'rotation': 3,
            },
        ],
        'mouseHoles': [],
        'contents': [],
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
