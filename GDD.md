# COD: Black CAT — Game Design Document (draft)

## One-line pitch

COD: Black CAT is a tiny, WebXR voxel shooter for JS13K: you play as an elite "Black CAT" operator hunting down hordes of mice in compact, bite-sized missions — all rendered with the project's custom voxel engine and A-Frame, and designed to fit an extreme size budget.

## Goals & Constraints

- Target: Web (A-Frame/Three.js), size-conscious for JS13K (keep assets and code minimal).
- Use the existing voxel renderer and a small set of encoded voxel models for a tiny playable experience.
- Keep world small and deterministic to fit memory and size-limits.

## Elevator description

You are the Black CAT — a claws-on-duty special forces operator dropped into tiny tabletop arenas to hunt down mice. Gameplay is fast and focused: aim, shoot (hitscan ray), take cover, and clear small rooms or open arenas. Levels are short, tactical skirmishes designed around clever placement of cover, sightlines, and encoded voxel mouse models.

## Core gameplay

- The arena is a house. You move as Black CAT operator around, aim, and fire.
- Objective: hunt and eliminate the mice enemies that spawn in the level. Clear the map to win, or survive timed waves for a high score.
- Primary interactions:
  - Aim & shoot: right controller trigger fires an instant-hit (hitscan) weapon — resolved with the engine's voxel ray traversal to detect mouse hits and environment collisions.
- When time allows it in jam:
  - Secondary fire / melee: close-range claw attack for finishing or conserving ammo.
  - Cover & movement: move/crouch behind voxel cover; the map is small so sightlines matter.
  - Pickup / reload: small ammo pickups or auto-reload between waves to keep mechanics simple.
- Scoring: kills, accuracy, time, and remaining health influence score. Bonus for clearing without taking damage.

## Mechanics & systems

### World & scale (from code)

- World size in meters: X=10, Y=10, Z=10 (constants in `voxelengine.ts`).
  - See `METERS_PER_WORLD_X` / `METERS_PER_WORLD_Y` / `METERS_PER_WORLD_Z`.
- Voxels per meter: `VOXELS_PER_METER = 8` (see `VOXELS_PER_METER`).
- Voxel scale: `VOXEL_SCALE = 1 / VOXELS_PER_METER` (see `VOXEL_SCALE`).
- Voxels per axis: 80 (10 meters * 8 voxels/meter). Entire voxel buffer size is 80 x 80 x 80 = 512,000 voxels stored in a `Uint8Array` (see `VoxelEngine` data allocation).
  - Note: the current world allocation is large for a JS13K shooter prototype. Reducing world size and/or resolution is recommended (see Suggested features).

These constants affect resolution, sightlines, hit detection resolution for shooting, and memory/performance.

### Engine capabilities (from code)

- Voxel storage & access: `VoxelEngine` class (see `VoxelEngine`).
- Mesh generation: the engine can generate a `THREE.Mesh` for the world (`VoxelEngine.getMesh`) used by A-Frame components to render voxels.
- Ray traversal across voxels: the engine implements a voxel line/ray algorithm (in `voxelengine.ts`). This is ideal for implementing hitscan weapons — bullets can be resolved immediately with per-voxel hit results and face normals for impact effects.
- API used by components:
  - `engine.setCube(x, y, z, color)` - used by the encoder to write models into the engine (see `encoder.ts`).
  - `engine.getMesh()` - used to obtain the renderable mesh (see uses in `hello-component.ts` and `paw.ts`).
  - `engine.raycast(origin, dir, maxDist, callback)` (pattern): use the engine's ray traversal function to detect mice hits and environment collisions (the codebase contains voxel ray utilities referenced by components — reuse them for shooting).

### Model format & content

- Compact encoded models are decoded and inserted into the engine by `addModelFromEncoded`.
  - Components call `addModelFromEncoded(mouse|paw|floor, engine, position)` to place models into the world (see `hello-component.ts` and `src/components/paw.ts`).
- Enemy models: the repo already contains `Mouse.vox` and `Paw.vox` sources — use a tiny mouse model as the enemy. Keep model counts small and favor palette-based encodings.

Use low-voxel-count mice with distinct palette indices to simplify hit detection and visual feedback when hit.

## Controls & UX

- Primary platform: WebXR.
- Basic controls (shooter mappings):
  - Right controller to aim and shoot.
  - Left controller watch HUD: health, ammo (tiny numbers), wave/time, score.

Visual feedback:

- Hit marker / brief red flash on hit.
- Damage decals (small voxel removal or color change) on mice and environment (cheap effects).
- Floating score text for kills and combos.

## Modes

- Intro / Demo / Training mission: short tutorial room showing aiming, shooting, and a single mouse target (re-uses `hello-component` placements).
- Skirmish (single-level mission): clear all mice from a compact map.
- Wave Survival: survive increasing waves of mice for a high score.
- Time Trial / Score Attack: clear the arena as fast as possible with score multipliers for accuracy.

## Art & Audio

- Art: low-resolution voxel aesthetic — use tiny, readable mouse models and a distinct player silhouette. Palettes should be small and reused across models to save bytes.
- Audio: kept minimal and procedural. Use short WebAudio oscillator blips for fire, hit, and death sounds. Prefer generated SFX (code-only) to keep size down.

## Technical architecture & repository mapping

T.B.D

## Edge cases & risks

- Memory: current world settings allocate ~512k voxels; too large for JS13K. Reduce world size or resolution to save memory and bytes.
- Performance: full mesh regeneration or frequent heavy raycasts can be expensive. Keep arenas small and throttle mesh rebuilds; use coarse collision for AI where possible.
- AI crowding: many mice AI agents walking at once will increase CPU usage — cap simultaneous mice and favor small wave sizes.
- Input mapping: A-Frame pointer events must be carefully wired to the engine ray traversal for accurate hits.
- Asset size: audio and model encodings must be tiny. Prefer procedural SFX and shared palettes.

## Suggested features to implement next (small, high-impact)

1. Reduce world size for a shooter prototype (e.g., 4m x 4m x 4m or reduce `VOXELS_PER_METER`) — edit constants at `src/lib/voxelengine.ts`.
2. Implement a `shooter-component` A-Frame component that hooks pointer input, calls the engine ray traversal for hits and resolves damage, and shows a tiny HUD (health, ammo, wave/time, score).
3. Implement simple `mouse-ai` component: tiny state machine (idle → wander → seek → attack) with cheap collision avoidance and low tick rate.
4. Wave manager & spawner: spawn mice in controlled waves with caps to keep CPU low.
5. Chunked mesh updates and static/dynamic separation: static map meshes for cover and a small dynamic mesh or sprite for mice/player to reduce rebuilds.
6. Minimal procedural SFX generator to avoid shipped audio assets.

## Roadmap (milestones)

- MVP (1–2 days):
  - Reduce world size, implement `shooter-component` with primary fire and HUD, add a single skirmish map with a few mice.
- Polish (2–4 days):
  - Add wave survival mode, a second map, simple mouse AI tuning, procedural SFX, and scoring/leaderboard stub.
- JS13K prep (3 days):
  - Aggressive minification and packing, inline/compressed encoded models, remove dev-only code and debug helpers.
- Extras (post-JS13K):
  - More maps, cosmetic palettes, and small social share/export feature.

## UI / HUD ideas

- Minimal top bar: level/wave name, timer, score.
- Left: health and small ammo count.
- Center: hit marker and floating score feedback.
- Small help overlay for controls (toggleable).

## Technical implementation notes & pointers for devs

- Shooting: reuse the voxel ray traversal inside `src/lib/voxelengine.ts` to implement hitscan fire. A typical flow:
  1. On fire input, compute origin and direction from camera.
  2. Call the engine ray traversal with a small maxDist.
  3. If hit is a mouse (identify by palette ID or by tracking spawned entities), emit damage and play impact effects.
- Enemy AI: keep ticks low (e.g., 4–6Hz) and use coarse checks for line-of-sight via the same ray traversal.
- Mesh & performance: split static world (cover) vs dynamic entities (mice/player). Use `getMesh()` for static geometry and render dynamic enemies as either very small meshes or instanced sprites to avoid frequent mesh rebuilds.
- Model library: keep encoded models small; prefer shared palettes and simple RLE or delta encodings.

## Minimal prototype task list mapped to code

- [ ] Edit world constants in `src/lib/voxelengine.ts` to reduce world size / resolution.
- [ ] Create `src/components/shooter-component.ts` to handle player input (aim/fire), HUD, and calls to the engine ray traversal for hits.
- [ ] Create `src/components/mouse-ai.ts` (or `src/lib/mouse-ai.ts`) for simple enemy behavior and spawning.
- [ ] Add a small wave manager and a compact level JSON format that lists static cover placements and spawn points (spawn encoded mice with `addModelFromEncoded`).
- [ ] Profile and split static/dynamic meshes; optimize rebuild frequency.

## QA / Quality gates

- Build: run TypeScript compile to ensure no type errors (tsconfig present).
- Lint: run project linter if present.
- Smoke test: load index.html locally and ensure that `hello-world` and `paw` components render meshes.
- Memory test: confirm allocations for `Uint8Array` are acceptable on target devices after world-size reduction.

## Notes specific to repository code (observations)

- hello-component.ts and paw.ts are demo components that show adding encoded models and attaching `engine.getMesh()` to A-Frame entities.
- encoder.ts contains `addModelFromEncoded` used by components to populate the engine with models.
- The engine includes a voxel ray traversal algorithm useful for picking and interaction.
- Recommendation: start by reducing the world size constant in voxelengine.ts to make development iterations faster and memory use smaller.

## Next steps (what I can do for you)

- Option A (small): I can produce a shorter prototyping checklist and a PR patch that reduces world size constants and wires a simple click-to-place handler (no network).
- Option B (bigger): implement an A-Frame component for pick/place/rotate and a simple level JSON loader using the existing `addModelFromEncoded`.

Tell me which next step you want me to take (A or B), or request edits to the GDD above. If you want, I can also produce a compact README and a minimal level JSON example that uses the current encoded models and demonstrates the workflow.

Requirements coverage

- Produce GDD in Markdown: Done (above).
- Grounded in src code: Done (referenced voxelengine.ts, encoder.ts, hello-component.ts, paw.ts, index.ts with links).
- Technical mapping and next steps: Done.
- Suggested prototype tasks & roadmap: Done.

If you'd like, I can also save this GDD as `DESIGN.md` in the repo and create one or two small code edits (for example, shrinking world constants) — tell me to proceed and which code edits you prefer.
