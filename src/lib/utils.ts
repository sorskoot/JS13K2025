export function createColor(r: number, g: number, b: number) {
    return 0xff000000 + (r << 16) + (g << 8) + b;
}

/**
 * Returns a color for the given tile type.
 * @param {number} tile The tyle type.
 * @return {number} The tile color.
 */
export function getTileColor(tile) {
    switch (tile) {
        case 1:
            return createColor(255, 0, 0);
        case 2:
            return createColor(0, 255, 0);
        case 3:
            return createColor(0, 0, 255);
        default:
            return createColor(255, 255, 255);
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
