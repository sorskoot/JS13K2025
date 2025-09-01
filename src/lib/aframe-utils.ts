// Infer the default value types:
export type DataOf<S> = {
    [K in keyof S]: S[K] extends {default: infer D} ? D : unknown;
};
