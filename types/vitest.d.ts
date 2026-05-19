import 'vitest';

module 'vitest' {
    // See https://vitest.dev/guide/snapshot.html#custom-snapshot-matchers for reference.
    //
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Assertion<T = any> {
        /**
         * 
         * @param ext 
         * @param path 
         * @returns 
         */
        matchSnapshotmd: (ext: unknown, path?: string) => T,

        /**
         * 
         * @param filename 
         * @returns 
         */
        matchFile: (filename: string) => T,
    }
}