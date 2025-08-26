// Re-use the module type definitions of 'three' but expose them as a global.
// This lets you write `new THREE.Vector3()` with full IntelliSense
// without triggering auto-imports.

declare global {
    // If the installed 'three' types are ESM, this still works.
    const THREE: typeof import('three');
}

export {};
