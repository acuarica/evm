/* eslint-disable mocha/no-exports */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

import type { ABI, SolcInput, SolcOutput } from 'solc';
import wrapper from 'solc/wrapper';
import { fullTitle } from './snapshot';

const VERSIONS = ['0.5.5', '0.5.17', '0.6.12', '0.7.6', '0.8.16', '0.8.21'] as const;

export type Version = (typeof VERSIONS)[number];

const versionsLoaded = new Set<Version>();

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
    ctx: Mocha.Context | null,
    opts?: SolcInput['settings'] & { ignoreWarnings?: boolean }
): { bytecode: string; abi: ABI; metadata: string } {
    const input = JSON.stringify({
        language: 'Solidity',
        sources: {
            'source.sol': {
                content: `// SPDX-License-Identifier: UNLICENSED\npragma solidity ${version};\n${content}`,
            },
        },
        settings: {
            optimizer: opts?.optimizer,
            metadata: opts?.metadata,
            outputSelection: {
                '*': {
                    '*': ['abi', 'metadata', 'evm.deployedBytecode'],
                },
            },
        },
    } satisfies SolcInput);

    let writeCacheFn: (output: ReturnType<typeof compile>) => void;
    if (ctx !== null) {
        const updateTitle = (text: string) => {
            if (ctx.test) ctx.test.title += text;
        };

        const fileName = fullTitle(ctx)
            .replace(`solc-v${version}.`, '')
            .replace(/\."before-all"-hook-for-"[\w-#]+"/, '');

        const basePath = `.artifacts/v${version}`;
        if (!existsSync(basePath)) {
            mkdirSync(basePath, { recursive: true });
        }

        const hash = createHash('md5').update(input).digest('hex').substring(0, 6);
        const path = `${basePath}/${fileName}-${hash}`;

        updateTitle(` #${hash}`);

        try {
            return JSON.parse(readFileSync(`${path}.json`, 'utf8')) as ReturnType<typeof compile>;
        } catch {
            updateTitle(` 🛠️`);

            if (!versionsLoaded.has(version)) {
                ctx.timeout(ctx.timeout() + 5000);
                updateTitle(`--loads \`solc-${version}\``);
            }
            writeCacheFn = output => writeFileSync(`${path}.json`, JSON.stringify(output, null, 2));
        }
    } else {
        writeCacheFn = _output => { };
    }

    versionsLoaded.add(version);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const solc = wrapper(require(path.resolve('.solc', `soljson-v${version}.js`)));
    const { errors, contracts } = JSON.parse(solc.compile(input)) as SolcOutput;

    if (errors !== undefined && (!opts?.ignoreWarnings || errors.some(err => err.severity === 'error'))) {
        throw new Error(errors.map(err => err.formattedMessage).join('\n'));
    }

    const source = contracts['source.sol'];
    const contract = source['Test'] ?? Object.values(source)[0];

    const bytecode = contract.evm.deployedBytecode.object;
    const abi = contract.abi;
    const metadata = contract.metadata;
    writeCacheFn({ bytecode, abi, metadata });

    return { bytecode, abi, metadata };
}

export function forVersion(
    fn: (
        compile_: (
            content: string,
            context: Mocha.Context,
            opts?: Parameters<typeof compile>[3],
        ) => ReturnType<typeof compile>,
        fallback: 'fallback' | 'function',
        version: Version
    ) => void
) {
    VERSIONS.forEach(version => {
        if (version.startsWith(process.env['SOLC'] ?? '')) {
            // https://docs.soliditylang.org/en/latest/060-breaking-changes.html#semantic-and-syntactic-changes
            // https://docs.soliditylang.org/en/latest/060-breaking-changes.html#how-to-update-your-code
            const fallback = version.startsWith('0.5') ? 'function' : 'fallback';

            describe(`solc-v${version}`, function () {
                fn(
                    (content, context, opts) => compile(content, version, context, opts),
                    fallback,
                    version
                );
            });
        }
    });
}

export function contracts(title: string, fn: Parameters<typeof forVersion>[0]) {
    describe(`contracts::${title}`, function () {
        forVersion(fn);
    });
}
