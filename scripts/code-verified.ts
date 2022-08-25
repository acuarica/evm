import { providers } from 'ethers';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as chalk from 'chalk';

const addr = chalk.blue;
const error = chalk.red;

const BASE_PATH = './data/smoke/';

const provider = {
    providers: [
        new providers.JsonRpcProvider('https://api.mycryptoapi.com/eth'),
        new providers.InfuraProvider(),
        new providers.AlchemyProvider(),
        new providers.EtherscanProvider(),
        new providers.CloudflareProvider(),
    ],
    current: 0,
    getCode: async function (address: string) {
        this.current = (this.current + 1) % this.providers.length;
        const code = await this.providers[this.current].getCode(address);
        await wait(2000);
        return code;
    },
};

/**
 * Needs to be manually downloaded from
 *
 * https://etherscan.io/exportData?type=open-source-contract-codes
 */
const csv = readFileSync('data/export-verified-contractaddress-opensource-license.csv');
const lines = csv.toString().split('\n');
const addresses = lines.map(
    entry => entry.trimEnd().replace(/"/g, '').split(',') as [string, string, string]
);

(async () => {
    for (const [, address, name] of addresses) {
        const path = `${BASE_PATH}${name}-${address}.bytecode`;

        if (!existsSync(path)) {
            console.log(`Fetching code for ${name} at ${addr(address)} into ${BASE_PATH}`);
            try {
                const code = await provider.getCode(address);
                writeFileSync(path, code);
            } catch (err) {
                console.log(error((err as { message: string }).message));
            }
        } else {
            console.log(chalk.dim(`Code for ${name} at ${addr(address)} already fetched`));
        }
    }
})();

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
