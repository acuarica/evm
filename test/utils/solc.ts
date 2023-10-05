/* eslint-disable mocha/no-exports */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import * as c from 'ansi-colors';
import type { Runnable, Suite } from 'mocha';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setupMethods } = require('solc');

export const VERSIONS = ['0.5.5', '0.5.17', '0.6.12', '0.7.6', '0.8.16'] as const;

type Version = (typeof VERSIONS)[number];

type Bytecode = {
    object: string;
    opcodes: string;
    sourceMap: string;
};

type ABI = {
    type: 'function' | 'event';
    name: string;
    inputs: {
        name: string;
        type: string;
    }[];
}[];

type SolcOutput = {
    contracts: {
        'source.sol': {
            [contractName: string]: {
                abi: ABI;
                evm: { bytecode: Bytecode; deployedBytecode: Bytecode };
            };
        };
    };
    errors?: {
        severity: keyof typeof SEVERITY;
        formattedMessage: string;
    }[];
};

const SEVERITY = {
    error: 1,
    warning: 2,
    info: 3,
};

const versionsLoaded = new Set<Version>();

/**
 *
 * https://docs.soliditylang.org/en/v0.8.16/using-the-compiler.html#compiler-input-and-output-json-description
 *
 * @param contractName
 * @param content
 * @param version
 * @returns
 */
export function compile(
    content: string,
    version: Version,
    opts: {
        severity?: keyof typeof SEVERITY;
        contractName?: string;
        context?: Mocha.Context;
    } = {}
): { bytecode: string; abi: ABI } {
    const input = JSON.stringify({
        language: 'Solidity',
        sources: {
            'source.sol': {
                content: `// SPDX-License-Identifier: MIT\npragma solidity ${version};\n${content}`,
            },
        },
        settings: {
            // optimizer: {
            // enabled:true,
            // details: {
            // deduplicate: true,
            // cse: true,
            // constantOptimizer: true,
            // yul: true,
            // }
            // },
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.deployedBytecode'],
                },
            },
        },
    });

    let writeCacheFn: (output: ReturnType<typeof compile>) => void;
    if (opts.context !== undefined) {
        const title = (test: Runnable | Suite | undefined): string =>
            test ? title(test.parent) + '.' + test.title : '';
        const fileName = title(opts.context.test)
            .replace(/^../, '')
            .replace('solc-', '')
            .replace(/`/g, '')
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
                opts.context.timeout(opts.context.timeout() + 5000);
                if (opts.context.test) {
                    opts.context.test.title += `--loads \`solc-${version}\``;
                }
            }
            writeCacheFn = output => writeFileSync(`${path}.json`, JSON.stringify(output, null, 2));
        }
    } else {
        writeCacheFn = _output => {};
    }

    versionsLoaded.add(version);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const solc = setupMethods(require(path.resolve('.solc', `soljson-v${version}.js`))) as {
        compile: (input: string) => string;
    };
    const output = JSON.parse(solc.compile(input)) as SolcOutput;

    const sev = opts.severity ?? 'error';
    if ('errors' in output && output.errors.some(err => SEVERITY[err.severity] >= SEVERITY[sev])) {
        throw new Error(output.errors.map(err => err.formattedMessage).join('\n'));
    }

    const contract = output.contracts['source.sol'];

    let selectedContract;
    if (opts.contractName) {
        if (!(opts.contractName in contract)) {
            throw new Error(`${opts.contractName} not found in ${Object.keys(contract).join(',')}`);
        }
        selectedContract = contract[opts.contractName];
    } else {
        selectedContract = Object.values(contract)[0];
    }

    const bytecode = selectedContract.evm.deployedBytecode.object;
    const abi = selectedContract.abi;
    writeCacheFn({ bytecode, abi });

    return { bytecode, abi };
}

export function forVersion(
    fn: (
        compile_: (content: string, context?: Mocha.Context) => ReturnType<typeof compile>,
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
                    (content, context) =>
                        compile(content, version, {
                            ...(context ? { context } : {}),
                        }),
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

    process.stdout.write('solc setup ');

    const releases = await (async function () {
        const path = './.solc/releases.json';
        try {
            return JSON.parse(readFileSync(path, 'utf-8')) as Releases;
        } catch (_err) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const resp = await fetch('https://binaries.soliditylang.org/bin/list.json');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (resp.ok) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const releases = (await resp.json()).releases as Releases;
                writeFileSync(path, JSON.stringify(releases, null, 2));
                return releases;
            } else {
                throw new Error('cannot fetch `list.json`');
            }
        }
    })();

    for (const version of VERSIONS) {
        await download(releases[version], version);
    }

    console.info();

    async function download(file: string, version: Version) {
        process.stdout.write(`${c.cyan('v' + version)}`);
        const path = `./.solc/soljson-v${version}.js`;

        if (existsSync(path)) {
            process.stdout.write(c.green('\u2713 '));
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const resp = await fetch(`https://binaries.soliditylang.org/bin/${file}`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (resp.ok) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                writeFileSync(path, await resp.text());
                process.stdout.write(c.yellow('\u2913 '));
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                console.info(c.red(`${resp.status}  ${resp.statusText}`));
            }
        }
    }
}
