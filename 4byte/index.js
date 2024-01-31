/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const sevm = require('sevm');

/** @typedef {{ [hash: string]: {name: string, filtered: boolean}[] | null }} HashesResponse */

/**
 * @param {HashesResponse} hashes 
 * @returns {{ [hash: string]: string[] }}
 */
const mapHashes = hashes => Object.fromEntries(
    Object.entries(hashes).map(([hash, matches]) => [hash, matches?.map(({ name }) => name) ?? [] ])
);

sevm.Contract.prototype.patch = async function (/** @type {Partial<import('.').Lookup>} */lookup = {}) {
    const functions = Object.keys(this.functions).map(selector => '0x' + selector).join(',');
    const events = Object.keys(this.events).map(topic => '0x' + topic).join(',');

    if (!lookup.function || !lookup.event) {
        const url = `https://api.openchain.xyz/signature-database/v1/lookup?function=${functions}&event=${events}`;
        const resp = await fetch(url);

        if (!resp.ok) {
            throw new Error(`error fetching signatures, url: ${url}`);
        }

        const { result } = /** @type {{result: { function: HashesResponse, event: HashesResponse }}} */ (await resp.json());
        lookup.function = mapHashes(result.function);
        lookup.event = mapHashes(result.event);
    }

    for (let [selector, fn] of Object.entries(this.functions)) {
        selector = '0x' + selector;
        if (selector in lookup.function) {
            fn.label = lookup.function[selector][0];
        }
    }

    for (let [topic, event] of Object.entries(this.events)) {
        topic = '0x' + topic;
        if (topic in lookup.event) {
            event.sig = lookup.event[topic][0];
        }
    }

    return this;
};

module.exports = sevm;
