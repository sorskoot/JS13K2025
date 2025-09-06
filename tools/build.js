// build.js
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import { webglPlugin } from 'esbuild-plugin-webgl';
import copyStaticFiles from 'esbuild-copy-static-files';
import { componentCheckerPlugin } from './plugins/esbuild-component-check.js';

async function serve() {
    let ctx = await esbuild.context({
        entryPoints: ['./src/index.ts'],
        bundle: true,
        external: ['aframe', 'three'], // Mark A-Frame and Three.js as external
        platform: 'browser',
        minify: false,
        define: { DEBUG: "true" },
        sourcemap: true,
        target: 'ES2022',
        format: 'esm',
        outfile: './dist/index.js',
        plugins: [
            componentCheckerPlugin,
            webglPlugin(),
            copyStaticFiles({
                src: './static', // Source directory
                dest: './dist', // Destination directory
            })
        ],

        loader: {
            '.vs': 'text',
            '.fs': 'text',
            '.frag': 'text',
            '.vert': 'text',
            '.glsl': 'text',
        },
        logLevel: 'info'
    });
    // fs.watch("./static/index.html", {}, () => {
    //     console.log("Static files changed, rebuilding...");
    //     ctx.rebuild();
    // });
    await ctx.watch();
    console.log('Watching for changes...');

    await ctx.serve({ port: 5641, servedir: './dist', host: 'localhost' });
    console.log('Server is running on http://localhost:5641');
}

serve();

