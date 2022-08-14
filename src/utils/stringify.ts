export default (item: any) => {
    if (typeof item === 'bigint') {
        return item.toString(16);
    } else if (!item.wrapped) {
        return item.toString();
    } else {
        return '(' + item.toString() + ')';
    }
};
