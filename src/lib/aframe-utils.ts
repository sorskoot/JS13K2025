// prettier-ignore

import { Entity } from "aframe";

// Recursively widen literal primitives and remove readonly from objects/arrays.
type Widen<T> =
    // widen primitive literals to their general primitive types
    T extends number
        ? number
        : T extends string
        ? string
        : T extends boolean
        ? boolean
        : // arrays: widen item type and produce mutable arrays
        T extends readonly (infer U)[]
        ? Widen<U>[]
        : // objects: remove readonly modifiers and widen properties
        T extends object
        ? {-readonly [K in keyof T]: Widen<T[K]>}
        : // fallback
          T;

// prettier-ignore
// Map A-Frame schema 'type' names to TypeScript types.
// Extend this union when you need more schema types.
type TypeFromSchemaType<T> =
    T extends 'number' ? number :
    T extends 'int' ? number :
    T extends 'float' ? number :
    T extends 'string' ? string :
    T extends 'boolean' ? boolean :
    // A-Frame 'selector' is typically used as a selector string initially
    // but at runtime the component may resolve it to an Element. Use a union
    // so both forms are accepted in TS: string when raw, Element|null when resolved.
    T extends 'selector' ? Entity :
    T extends 'selectorAll' ? Entity[] :
    // vec3, color, etc. — add shapes as you need them:
    T extends 'vec3' ? { x: number; y: number; z: number } :
    T extends 'color' ? string :
    // fallback for unknown/complex types
    unknown;

// prettier-ignore
// Infer the default value types, but prefer the declared `type` when present.
// - If entry has `type`, use the TypeFromSchemaType mapping.
// - Else if entry has a `default`, widen the default (so `5` -> `number`).
// - Otherwise `unknown`.
export type DataOf<S> = {
    [K in keyof S]:
        S[K] extends { type: infer T } ? TypeFromSchemaType<T & string> :
        S[K] extends { default: infer D } ? Widen<D> :
        unknown;
};
/* prettier-ignore-end */
