#!/usr/bin/env -S NODE_DISABLE_COLORS=1 node
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const { Contract } = require('sevm');

// 00 opcode is STOP https://www.evm.codes/#00?fork=shanghai
const contract = new Contract('0x00');
console.log(contract.solidify());
