import { strict as assert } from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// import './utils/snapshot.ts';
import { Contract } from '../src/contract.ts';

describe('::mainnet', function () {
    const dir = './test/mainnet';

    it.for(readdirSync(dir))('%s', (filename, ctx) => {
        assert(filename.endsWith('.json'));
        assert(filename.split('-').length === 2);
        const [name] = filename.split('-');

        if (filename.startsWith('SEAWHALE-'))
            ctx.skip('handle case: dest expr is not lit `and(4294967295n, 3583n)`');
        if (filename.startsWith('GovernanceRouter-'))
            ctx.skip('timeout error');

        const { bytecode } = JSON.parse(readFileSync(`${dir}/${filename}`, 'utf-8')) as { bytecode: string };
        const contract = new Contract(bytecode);
        const ss = [...contract.states.entries()].sort((l, r) => l[0] - r[0]);
        let coverage = '? opcodes in bytecode\n';
        for (const [pc, clones] of ss) {
            coverage += `@${pc}: ⟪${1}⟫ ${clones.length}〒\n`;
        }

        // const path = filename.slice(0, -'.json'.length);
        expect(coverage).matchSnapshotmd('coverage', name);
    });
});