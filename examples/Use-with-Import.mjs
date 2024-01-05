#!/usr/bin/env node
/* eslint-env node */

import { Contract } from 'sevm';

const contract = new Contract('0x00');
console.log(contract.solidify());
