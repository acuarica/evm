import { hex2a } from '../hex';
import stringify from '../utils/stringify';

export class Return {
    readonly name = 'RETURN';
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
        if (this.memoryStart && this.memoryLength) {
            return (
                'return memory[' +
                stringify(this.memoryStart) +
                ':(' +
                stringify(this.memoryStart) +
                '+' +
                stringify(this.memoryLength) +
                ')];'
            );
        } else if (this.items.length === 0) {
            return 'return;';
        } else if (
            this.items.length === 1 &&
            (typeof this.items[0] === 'bigint' || this.items[0].static)
        ) {
            return 'return ' + this.items[0] + ';';
        } else if (
            this.items.length === 3 &&
            this.items.every((item: any) => typeof item === 'bigint') &&
            this.items[0] === 32n
        ) {
            return 'return "' + hex2a(this.items[2].toString(16)) + '";';
        } else {
            return 'return(' + this.items.map((item: any) => stringify(item)).join(', ') + ');';
        }
    }
}
