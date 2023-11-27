#!/usr/bin/env node
/* eslint-disable no-undef */

import { readFileSync } from 'fs';

import { Contract, toHex, sol } from 'sevm';

/** @param {import('sevm').Opcode} opcode */
function ansiOpcode(opcode) {
    const pc = opcode.pc.toString().padStart(6).toUpperCase();
    const offset = `0x${opcode.offset.toString(16)}`.padStart(8);
    const pushData = opcode.pushData
        ? (opcode.mnemonic.length === 5 ? ' ' : '') + `0x${toHex(opcode.pushData)}`
        : '';
    return `${pc} ${offset}  ${opcode.mnemonic}    ${pushData}`;
}

function main() {
    const path = process.argv[2];
    const { bytecode } = JSON.parse(readFileSync(path, 'utf8'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const contract = new Contract(bytecode);

    console.info(
        `${'index'.padStart(6)} ${'pc'.padStart(8)}  ${'mnemonic'}  ${'push data (PUSHx)'}`
    );

    for (const chunk of contract.chunks()) {
        console.info(chunk.pcstart, ':', chunk.states === undefined ? 'unreachable' : '');

        for (let i = chunk.pcstart; i < chunk.pcend; i++) {
            const opcode = contract.evm.opcodes[i];
            console.info(ansiOpcode(opcode));
        }

        if (chunk.states !== undefined) {
            for (const state of chunk.states) {
                console.info('state');
                console.info('    〒 ', state.stack.values.join(' | '));
                state.stmts.forEach(stmt => console.info('  ', sol`${stmt}`));
            }
        }
    }
}

main();
