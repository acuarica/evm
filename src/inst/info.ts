import { Operand } from '../evm';
import stringify from '../utils/stringify';

/**
 * https://www.evm.codes/#30
 */
export class Address {
    readonly name = 'ADDRESS';
    readonly type = 'address';
    readonly wrapped = false;

    toString = () => 'this';
}

/**
 * https://www.evm.codes/#31
 */
export class Balance {
    readonly name = 'BALANCE';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly address: Operand) {}

    toString = () => `${stringify(this.address)}.balance`;
}

/**
 * https://www.evm.codes/#35
 */
export class CallDataLoad {
    readonly name = 'CALLDATALOAD';
    readonly type?: string;
    readonly returntype?: string;
    readonly wrapped = false;

    constructor(readonly location: Operand) {}

    toString() {
        if (typeof this.location === 'bigint' && this.location === 0n) {
            return 'msg.data';
        } else if (typeof this.location === 'bigint' && (this.location - 4n) % 32n === 0n) {
            return '_arg' + ((this.location - 4n) / 32n).toString();
        } else {
            return 'msg.data[' + stringify(this.location) + ']';
        }
    }
}

export class CALLDATASIZE {
    readonly name = 'CALLDATASIZE';
    readonly type?: string;
    readonly wrapped = false;

    toString = () => 'msg.data.length';
}

export class CALLDATACOPY {
    readonly name = 'CALLDATACOPY';
    readonly type?: string;
    readonly wrapped: boolean = true;

    constructor(readonly startLocation: any, readonly copyLength: any) {}

    toString = () => `msg.data[${this.startLocation}:(${this.startLocation}+${this.copyLength})];`;
}

export class CallValue {
    readonly name = 'CALLDATASIZE';
    readonly type?: string;
    readonly wrapped = false;

    toString = () => 'msg.value';
}
