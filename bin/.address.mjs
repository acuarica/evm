import js_sha3 from 'js-sha3';

/**
 * Implementation based on:
 * - https://github.com/miguelmota/ethereum-checksum-address/blob/master/index.js
 * - https://github.com/ethers-io/ethers.js/blob/main/lib.esm/address/address.js
 * 
 * @param {string} address 
 * @returns {boolean}
 */
export function isValidAddress(address) {
    if (typeof (address) !== 'string') throw new Error('Invalid address, it must be a string');
    if (address.startsWith('0x')) address = address.slice(2);
    if (!address.match(/^[0-9a-fA-F]{40}$/)) throw new Error('Invalid address, not an Ethereum address');
    if (!address.match(/([A-F].*[a-f])|([a-f].*[A-F])/)) return true;

    const address_ = address.toLowerCase()
    const keccakHash = js_sha3.keccak256(address_);

    for (let i = 0; i < address_.length; i++) {
        let output = parseInt(keccakHash[i], 16) >= 8
            ? address_[i].toUpperCase()
            : address_[i]
        if (address[i] !== output) return false
    }
    return true
}
