declare module 'solc' {
    /**
     * https://docs.soliditylang.org/en/latest/using-the-compiler.html#input-description
     */
    interface SolcInputSettings {
        /**
         * Optional: Optimizer settings
         */
        optimizer?: {
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
        type: 'function' | 'event' | 'constructor' | 'receive' | 'fallback';

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
