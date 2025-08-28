export function createColor(r: number, g: number, b: number) {
    return 0xff000000 + (r << 16) + (g << 8) + b;
}

/**
 * Returns a color for the given tile type.
 * @param {number} tile The tyle type.
 * @return {number} The tile color.
 */
export function getTileColor(tile: number) {
    switch (tile) {
        case 0:
            return createColor(0, 0, 0); // Black
        case 1:
            return createColor(0, 0, 170); // Blue
        case 2:
            return createColor(0, 170, 0); // Green
        case 3:
            return createColor(0, 170, 170); // Cyan
        case 4:
            return createColor(170, 0, 0); // Red
        case 5:
            return createColor(170, 0, 170); // Magenta
        case 6:
            return createColor(170, 85, 0); // Brown
        case 7:
            return createColor(170, 170, 170); // Light gray
        case 8:
            return createColor(85, 85, 85); // Dark gray
        case 9:
            return createColor(85, 85, 255); // Bright blue
        case 10:
            return createColor(85, 255, 85); // Bright green
        case 11:
            return createColor(85, 255, 255); // Bright cyan
        case 12:
            return createColor(255, 85, 85); // Bright red
        case 13:
            return createColor(255, 85, 255); // Bright magenta
        case 14:
            return createColor(255, 255, 85); // Yellow
        case 15:
            return createColor(255, 255, 255); // White
        default:
            return createColor(255, 255, 255); // Fallback to white
    }
}
/**
 * Returns the sign of the number
 * @param {number} value
 * @return {number}
 */
export function signum(value: number): number {
    return value > 0 ? 1 : value < 0 ? -1 : 0;
}

/**
 * Safe mod, works with negative numbers.
 * @param {number} value
 * @param {number} modulus
 * @return {number}
 */
export function mod(value: number, modulus: number): number {
    return ((value % modulus) + modulus) % modulus;
}

/**
 * Find the smallest positive t such that s+t*ds is an integer.
 * @param {number} s
 * @param {number} ds
 * @return {number}
 */
export function intbound(s: number, ds: number): number {
    if (ds < 0) {
        return intbound(-s, -ds);
    } else {
        s = mod(s, 1);
        // problem is now s+t*ds = 1
        return (1 - s) / ds;
    }
}
