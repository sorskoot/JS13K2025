import fs from "fs";
import path from "path";
import { readFile } from "fs/promises";

// This array stores identifiers that are considered "defined".
// Values are populated from the provided env (defaults to process.env).
const IF_DEFS = [];

const ENDIF = "//#endif";
const IFDEF = "//#ifdef";
// Regexes used to detect and extract //#ifdef and //#endif lines.
// IFDEFregexMatch captures the identifier following //#ifdef (e.g. //#ifdef DEBUG -> "DEBUG")
const IFDEFregex = /^\s*\/\/\s*#ifdef/;
const IFDEFregexMatch = /^\s*\/\/\s*#ifdef\s*(.*)/;
const ENDIFregex = /^\s*\/\/\s*#endif/;

let filterList;
let baseDir;

function configureStringsToSearch(vars) {
    // Build IF_DEFS from the provided env-like object.
    // Supports keys like "process.env.MYFLAG" or "MYFLAG".
    for (let _key in vars) {
        // Normalize keys by stripping "process.env." prefix when present.
        const key = _key.replace("process.env.", "");

        let keytype = typeof vars[_key];
        let isDefined =
            (keytype === "boolean" && vars[_key]) || keytype !== "undefined";

        // Treat string "false" and "undefined" as not defined (common in some build setups).
        if (
            keytype === "string" &&
            isDefined &&
            (vars[_key] === "false" || vars[_key] === "undefined")
        ) {
            isDefined = false;
        }

        // Only push the normalized key if considered defined.
        if (isDefined) {
            IF_DEFS.push(key);
        }
    }
}

const MODE = {
    // Two-phase scanning: find opening //#ifdef, then find its matching //#endif.
    find_opening: 0,
    find_closing: 1,
};

const LINE_TYPE = {
    plain: 0,
    ifdef: 1,
    closing: 2,
};

let exclusions;

async function onLoadPlugin(args) {
    // args.path is the absolute file path esbuild wants to load.
    let dirPath = path.relative(baseDir, args.path);
    let hasMatch = false;

    // Only process files that are inside one of the top-level project directories
    // discovered when the plugin was initialized. This cheaply limits scanning.
    for (let filter of filterList) {
        if (dirPath.startsWith(filter)) {
            hasMatch = true;
            break;
        }
    }

    if (!hasMatch) {
        return null;
    }

    let text = await readFile(args.path, "utf8");

    // Fast-path: if file doesn't contain the marker string, skip parsing.
    if (text.includes(IFDEF)) {
        let lines = text.split("\n");
        let ifdefStart = -1,
            endifStart = -1,
            depth = 0;

        let count = 0;
        let line = "",
            expression = "";
        let step = MODE.find_opening;
        let shouldRemove = false;
        let lineType = LINE_TYPE.plain;

        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            line = lines[lineNumber];

            // Classify each line so we can react to //#ifdef and //#endif.
            if (IFDEFregex.test(line)) {
                lineType = LINE_TYPE.ifdef;
            } else if (ENDIFregex.test(line)) {
                lineType = LINE_TYPE.closing;
            } else {
                lineType = LINE_TYPE.plain;
            }

            // When we find an opening //#ifdef while looking for openings:
            if (lineType === LINE_TYPE.ifdef && step === MODE.find_opening) {
                depth = 0;
                ifdefStart = lineNumber;
                step = MODE.find_closing;
                match = line.match(IFDEFregexMatch);
                expression = match[1];
                // If the identifier is not in IF_DEFS, we will remove the whole block.
                shouldRemove = !IF_DEFS.includes(expression);
                if (shouldRemove && expression.startsWith("!")) {
                    // A leading "!" can invert the decision — keep this block even if ID not found.
                    shouldRemove = false;
                }
            } else if (lineType === LINE_TYPE.ifdef && step === MODE.find_closing) {
                // Nested //#ifdef encountered while searching for the matching //#endif:
                depth++;
            } else if (
                lineType === LINE_TYPE.closing &&
                step === MODE.find_closing &&
                depth > 0
            ) {
                // Closing a nested block reduces nesting depth.
                depth--;
            } else if (
                // Found the matching closing //#endif for the current opening.
                lineType === LINE_TYPE.closing &&
                step === MODE.find_closing &&
                depth === 0
            ) {
                if (shouldRemove) {
                    // Remove opening..closing inclusive (entire block).
                    lines = [
                        ...lines.slice(0, ifdefStart),
                        ...lines.slice(lineNumber + 1),
                    ];
                } else {
                    // Keep the inner content but strip the //#ifdef and //#endif lines.
                    lines = [
                        ...lines.slice(0, ifdefStart),
                        ...lines.slice(ifdefStart + 1, lineNumber),
                        ...lines.slice(lineNumber + 1),
                    ];
                }

                // Reset to search for the next //#ifdef from the start of the file.
                // Restarting from 0 simplifies handling of multiple and nested blocks.
                step = MODE.find_opening;
                ifdefStart = -1;
                shouldRemove = false;
                lineNumber = 0;
            }
        }

        text = lines.join("\n");

        return {
            contents: text,
            loader: path.extname(args.path).substring(1),
        };
    } else {
        return null;
    }
}

const DEFAULT_EXCLUDE_LIST = ["dist", "vendor", "node_modules", ".git"];

// This is the esbuild plugin factory function.
// It receives the environment, base directory, and exclude list.
// The exclude list defaults to common Vite exclude patterns.
export const ifdef = (
    env = process.env,
    _baseDir = process.cwd(),
    exclude = DEFAULT_EXCLUDE_LIST
) => {
    // Populate IF_DEFS from the provided env-like object.
    configureStringsToSearch(env);

    baseDir = _baseDir;
    filterList = fs.readdirSync(baseDir).filter((dir) => {
        // Skip files/directories with dots (e.g. package.json) and excluded folders.
        if (dir.includes(".")) {
            return false;
        }

        for (let excludeDir of exclude) {
            if (excludeDir.includes(dir)) {
                return false;
            }
        }

        return true;
    });

    // Build a regex that matches files under the discovered top-level directories
    // and only with .js, .ts, .tsx extensions. Paths are normalized to accept both
    // Windows and POSIX separators.
    const filter = {
        filter: new RegExp(
            `(${filterList
                .map((dir) => path.join(_baseDir, dir).replace(/\\/g, '[\\\\/]'))
                .join("|")}).*\\.(js|ts|tsx)$`
        ),
    };

    return {
        name: "#ifdef",
        setup(build) {
            // Register onLoad handler for matching files.
            build.onLoad(filter, onLoadPlugin);
        },
    };
};
