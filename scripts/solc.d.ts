export interface SolcOutput {
    contracts: {
        SOURCE: {
            [contractName: string]: {
                abi: Member[];
            };
        };
    };
    errors?: {
        severity: string;
        formattedMessage: string;
    }[];
}

/**
 * https://docs.soliditylang.org/en/latest/abi-spec.html#json
 */
export interface Member {
    type: 'function' | 'event' | 'constructor' | 'receive' | 'fallback';
    name: string;
    inputs: {
        name: string;
        type: string;
    }[];
}
