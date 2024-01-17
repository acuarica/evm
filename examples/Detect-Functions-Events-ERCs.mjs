#!/usr/bin/env node
/* eslint-env node */

import { EtherscanProvider as Provider } from 'ethers';
import { Contract } from 'sevm';
import 'sevm/4bytedb';

// CryptoKitties Contract
// https://etherscan.io/address/0x06012c8cf97BEaD5deAe237070F9587f8E7A266d#code
const bytecode = await new Provider().getCode('0x06012c8cf97BEaD5deAe237070F9587f8E7A266d');

const contract = new Contract(bytecode).patchdb();
console.log(contract.getFunctions());
console.log(contract.getEvents());
console.log(contract.isERC('ERC165')); /* Detect whether contract is ERC165-compliant */
