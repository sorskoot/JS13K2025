import fs from 'fs';
import path from 'path';

/**
 * componentCheckerPlugin
 *
 * - Reads `src/components` for files with .ts/.js/.tsx/.jsx
 * - Reads `src/index.ts` and extracts imports that reference `./components/...`
 * - If a component file (by basename) exists in `src/components` but is not imported
 *   it throws an Error to fail the build.
 *
 * Notes / limitations:
 * - Only checks direct imports from `src/index.ts` that match `./components/<name>` or
 *   `./components/<name>.js` / `.ts`.
 * - Does not recurse into subfolders in `src/components`. (Easy to extend if you want recursion.)
 * - Does not detect indirect imports (e.g., components imported by other files) — only direct imports in index.ts.
 */
export const componentCheckerPlugin = {
    name: 'component-checker',
    setup(build) {
        build.onStart(async () => {
            const cwd = process.cwd();
            const componentsDir = path.resolve(cwd, 'src', 'components');
            const indexPath = path.resolve(cwd, 'src', 'index.ts');

            // Try to read components dir; if it doesn't exist, skip (no components to check).
            let compFiles;
            try {
                const dirEntries = await fs.promises.readdir(componentsDir, { withFileTypes: true });
                // Only files (no directories), keep common JS/TS extensions
                compFiles = dirEntries
                    .filter(e => e.isFile())
                    .map(e => e.name)
                    .filter(n => /\.(ts|js|tsx|jsx)$/.test(n));
            } catch (err) {
                // If directory missing, nothing to check.
                if (err.code === 'ENOENT') {
                    return;
                }
                // Unexpected error -> surface it
                throw err;
            }

            // Build set of component basenames (without extension)
            const componentNames = compFiles.map(f => f.replace(/\.(ts|js|tsx|jsx)$/, ''));

            // Read index.ts content
            let indexContent;
            try {
                indexContent = await fs.promises.readFile(indexPath, 'utf8');
            } catch (err) {
                // If index.ts doesn't exist, fail early
                throw new Error(`component-checker: Unable to read ${indexPath}: ${err.message}`);
            }

            // Match imports like:
            // import './components/world.js';
            // import './components/world';
            // import foo from './components/world.js';
            // import { bar } from "./components/world";
            const importRegex = /import\s+(?:[\s\S]+?\s+from\s+)?['"]\.\/components\/([^'"]+)['"]/g;
            const imported = new Set();
            let m;
            while ((m = importRegex.exec(indexContent)) !== null) {
                // normalize: strip trailing extension if present
                const name = m[1].replace(/\.(js|ts|tsx|jsx)$/, '');
                imported.add(name);
            }

            // Determine components that are missing imports
            const missing = componentNames.filter(name => !imported.has(name));

            if (missing.length > 0) {
                const msgLines = [
                    `component-checker: Found ${missing.length} file(s) in src/components not directly imported in src/index.ts:`,
                    ...missing.map(n => `  - ${n}`),
                    '',
                    'Either import them in `src/index.ts` or update/ignore these files.'
                ];
                const msg = msgLines.join('\n');
                // Log for readability then throw to fail build
                // console.error(msg);
                throw new Error(msg);
            }

            // All good
            return;
        });
    },
};
