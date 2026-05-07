import 'vitest';

module 'vitest' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Assertion<T = any> {
        matchSnapshotmd: (ext: string, path?: string) => T,
    }
}