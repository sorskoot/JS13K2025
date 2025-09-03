## COD: Black CAT — AI Coding Instructions

Purpose: Help build a JS13K 2025 WebXR voxel shooter (theme: "Black Cat") efficiently under the 13 KB zipped limit.

### Role

Act as a pragmatic game jam teammate for Sorskoot: write tiny, clear TypeScript, keep bundle+zip size low, prefer code over assets, and avoid over‑engineering.

### Tech & Build Workflow

-   Stack: TypeScript + A-Frame (Three.js) + custom minimal voxel engine.
-   Dev build: `npm run build` (esbuild watch + live reload via EventSource in `src/index.ts`).
-   Production / size check: `npm run build:prod` → outputs `dist/index.js` and `dist/BlackCat.zip` with size progress bar (advzip optional).
-   Static files copied from `static/` (keep `index.html` minimal; CDN A-Frame already used for size).
-   Externalized libs: A-Frame & Three are marked external in build scripts; only game code counts toward zip.

### Key Source Layout

-   `src/index.ts` – entry; only import components. Keep top-level side effects minimal.
-   `src/components/*.ts` – A-Frame components (patterns: see `hello-component.ts`, `paw.ts`). Prefer one responsibility each.
-   `src/lib/voxelengine.ts` – core voxel world (builds simple mesh from placed voxels).
-   `src/lib/encoder.ts` – compact column-dictionary model decoder (`addModelFromEncoded`). Keep ultra small.
-   `src/lib/bufferset.ts` – internal helper building geometry (normally no direct edits needed).
-   `tools/parse-vox.ts` – offline conversion of .vox → encoded strings (do not ship runtime parsing logic to dist).

### Voxel Engine Essentials

-   Current world constants are intentionally generous—shrink (`METERS_PER_WORLD_*` or `VOXELS_PER_METER`) early if scope grows.
-   Typical flow: place many voxels via `setCube` (indirectly through `addModelFromEncoded`), then call `getMesh()` once.
-   Use `raycast` for hitscan instead of adding a separate Three.js raycaster.

### Encoded Model Format (encoder.ts)

`dictCSV | indexChars | paletteCSV`

-   `dictCSV`: comma-separated column strings (each string = vertical stack, hex nibble per voxel, 0 = empty).
-   `indexChars`: size×size chars, each selects a dict entry via ALPHABET (64 chars).
-   `paletteCSV`: optional remap of local (1..15) → engine color indices (see `utils.getTileColor`).
    Add models via `addModelFromEncoded(str, engine, new THREE.Vector3(x,y,z))` in batch before `getMesh()`.

### Conventions & Patterns

-   Keep globals out of components; create local `VoxelEngine` per logical mesh (static world vs small entity sets).
-   Prefer data arrays / encoded strings over JSON objects (cheaper after min+zip).
-   Use leading `_` on properties safe to mangle (terser mangle regex `/^_/`).
-   Avoid runtime feature flags—only `DEBUG` constant (set in build scripts) allowed.
-   Reuse palette indices (0–15) aggressively; new colors cost bytes in logic & docs.

### Size Optimization Rules

-   Batch model placement then build once. Avoid per-frame mesh regeneration.
-   Eliminate console logs (prod build drops them; still remove to reduce source size pre-terser).
-   Inline tiny helpers instead of exporting if used once.
-   Favor arithmetic / bit ops over object wrappers for hot loops.

### Safe Extension Tasks (good first contributions)

1. Reduce world dimensions (e.g., 6m cube or 4 vox/m) & update existing placements.
2. Add `shooter-component` using `raycast` for trigger hits.
3. Introduce `mouse-ai` with low tick rate (e.g., setInterval 150–250ms) manipulating simple state.
4. Split static map vs dynamic actors: one mesh for map; lightweight meshes or instanced quads for enemies.

### Pitfalls / Gotchas

-   World size constants affect memory & build time; adjust early rather than pruning later.
-   Each unique column pattern in encoder expands its dictionary; reuse patterns deliberately.
-   `getTileColor` high byte is ignored; treat colors as opaque.
-   Components must register before scene loads; keep initial imports shallow.

#### A-Frame Component Pattern (Typed, Zero Runtime Overhead)

Use a tiny, size-safe pattern for every component to get IntelliSense without adding bytes:

```ts
import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js'; // purely type-level helper; ensure it erases at build

const schema = {
    // myProp: { type: 'number', default: 0 },
} as const;

type MyComponentData = DataOf<typeof schema>;

AFRAME.registerComponent('my-component', {
    schema,
    init: function (this: Component<MyComponentData>) {
        // Access typed data via this.data.myProp
    },
    update: function (this: Component<MyComponentData>, oldData: MyComponentData) {
        // Compare oldData.myProp vs this.data.myProp
    },
    // Add other lifecycle methods with the same typed `this` signature when needed
});
```

Key rules:

1. Always declare `const schema = { ... } as const;` then derive `type XData = DataOf<typeof schema>` so property names live in one place.
2. Type each lifecycle function’s first parameter as `this: Component<XData>` — gives autocompletion for `data`, `el`, etc.
3. Use `import type` to ensure no runtime footprint from TypeScript-only symbols.
4. Prefer `oldData: XData` (not `Partial<>`) in `update` unless you rely on partial diff logic; A-Frame passes a full previous snapshot including defaults.
5. For single-property updates from code, call `el.setAttribute('component-name', 'propName', value)` (NOT just `'propName'`). For multiple, pass an object: `el.setAttribute('component-name', { propName: value });`.

Optional (advanced typing for `setAttribute` / `getAttribute`):
If needed later, we can introduce a global `interface AFrameComponentDataMap { 'my-component': MyComponentData; }` merged via declaration merging, then augment `Entity.setAttribute` overloads for name + prop safety. Skip for now unless it materially improves productivity—every extra declaration line counts toward raw (pre-zip) size.

Snippet Reference (VS Code):
We maintain a snippet `af:comp` that auto-fills this structure using the filename for both the component name (`${TM_FILENAME_BASE}`) and PascalCase `Data` type (`${TM_FILENAME_BASE/(.*)/${1:/capitalize}/}Data`). Use method snippets (`af:m:init`, `af:m:update`, etc.) to add lifecycle methods with the correct typed `this` signature.

Micro-optimizations:

-   Inline trivial logic inside lifecycle methods; avoid exporting helpers used only once.
-   Remove unused lifecycle hooks; each function name + braces costs bytes pre-minify.
-   Replace verbose prop names early; renaming later risks overlooked references.

Guideline for Adding New Props:

1. Add entry in `schema` with `type` + `default`.
2. Rely on `DataOf` inference—no manual edits to `XData` needed.
3. Use the prop via `this.data.prop`; mutate via `this.el.setAttribute('component', 'prop', newValue)` to trigger `update` (don’t assign `this.data.prop = ...` directly for reactive changes).

Keep components narrowly focused; prefer composing small components over large multi-purpose ones for clarity and easier byte trimming.

### When Adding Files

Add concise header comments only if non-obvious; otherwise rely on naming. After major changes, verify prod zip remains <13KB.

### Ask If Unsure

If a feature risks increased mesh rebuild frequency, palette expansion, or larger encoded strings, propose a smaller alternative first.
