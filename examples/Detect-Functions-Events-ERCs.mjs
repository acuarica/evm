#!/usr/bin/env node
/* eslint-env node */

import { JsonRpcProvider } from 'ethers';
import { Contract } from 'sevm';
import 'sevm/4bytedb';

const provider = new JsonRpcProvider('https://cloudflare-eth.com/');
// CryptoKitties Contract
// https://etherscan.io/address/0x06012c8cf97BEaD5deAe237070F9587f8E7A266d#code
const bytecode = await provider.getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d');

const contract = new Contract(bytecode).patchdb();
console.log('functions', contract.getFunctions());
console.log('events', contract.getEvents());
console.log('isERC 165', contract.isERC('ERC165')); // Detect whether contract is ERC165-compliant
