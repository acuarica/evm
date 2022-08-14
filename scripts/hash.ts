import * as fs from 'fs';
import { utils } from 'ethers';

import * as functions from '../data/functions.json';
import * as events from '../data/events.json';

type Hashes = { [hash: string]: string };

const reduce = (entries: string[], replacer: (value: string) => string) =>
    entries.reduce((map: Hashes, entry: string) => {
        map[replacer(utils.keccak256(utils.toUtf8Bytes(entry)))] = entry;
        return map;
    }, {});

const functionHashes = reduce(functions, s => s.substring(2, 10));
const eventHashes = reduce(events, s => s.substring(2));

fs.writeFileSync('./data/functionHashes.json', JSON.stringify(functionHashes, null, 4));
fs.writeFileSync('./data/functionHashes.min.json', JSON.stringify(functionHashes));
fs.writeFileSync('./data/eventHashes.json', JSON.stringify(eventHashes, null, 4));
fs.writeFileSync('./data/eventHashes.min.json', JSON.stringify(eventHashes));

console.log('Updated hashes successfully');
