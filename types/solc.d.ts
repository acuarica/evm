declare module 'solc' {
    /**
     * https://docs.soliditylang.org/en/latest/using-the-compiler.html#input-description
     *
     * To be used with https://github.com/ethereum/solc-js.
     */
    interface SolcInput {
        language: 'Solidity';
        sources: {
            'source.sol': {
                content: string;
            };
        };
        settings: {
            /**
             * Optional: Optimizer settings
             */
            optimizer?: undefined | {
                /**
                 * Disabled by default.
                 * NOTE: enabled=false still leaves some optimizations on. See comments below.
                 * WARNING: Before version 0.8.6 omitting the 'enabled' key was not equivalent to setting
                 * it to false and would actually disable all the optimizations.
                 */
                enabled?: boolean;
                /**
                 * Switch optimizer components on or off in detail.
                 * The "enabled" switch above provides two defaults which can be tweaked here.
                 * If "details" is given, "enabled" can be omitted.
                 */
                details?: {
                    /**
                     * The peephole optimizer is always on if no details are given,
                     * use details to switch it off.
                     */
                    peephole?: boolean;
                    /**
                     * The inliner is always off if no details are given,
                     * use details to switch it on.
                     */
                    inliner?: boolean;
                    /**
                     * The unused jumpdest remover is always on if no details are given,
                     * use details to switch it off.
                     */
                    jumpdestRemover?: boolean;
                    /**
                     * Sometimes re-orders literals in commutative operations.
                     */
                    orderLiterals?: boolean;
                    /**
                     * Removes duplicate code blocks.
                     */
                    deduplicate?: boolean;
                    /**
                     * Common subexpression elimination, this is the most complicated step but
                     * can also provide the largest gain.
                     */
                    cse?: boolean;
                    /**
                     * Optimize representation of literal numbers and strings in code.
                     */
                    constantOptimizer?: boolean;
                };
            };

            /** 
             * Metadata settings (optional)
             */
            metadata?: undefined | {
                /**
                 * The CBOR metadata is appended at the end of the bytecode by default.
                 * Setting this to false omits the metadata from the runtime and deploy time code.
                 */
                appendCBOR?: boolean,
                /**
                 * Use only literal content and not URLs (false by default)
                 */
                useLiteralContent?: boolean,
                /**
                 * Use the given hash method for the metadata hash that is appended to the bytecode.
                 * The metadata hash can be removed from the bytecode via option "none".
                 * The other options are "ipfs" and "bzzr1".
                 * If the option is omitted, "ipfs" is used by default.
                 */
                bytecodeHash?: 'ipfs' | 'bzzr1' | 'none',
            },

            /**
             * The following can be used to select desired outputs based
             * on file and contract names.
             * If this field is omitted, then the compiler loads and does type checking,
             * but will not generate any outputs apart from errors.
             * The first level key is the file name and the second level key is the contract name.
             * An empty contract name is used for outputs that are not tied to a contract
             * but to the whole source file like the AST.
             * A star as contract name refers to all contracts in the file.
             * Similarly, a star as a file name matches all files.
             * To select all outputs the compiler can possibly generate, use
             * "outputSelection: { "*": { "*": [ "*" ], "": [ "*" ] } }"
             * but note that this might slow down the compilation process needlessly.
             *
             * The available output types are as follows:
             *
             * File level (needs empty string as contract name):
             *   ast - AST of all source files
             *
             * Contract level (needs the contract name or "*"):
             *   abi - ABI
             *   devdoc - Developer documentation (natspec)
             *   userdoc - User documentation (natspec)
             *   metadata - Metadata
             *   ir - Yul intermediate representation of the code before optimization
             *   irAst - AST of Yul intermediate representation of the code before optimization
             *   irOptimized - Intermediate representation after optimization
             *   irOptimizedAst - AST of intermediate representation after optimization
             *   storageLayout - Slots, offsets and types of the contract's state variables.
             *   evm.assembly - New assembly format
             *   evm.legacyAssembly - Old-style assembly format in JSON
             *   evm.bytecode.functionDebugData - Debugging information at function level
             *   evm.bytecode.object - Bytecode object
             *   evm.bytecode.opcodes - Opcodes list
             *   evm.bytecode.sourceMap - Source mapping (useful for debugging)
             *   evm.bytecode.linkReferences - Link references (if unlinked object)
             *   evm.bytecode.generatedSources - Sources generated by the compiler
             *   evm.deployedBytecode* - Deployed bytecode (has all the options that evm.bytecode has)
             *   evm.deployedBytecode.immutableReferences - Map from AST ids to bytecode ranges that reference immutables
             *   evm.methodIdentifiers - The list of function hashes
             *   evm.gasEstimates - Function gas estimates
             *
             * Note that using `evm`, `evm.bytecode`, etc. will select every
             * target part of that output. Additionally, `*` can be used as a wildcard to request everything.
             */
            outputSelection?: {
                '*': {
                    '*': string[];
                };
            };
        };
    }

    /**
     * https://docs.soliditylang.org/en/latest/using-the-compiler.html#output-description
     */
    interface SolcOutput {
        /**
         * This contains the contract-level outputs.
         * It can be limited/filtered by the `outputSelection` settings.
         */
        contracts: {
            [fileName: string]: {
                /**
                 * If the language used has no contract names,
                 * this field should equal to an empty string.
                 */
                [contractName: string]: {
                    /**
                     * The Ethereum Contract ABI. If empty, it is represented as an empty array.
                     * See https://docs.soliditylang.org/en/develop/abi-spec.html
                     */
                    abi: ABI;

                    /**
                     * See the Metadata Output documentation (serialised JSON string)
                     */
                    metadata: string;

                    /**
                     * EVM-related outputs.
                     */
                    evm: { bytecode: Bytecode; deployedBytecode: Bytecode };
                };
            };
        };

        /**
         * Optional: not present if no errors/warnings/infos were encountered
         */
        errors?: {
            /**
             * Mandatory ("error", "warning" or "info", but please note that this may be extended in the future)
             */
            severity: 'error' | 'warning' | 'info';
            /**
             * Optional: the message formatted with source location
             */
            formattedMessage: string;
        }[];
    }

    type ABI = Member[];

    type Bytecode = {
        object: string;
        opcodes: string;
        sourceMap: string;
    };

    /**
     * https://docs.soliditylang.org/en/latest/abi-spec.html#json
     */
    interface Member {
        type: 'function' | 'event' | 'constructor' | 'receive' | 'fallback' | 'error';

        /**
         * name: the name of the function or event;
         */
        name: string;
        /**
         * `inputs`: an array of objects, each of which contains:
         */
        inputs: {
            /**
             * `name`: the name of the parameter.
             */
            name: string;
            /**
             * `type`: the canonical type of the parameter (more below).
             */
            type: string;
        }[];
    }

    function compile(input: string): string;
}

declare module 'solc/wrapper' {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    export default function wrapper(soljson: unknown): typeof import('solc');
}
