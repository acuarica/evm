#!/usr/bin/env -S NODE_DISABLE_COLORS=1 node
/* eslint-env node */

import { EtherscanProvider as Provider } from 'ethers';
import { Contract } from 'sevm';

// CryptoKitties Contract
// https://etherscan.io/address/0x06012c8cf97BEaD5deAe237070F9587f8E7A266d#code
const bytecode = await new Provider().getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d');
const contract = new Contract(bytecode);
const opcodes = contract.opcodes();
console.log(opcodes.map(opcode => opcode.format()));
