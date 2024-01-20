#!/usr/bin/env node
/* eslint-env node */

import { EVM, London } from 'sevm';

// contract Test {
//     event Deposit(uint256);
//     fallback () external payable {
//         emit Deposit(tx.gasprice);
//     }
// }
const bytecode = '608060408190524581527f4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e3842690602090a16040805145815290517f4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e384269181900360200190a1604080513a815290517f4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e384269181900360200190a100';

const evm = new EVM(bytecode, new class extends London {
    /** @override */
    GASPRICE = (/** @type {import('sevm').Operand} */ state) => {
        super.GASPRICE(state);
        console.log('top', state.stack.top);
    };
}());

evm.start();
