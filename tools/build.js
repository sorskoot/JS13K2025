// build.js
const esbuild = require('esbuild');
const { webglPlugin } = require('esbuild-plugin-webgl');
const copyStaticFiles = require('esbuild-copy-static-files');

async function serve() {
    let ctx = await esbuild.context({
        entryPoints: ['./src/index.ts'],
        bundle: true,
        external: ['aframe', 'three'], // Mark A-Frame and Three.js as external
        platform: 'browser',
        minify: false,
        sourcemap: true,
        target: 'ES2022',
        format: 'esm',
        outfile: './dist/index.js',
        plugins: [webglPlugin(),
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
    await ctx.watch();
    console.log('Watching for changes...');

    await ctx.serve({ port: 5641, servedir: './dist', host: 'localhost' });
    console.log('Server is running on http://localhost:5641');
}

serve();

