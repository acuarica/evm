/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const sevm = require('sevm');

/** @param {{name: string, filtered: boolean}[]} matches */
const getName = (matches) => matches[0].name;

sevm.Contract.prototype.patch = async function () {
    const functions = Object.keys(this.functions).map(selector => '0x' + selector).join(',');
    const events = Object.keys(this.events).map(topic => '0x' + topic).join(',');

    const url = `https://api.openchain.xyz/signature-database/v1/lookup?function=${functions}&event=${events}`;
    const resp = await fetch(url);

    if (!resp.ok) {
        throw new Error(`error fetching signatures, url: ${url}`);
    }

    /** @typedef {{ [hash: string]: Parameters<typeof getName>[0] }} Hashes */
    const { result } = /** @type {{result: { function: Hashes, event: Hashes }}} */ (await resp.json());

    for (let [selector, fn] of Object.entries(this.functions)) {
        selector = '0x' + selector;
        if (selector in result.function) {
            fn.label = getName(result.function[selector]);
        }
    }

    for (let [topic, event] of Object.entries(this.events)) {
        topic = '0x' + topic;
        if (topic in result.event) {
            event.sig = getName(result.event[topic]);
        }
    }

    return this;
};

module.exports = sevm;