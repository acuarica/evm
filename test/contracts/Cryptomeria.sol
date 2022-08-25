// SPDX-License-Identifier: MIT                                                                               
                                                    
pragma solidity 0.8.16;

contract ERC20 {
    function transfer(address recipient, uint256 amount) public virtual {
        _transfer(msg.sender, recipient, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) internal virtual { }
}

contract Cryptomeria is ERC20 {
    bool private swapping;

    mapping (address => bool) private _isExcludedFromFees;
    mapping (address => bool) public _isExcludedMaxTransactionAmount;
    mapping (address => bool) public automatedMarketMakerPairs;

    function _transfer(
        address from,
        address to,
        uint256 
    ) internal override {
        
        if( 
            !automatedMarketMakerPairs[from] &&
            !_isExcludedFromFees[from] &&
            !_isExcludedFromFees[to]
        ) {
            swapping = true;
        }
        
        if( automatedMarketMakerPairs[to] && !_isExcludedFromFees[from]){
        }
        
        uint256 fees = 0;
            if (automatedMarketMakerPairs[to]){
                fees = 1;
            } else if(automatedMarketMakerPairs[from]) {
        	    fees = 2;
            }
    }


}
