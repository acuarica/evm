export default (value: bigint | { wrapped: boolean }): string => {
    return typeof value === 'bigint'
        ? value.toString(16)
        : !value.wrapped
        ? value.toString()
        : `(${value.toString()})`;
};
