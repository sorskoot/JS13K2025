const paletteRGB = [
    0x0, 0xffd9d3d9, 0xffb8b0b9, 0xff9a919b, 0xff6d606d, 0xff000000, 0xff2a202a, 0xffc28683, 0xffa7776b, 0xff865d56,
    0xff694744, 0xff3e2730, 0xff8a2e3f, 0xffa83f48, 0xffc55650, 0xffd37755, 0xffdc995d, 0xffdec575, 0xffa8b164,
    0xff6f975e, 0xff3b6b58, 0xff2d494b, 0xff466f77, 0xff6c9ba7, 0xff9db8c5, 0xff7e8aa7, 0xff524f73, 0xff483355,
    0xff613661, 0xff823e69, 0xffb6607c, 0xffd3a092, 0xffd6b7b1, 0xff5f80a6, 0xff566794, 0xff74628f, 0xff6c437a,
    0xff54373a, 0xff612b38, 0xff36373d, 0xff432d42,
];

/**
 * Returns a color for the given tile type.
 * @param {number} tile The tyle type.
 * @return {number} The tile color.
 */
export function getTileColor(tile: number) {
    return paletteRGB[tile] || 0xffffffff;
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
