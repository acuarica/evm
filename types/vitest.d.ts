import 'vitest';

module 'vitest' {
    // See https://vitest.dev/guide/snapshot.html#custom-snapshot-matchers for reference.
    //
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Assertion<T = any> {
        matchSnapshotmd: (ext: unknown, path?: string) => T,
    }
}