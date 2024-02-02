
/**
 * @typedef {number|'earliest'|'latest'|'safe'|'finalized'|'pending'} BlockTag
 */

/**
 * Simple JSON-RPC provider.
 */
export class Provider {

    constructor(url = 'http://127.0.0.1:8545') {
        this.url = url;
        this._id = 1;
    }

    /**
     * Returns the current block number.
     * 
     * See also https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_blocknumber.
     * 
     * @returns {Promise<number>} The current block number.
     */
    async blockNumber() {
        return parseInt(await this.post('eth_blockNumber', []), 16);
    }

    /**
     * Returns the current chain id.
     * 
     * See also https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_chainId
     * 
     * @returns {Promise<number>}
     */
    async chainId() {
        return parseInt(await this.post('eth_chainId', []), 16);
    }

    /**
     * Returns the receipts of a given block.
     * 
     * @param {number} blockNumber 
     * @returns {Promise<{transactionHash: string, contractAddress?: string}[]>}
     */
    getBlockReceipts(blockNumber) {
        return this.post('eth_getBlockReceipts', [blockNumber]);
    }

    /**
     * Returns the code at a given account address and block number.
     * 
     * See also https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getcode.
     * 
     * @param {string} address 20-byte account address.
     * @param {BlockTag} blockNumber The block number or tag at which to make the request.
     * See also https://ethereum.org/en/developers/docs/apis/json-rpc/#default-block.
     * @returns {Promise<string>}
     */
    getCode(address, blockNumber = 'latest') {
        return this.post('eth_getCode', [address, blockNumber]);
    }

    /**
     * Returns the current client version.
     * 
     * See also https://ethereum.org/en/developers/docs/apis/json-rpc/#web3_clientversion.
     * 
     * @returns {Promise<string>} 
     */
    async clientVersion() {
        return await this.post('web3_clientVersion', []);
    }

    /**
     * Sends a JSON-RPC `POST` request to the provider.
     * 
     * @template T
     * @param {'eth_blockNumber'|'eth_chainId'|'eth_getBlockReceipts'|'eth_getCode'|'web3_clientVersion'} method 
     * @param {unknown[]} params 
     * @returns {Promise<T>} The `result` of the request.
     */
    async post(method, params) {
        /** @typedef {{jsonrpc: string, id: number, error: unknown, result: unknown}} JsonRpcResponse */

        const id = this._id++;
        const resp = await fetch(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method,
                params,
                id,
            }),
        });

        const json = /** @type {JsonRpcResponse} */(await resp.json());
        if (resp.status === 200 && json.jsonrpc === '2.0' && json.id === id && json.error === undefined)
            return /** @type {T} */ (json.result);
        throw new Error(`Invalid JSON-RPC response: ${JSON.stringify(json)}`);
    }
}
