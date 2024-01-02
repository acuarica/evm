/* eslint-disable mocha/no-exports */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import c from 'ansi-colors';
import type { Runnable, Suite } from 'mocha';

import wrapper from 'solc/wrapper';
import type { ABI, SolcInput, SolcOutput } from 'solc';

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
    context: Mocha.Context | null,
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
    if (context !== null) {
        const title = (test: Runnable | Suite | undefined): string =>
            test ? title(test.parent) + '.' + test.title : '';
        const fileName = title(context.test)
            .replace(/^../, '')
            .replace(`solc-v${version}.`, '')
            .replace(/`/g, '')
            .replace(/^::/, '')
            .replace(/::/g, '.')
            .replace(/ /g, '-')
            .replace(/[:^'()]/g, '_')
            .replace(/\."before-all"-hook-for-"[\w-#]+"/, '');

        const basePath = `.solc/v${version}`;
        if (!existsSync(basePath)) {
            mkdirSync(basePath);
        }

        const hash = createHash('md5').update(input).digest('hex').substring(0, 6);
        const path = `${basePath}/${fileName}-${hash}`;

        try {
            return JSON.parse(readFileSync(`${path}.json`, 'utf8')) as ReturnType<typeof compile>;
        } catch {
            if (!versionsLoaded.has(version)) {
                context.timeout(context.timeout() + 5000);
                if (context.test) {
                    context.test.title += `--loads \`solc-${version}\``;
                }
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

/**
 *
 */
export async function mochaGlobalSetup() {
    type Releases = { [key: string]: string };

    mkdirSync('.solc', { recursive: true });
    process.stdout.write(c.magenta('> setup solc-js compilers '));

    const releases = await (async function () {
        const path = './.solc/releases.json';
        try {
            return JSON.parse(readFileSync(path, 'utf-8')) as Releases;
        } catch (_err) {
            const resp = await fetch('https://binaries.soliditylang.org/bin/list.json');
            if (resp.ok) {
                const { releases } = (await resp.json()) as { releases: Releases };
                writeFileSync(path, JSON.stringify(releases, null, 2));
                return releases;
            } else {
                throw new Error('cannot fetch `list.json`');
            }
        }
    })();

    for (const version of VERSIONS) {
        process.stdout.write(`${c.cyan('v' + version)}`);
        const path = `./.solc/soljson-v${version}.js`;

        if (existsSync(path)) {
            process.stdout.write(c.green('\u2713 '));
        } else {
            const resp = await fetch(`https://binaries.soliditylang.org/bin/${releases[version]}`);
            if (resp.ok) {
                writeFileSync(path, await resp.text());
                process.stdout.write(c.yellow('\u2913 '));
            } else {
                console.info(c.red(`${resp.status} ${resp.statusText}`));
            }
        }
    }
}
