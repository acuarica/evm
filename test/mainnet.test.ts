import { strict as assert } from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';

import { beforeAll, describe, expect, it } from 'vitest';

import { Contract } from '../src/contract.ts';
import { Metadata } from '../src/metadata.ts';

describe('::mainnet', function () {
    const dir = './test/mainnet';

    describe.for(
        readdirSync(dir)
            .filter(f => !f.startsWith('SEAWHALE-'))
            .filter(f => !f.startsWith('GovernanceRouter-'))
            .map(f => [f.split('-')[0], f])
    )('%s', ([name, filename]) => {

        let contract: Contract;

        beforeAll(() => {
            assert(filename.endsWith('.json'));

            const { bytecode } = JSON.parse(readFileSync(`${dir}/${filename}`, 'utf-8')) as { bytecode: string };
            contract = new Contract(bytecode);
        });

        it('should match selectors', () => {
            expect(contract.selectors).matchSnapshotmd('json', name);
        });

        it('should match chunks', () => {
            const trunc = (buf: string, len = 100) =>
                (buf.length <= len ? buf : buf.slice(0, len) + '[..]');

            let output = '';
            let sum = 0;
            for (const chunk of contract.chunks()) {
                output += `@${chunk.pcbegin}: `;

                if (chunk.content instanceof Uint8Array) {
                    output += `unreachable (${chunk.content.length} bytes in buffer) `;
                    output += trunc(Buffer.from(chunk.content).toString('hex'));
                } else if (chunk.content instanceof Metadata) {
                    output += JSON.stringify(chunk.content);
                } else {
                    sum += chunk.content[0].insts.length;
                    output += `⟪${chunk.content[0].insts.length}⟫ ${chunk.content.length}〒`;
                }
                output += '\n';
            }

            const header = `${sum} opcodes in bytecode\n`;
            expect(header + output).to.matchFile(`${name}.chunks`);
        });
    });
});