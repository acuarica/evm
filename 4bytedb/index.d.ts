import {} from 'sevm';

declare module 'sevm' {
    interface Contract {
        /**
         * It looks up in the signature and events database for matching selector or topic hashes.
         *
         * When a matching `function` or `event` is found,
         * it patches the `function` or `event` with the corresponding signature.
         */
        patchdb(): this;
    }
}
