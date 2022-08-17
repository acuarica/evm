export class NUMBER {
    readonly name = 'NUMBER';
    readonly type?: string;
    readonly wrapped = false;

    toString() {
        return 'block.number';
    }
}
