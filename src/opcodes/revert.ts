import stringify from '../utils/stringify';

export class Revert {
    readonly name = 'REVERT';
    readonly type?: string;
    readonly wrapped = true;
    readonly memoryStart?: any;
    readonly memoryLength?: any;
    readonly items: any;

    constructor(items: any, memoryStart?: any, memoryLength?: any) {
        if (memoryStart && memoryLength) {
            this.memoryStart = memoryStart;
            this.memoryLength = memoryLength;
        } else {
            this.items = items;
        }
    }

    toString() {
        if (this.items) {
            return 'revert(' + this.items.map((item: any) => stringify(item)).join(', ') + ');';
        } else {
            return (
                'revert(memory[' +
                stringify(this.memoryStart) +
                ':(' +
                stringify(this.memoryStart) +
                '+' +
                stringify(this.memoryLength) +
                ')]);'
            );
        }
    }
}
