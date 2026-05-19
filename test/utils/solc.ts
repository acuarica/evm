import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

import type { TestContext } from 'vitest';
import type { ABI, SolcInput, SolcOutput } from 'solc';
import wrapper from 'solc/wrapper';

export const VERSIONS = ['0.5.5', '0.5.17', '0.6.12', '0.7.6', '0.8.16', '0.8.21'] as const;

type Version = (typeof VERSIONS)[number];

const versionsLoaded = new Set<Version>();

const maskTitle = (title: string) => title
    .replace(/`/g, '')
    .replace(/^::/, '')
    .replace(/ /g, '-')
    .replace(/[:^'()|]/g, '_');

/**
 *
 * https://docs.soliditylang.org/en/latest/using-the-compiler.html#compiler-input-and-output-json-description
 *
 * @param contractName
 * @param content
 * @param version
 * @returns
 */
export function compile(
    content: string,
    version: Version,
    ctx: TestContext | null,
    options?: SolcInput['settings'] & { ignoreWarnings?: boolean }
): { bytecode: string; abi: ABI; metadata: string, evm: SolcOutput['contracts'][string][string]['evm'] } {
    const input = JSON.stringify({
        language: 'Solidity',
        sources: {
            'source.sol': {
                content: `// SPDX-License-Identifier: UNLICENSED\npragma solidity ${version};\n${content}`,
            },
        },
        settings: {
            optimizer: options?.optimizer,
            metadata: options?.metadata,
            outputSelection: {
                '*': {
                    '*': ['abi', 'metadata', 'evm.deployedBytecode', 'evm.methodIdentifiers'],
                },
            },
        },
    } satisfies SolcInput);

    let writeCacheFn: (output: ReturnType<typeof compile>) => void;
    if (ctx !== null) {
        const fileName = maskTitle(ctx.task.fullTestName
            .replace(` > solc-${version}`, '')
            .replace(' > should ', ' > ')
            .replace(/ > /g, '.')
            // .replace(/\."before-all"-hook-for-"[\w-#]+"/, '')
        );

        const basePath = `.artifacts/v${version}`;
        if (!existsSync(basePath)) {
            mkdirSync(basePath, { recursive: true });
        }

        const hash = createHash('md5').update(input).digest('hex').substring(0, 6);
        const path = `${basePath}/${fileName}-${hash}.json`;

        try {
            const result = JSON.parse(readFileSync(path, 'utf8')) as ReturnType<typeof compile>;
            ctx.annotate(`✓ Cached ${path}`);
            return result;
        } catch {
            ctx.annotate(`🛠️ Compiled ${path}`);

            if (!versionsLoaded.has(version)) {
                ctx.annotate(`⚙️ Loads \`solc-${version}\``);
            }
            writeCacheFn = output => writeFileSync(path, JSON.stringify(output, null, 2));
        }
    } else {
        writeCacheFn = () => { };
    }

    versionsLoaded.add(version);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const solc = wrapper(require(path.resolve('.solc', `soljson-v${version}.cjs`)));
    const { errors, contracts } = JSON.parse(solc.compile(input)) as SolcOutput;

    if (errors !== undefined && (!options?.ignoreWarnings || errors.some(err => err.severity === 'error'))) {
        throw new Error(errors.map(err => err.formattedMessage).join('\n'));
    }

    const source = contracts['source.sol'];
    const contract = source['Test'] ?? Object.values(source)[0];

    const bytecode = contract.evm.deployedBytecode.object;
    const abi = contract.abi;
    const metadata = contract.metadata;
    const evm = contract.evm;
    writeCacheFn({ bytecode, abi, metadata, evm });

    return { bytecode, abi, metadata, evm };
}