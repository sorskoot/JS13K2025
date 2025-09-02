// build.js
import * as esbuild from 'esbuild';
import { webglPlugin } from 'esbuild-plugin-webgl';
import * as fs from 'fs';
import { minify } from 'terser';
import copyStaticFiles from 'esbuild-copy-static-files';
import { execFile } from 'child_process';
import path from 'path';

const define = {
    "process.env.DEBUG": "false",
    DEBUG: "false"
};

esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    minify: true,
    drop: ['console'],
    external: ['aframe', 'three'], // Mark A-Frame and Three.js as external
    target: 'ES2022',
    format: 'esm',
    outfile: './dist/bundle.js',

    define,
    plugins: [
        copyStaticFiles({
            src: './static', // Source directory
            dest: './dist', // Destination directory
        }),
        webglPlugin(),
    ],
    metafile: true,
    loader: {
        '.vs': 'text',
        '.fs': 'text',
        '.frag': 'text',
        '.vert': 'text',
        '.glsl': 'text',
    },
})
    .then(result => {
        fs.writeFileSync('meta.json', JSON.stringify(result.metafile));
        const code = fs.readFileSync('dist/bundle.js', 'utf8');

        // Minify with Terser and return the promise so we can chain the zip step
        return minify(code, {
            compress: {
                passes: 3,
                unsafe: true,
                toplevel: true,
                drop_console: true,
                pure_funcs: ["assert", "console.info", "console.debug"],
            },
            toplevel: true,
            mangle: {
                toplevel: true,
                properties: {
                    regex: /^_/
                }
            }
        }).then(async (minResult) => {
            // Write the minified code to the output file
            fs.writeFileSync('dist/index.js', minResult.code);

            // After minification, create a zip containing index.html and index.js
            const distDir = path.resolve('dist');
            const htmlPath = path.join(distDir, 'index.html');
            const jsPath = path.join(distDir, 'index.js');
            const outZip = path.join(distDir, 'BlackCat.zip');

            // Try to dynamically load advzip-bin; if not present, we'll skip running it
            let advzipPath = null;
            try {
                const mod = await import('advzip-bin');
                advzipPath = mod.default || mod;
            }
            catch (e) {
                // advzip not installed; we will continue without it
                advzipPath = null;
            }

            // Helper to run advzip on the created zip (best-effort) and return the final size in bytes
            function runAdvzip(zipPath) {
                return new Promise((resolve) => {
                    // Helper to stat the zip and return size (or 0 on failure)
                    function statSize() {
                        try {
                            const stats = fs.statSync(zipPath);
                            return stats.size;
                        }
                        catch (e) {
                            return 0;
                        }
                    }

                    if (!advzipPath) {
                        return resolve(statSize());
                    }

                    // advzip may fail on some systems; don't hard-fail the whole build for advzip errors
                    execFile(advzipPath, ['--recompress', '--shrink-extra', zipPath], (err) => {
                        if (err) {
                            console.warn('advzip failed (continuing):', err.message || err);
                        }
                        resolve(statSize());
                    });
                });
            }

            // Progress formatting and limit check
            const SIZE_LIMIT = 13 * 1024; // 13 KB = 13312 bytes
            function formatProgress(size, limit, width = 10) {
                const pct = limit > 0 ? (size / limit) * 100 : 0;
                const clamped = Math.max(0, Math.min(1, size / limit));
                const filled = Math.floor(clamped * width);
                const bar = '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
                return { bar, pct: pct.toFixed(1) };
            }

            function printAndCheck(size, zipPath) {
                const { bar, pct } = formatProgress(size, SIZE_LIMIT, 10);
                const remaining = SIZE_LIMIT - size;
                const remainingText = remaining >= 0 ? `+${remaining} bytes remaining` : `-${Math.abs(remaining)} bytes over`;
                const line = `${bar} ${pct}% of ${SIZE_LIMIT} bytes | ${remainingText}`;
                if (size > SIZE_LIMIT) {
                    console.error(line);
                    throw new Error(`Archive exceeds ${SIZE_LIMIT} bytes limit (${size} bytes)`);
                }
                else {
                    console.log(line);
                }
            }

            // Create ZIP (Windows: use PowerShell Compress-Archive; fallback: try zip command)
            return new Promise((resolve, reject) => {
                if (!fs.existsSync(htmlPath) || !fs.existsSync(jsPath)) {
                    return reject(new Error('dist/index.html or dist/index.js not found; cannot create zip'));
                }

                if (process.platform === 'win32') {
                    // Use PowerShell's Compress-Archive which is available on modern Windows
                    // Use double quotes around paths to handle spaces
                    const psCommand = `Compress-Archive -Path \"${htmlPath}\",\"${jsPath}\" -DestinationPath \"${outZip}\" -Force`;
                    execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', psCommand], async (err) => {
                        if (err) return reject(err);
                        try {
                            const finalSize = await runAdvzip(outZip);
                            printAndCheck(finalSize, outZip);
                            resolve();
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                }
                else {
                    // On non-Windows try to use the `zip` command if available
                    execFile('zip', ['-j', '-9', outZip, htmlPath, jsPath], async (err) => {
                        if (err) return reject(err);
                        try {
                            const finalSize = await runAdvzip(outZip);
                            printAndCheck(finalSize, outZip);
                            resolve();
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                }
            });
        });
    })
    .catch((e) => {
        console.log(e);
        process.exit(1);
    });

