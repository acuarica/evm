import { strict as assert } from 'assert';
import { expect } from 'chai';
import { FunctionFragment } from 'ethers';
import { readdirSync, readFileSync } from 'fs';
import { inspect } from 'util';

import { Contract, ERCIds } from 'sevm';
import 'sevm/4bytedb';

import { fnselector } from './utils/selector';

describe('::mainnet', function () {

    (base => readdirSync(base)
        .filter(f => f.endsWith('.json'))
        .map(f => ({
            filename: f.replace('.json', ''), ...JSON.parse(readFileSync(`${base}/${f}`, 'utf-8')) as {
                bytecode: string,
                members?: string[];
                selectors?: string[];
                ercs?: (typeof ERCIds)[number][];
                skipSnapshot?: boolean;
                checkEvents?: boolean;
            }
        }))
        .map(e => ({ ...e, members: (e.members ?? []).map(line => new RegExp(line)) }))
    )('./test/mainnet').forEach(({ filename, bytecode, members, ercs, checkEvents, selectors, skipSnapshot }) => {
        const name = filename.split('-')[0];

        describe(`${filename}`, function () {
            const defs = members.map(line =>
                line.source
                    .replace(/\\/g, '')
                    .replace('^', '')
                    .replace('$', '')
                    .replace('{', '')
                    .replace(';', '')
            );
            const functions = defs
                .filter(line => line.startsWith('function '))
                .map(line => FunctionFragment.from(line.trim()).format());
            const variables = defs
                .filter(line => line.includes(' public ') && !line.includes('('))
                .map(line => line.split(' ').pop()! + '()');
            const mappings = defs
                .filter(line => line.startsWith('mapping ') && line.includes(' public '))
                .map(line => {
                    const parts = line
                        .replace(/mapping /g, '')
                        .replace(/\(/g, '')
                        .replace(/\)/g, '')
                        .replace(/ => /g, ' ')
                        .replace(' public ', ' ')
                        .split(' ');
                    const name = parts.pop();
                    parts.pop();
                    return `${name}(${parts.join(',')})`;
                });

            let contract: Contract;
            let text: string;

            before(function () {
                // Increasing due to timeout on Node 16
                // This seems to be an issue on solidify SmithBot, which is around ~4.3M
                this.timeout(10000);

                contract = new Contract(bytecode).patchdb();
                text = contract.reduce().solidify();
            });

            it('should match `chunks` coverage snapshot', function () {
                const trunc = (buf: string, len = 100) =>
                    (buf.length <= len ? buf : buf.slice(0, len) + '[..]');

                const nopcodes = contract.opcodes().length;
                let output = `${nopcodes} opcodes in bytecode\n`;

                let sum = 0;
                for (const chunk of contract.chunks()) {
                    output += `@${chunk.pcbegin}: `;

                    if (chunk.content instanceof Uint8Array) {
                        assert(chunk.states === undefined);
                        output += `unreachable (${chunk.content.length} bytes in buffer) `;
                        output += trunc(Buffer.from(chunk.content).toString('hex'));
                    } else {
                        const block = contract.blocks.get(chunk.pcbegin);
                        assert(chunk.states !== undefined);
                        assert(block !== undefined);
                        assert(block.opcodes.length === chunk.content.length);
                        sum += chunk.content.length;
                        output += `⟪${chunk.content.length}⟫ ${chunk.states.length}〒`;
                    }
                    output += '\n';
                }

                expect(sum).to.be.equal(nopcodes);
                expect(output).to.matchFile(`mainnet/${name}.dis`, this);
            });

            it('should match Solidity snapshot', function () {
                if (skipSnapshot) this.skip();
                expect(text).to.matchFile(`mainnet/${name}.sol`, this);
            });

            it('should detect selectors', function () {
                if (selectors === undefined && members.length === 0) this.skip();
                expect([...contract.functionBranches.keys()]).to.have.members(
                    [...(selectors ?? []), ...[...functions, ...variables, ...mappings].map(fnselector)]
                );
            });

            it('should detect functions', function () {
                expect(contract.getFunctions()).to.include.members(functions);
            });

            it('should detect variables', function () {
                expect(contract.getFunctions()).to.include.members(variables);
            });

            it('should detect mappings', function () {
                expect(contract.getFunctions()).to.include.members(mappings);
            });

            it('functions, variables & mappings should cover `getFunctions`', function () {
                if (members.length > 0) {
                    const expected = [...functions, ...variables, ...mappings];
                    expect(new Set(contract.getFunctions()),
                        `actual ${inspect(contract.getFunctions())} != expected ${inspect(expected)}`
                    ).to.be.deep.equal(new Set(expected));
                }
            });

            it('should detect errors', function () {
                const replacer = (_key: string, value: unknown) =>
                    typeof value === 'bigint' ? value.toString(16) : value;
                const errors = JSON.stringify(contract.errors.map(e => e.err), replacer, 2);
                expect(errors).to.matchSnapshot('errors', this);
            });

            const trunc = (s: string): string => (s.length < 50 ? s : s.substring(0, 50) + '...');
            members.forEach(member =>
                it(`should find '${trunc(member.source)}' in decompiled bytecode`, function () {
                    expect(text).to.match(member);
                })
            );

            ercs?.forEach(erc =>
                it(`should detect \`${erc}\` interface`, function () {
                    expect(contract.isERC(erc, checkEvents)).to.be.true;
                })
            );
        });
    });
});
