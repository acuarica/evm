/**
 * https://docs.soliditylang.org/en/latest/using-the-compiler.html#output-description
 */
export interface SolcOutput {
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
                abi: Member[];
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
        severity: string;
        /**
         * Optional: the message formatted with source location
         */
        formattedMessage: string;
    }[];
}

/**
 * https://docs.soliditylang.org/en/latest/abi-spec.html#json
 */
export interface Member {
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
