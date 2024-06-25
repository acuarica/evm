import { } from 'sevm';

/**
 * 
 */
type Hashes = { [hash: string]: string[] };

type Lookup = { function: Hashes, event: Hashes };

declare module 'sevm' {
    interface Contract {
        /**
         * Looks up for matching `function` and `event` selectors in the `api.openchain.xyz` remote API.
         * The endpoint used to fetch signatures is [https://api.openchain.xyz/signature-database/v1/lookup](https://docs.openchain.xyz/#/default/get_signature_database_v1_lookup).
         * Please note that the global [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) is used to make the request.
         *
         * When a matching `function` or `event` is found,
         * it patches the `Contract`'s `function` or `event` with the corresponding signature.
         * 
         * The `lookup` argument is an input/output argument to cache the result of the lookup.
         * When no argument is provided (default) or empty object, it always performs the request to the remote API (no caching).
         * In addition, it will populate the `lookup` argument with the result signatures of the request.
         * In turn, this `lookup` result signatures can be provided to the next invocation to `patch` (for the same contract) to avoid making a request to the remote API.
         * Thus, when catching the `lookup`, make sure to always pass a reference instead of a value.
         * 
         * In the following example, whenever the `abiPath` file exists,
         * the contract will be patched using the respective `lookup` signatures and avoid making the request to the remote API.
         * On the other hand, when it does not exist, it will make the request to fetch `function` and `event` signatures.
         * 
         * ```ts
         * const abiPath = "path/to/save/contract/abi";
         * let lookup;
         * if (fs.existsSync(abiPath)) {
         *     lookup = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
         * } else {
         *     lookup = {};
         * }
         * contract = await contract.patch(lookup);
         * ```
         * 
         * @param lookup optional input/output lookup signatures provided by a previous invocation to `patch`.
         */
        patch(lookup: Partial<Lookup> = {}): Promise<this>;
    }
}
