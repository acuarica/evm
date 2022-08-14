/// <reference types="node" />
import { EVM } from '../../src/classes/evm.class';
export default class extends EVM {
    constructor(code: string | Buffer);
}
