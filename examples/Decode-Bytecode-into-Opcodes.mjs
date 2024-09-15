#!/usr/bin/env node
/* eslint-env node */

import { JsonRpcProvider } from 'ethers';
import { Contract } from 'sevm';

const provider = new JsonRpcProvider('https://cloudflare-eth.com/');
// CryptoKitties Contract
// https://etherscan.io/address/0x06012c8cf97BEaD5deAe237070F9587f8E7A266d#code
const bytecode = await provider.getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d');
const contract = new Contract(bytecode);
const opcodes = contract.opcodes();
console.log(opcodes.map(opcode => opcode.format()));
