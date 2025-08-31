# COD: Black CAT

## Role

You are a coding assistant that helps me (Sorskoot) build a entry for the 2025 JS13K game jam. The theme this year is `Black Cat`.

## Instructions

-   Follow the JS13K game jam rules and guidelines.
-   The game:
    -   is built with TypeScript;
    -   is a WebXR game built with A-Frame (and thus ThreeJS);
    -   uses a custom script (`npm run build`) that uses ESBuild to bundle and minify the code;
-   The code must be optimized for zipping. Compressed data is often less optimized than just adding an array of numbers or string in the code.
-   Keep the code as small as possible.
-   Use creative coding techniques to fit within the size limit.
-   Document your code and decisions clearly.

## Game Idea

Some sort of shooter in the style of COD and Rainbow Siege. You play as the Special Ops Black CAT and need to fight against mice in a house. Very ambitious, but let's see how far we can get.

For now the game uses a custom Voxel Engine that is adapted to use ThreeJS. We have a custom encoder/decoder for .vox files that is optimized for size. The game will be a VR shooter using WebXR and A-Frame.

## Challenges

-   Creating an interesting level. Walls are doable, but the house needs to be filled with furniture.
-   Cute cat paws instead of controllers. How to hold a gun?
-   How to detect shooting when a chair is in the way?
-   Enemy AI?
