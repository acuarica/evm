import { } from 'sevm';

/**
 * 
 */
type Hashes = { [hash: string]: string[] };

type Lookup = { function: Hashes, event: Hashes };

declare module 'sevm' {
    interface Contract {
        /**
         * It looks up in the signature and events remote API for matching hashes.
         *
         * When a matching `function` or `event` is found,
         * it patches the `function` or `event` with the corresponding signature.
         * 
         * https://docs.openchain.xyz/#/default/get_signature_database_v1_lookup
         * 
         * @param lookup 
         */
        patch(lookup: Partial<Lookup> = {}): Promise<this>;
    }
}
