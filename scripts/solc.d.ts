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

export interface Member {
    type: 'function' | 'event';
    name: string;
    inputs: {
        name: string;
        type: string;
    }[];
}
