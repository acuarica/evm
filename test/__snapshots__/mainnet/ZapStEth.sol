// SPDX-License-Identifier: UNLICENSED
contract Contract {

    unknown public vault; // Slot #0
    uint256 var2__2; // Slot #16777215

    function() external payable {
        if (msg.data.length < 0x4) {
            if (msg.sender == vault) {
                throw('State must be halted after executing block at 1468..1468');
            }
            require(msg.sender == 0xdc24316b9ae028f1497c275eb9192a3ea0f67022, "!(vault or swap)");
            throw('State must be halted after executing block at 1468..1468');
        }
        if (msg.sig == 32d37f85) {
            $32d37f85();
        } else {
            if (msg.sig == 95225964) {
                $95225964();
            } else {
                if (msg.sig == fbfa77cf) {
                    $fbfa77cf();
                } else {
                    if (msg.sender == vault) {
                        throw('State must be halted after executing block at 1468..1468');
                    }
                    require(msg.sender == 0xdc24316b9ae028f1497c275eb9192a3ea0f67022, "!(vault or swap)");
                    throw('State must be halted after executing block at 1468..1468');
                }
            }
        }
    }

    function 95225964(/*no signature*/) public payable {
        require(var_2 == 0);
        var_2 = 0x1;
        require(msg.value == 0);
        require(msg.sender == tx.origin, "!EOA");
        require(call(gasleft(),vault,0x0,0x15c,0x64,0x200,0x20));
        require(returndatasize() > 0x1f);
        require(address(vault).code.length);
        require(call(gasleft(),vault,0x0,0x15c,0x44,0x0,0x0));
        require(call(gasleft(),0xae7ab96520de3a18e5e111b5eaab095312d7fe84,address(this).balance,0x15c,0x24,0x1c0,0x20));
        require(returndatasize() > 0x1f);
        require(staticcall(gasleft(),0xae7ab96520de3a18e5e111b5eaab095312d7fe84,0x17c,0x24,0x1e0,0x20));
        require(returndatasize() > 0x1f);
        require(memory[0x1e0] >= _arg2, "StEth < min");
        require(call(gasleft(),0xae7ab96520de3a18e5e111b5eaab095312d7fe84,0x0,0x17c,0x44,0x200,0x20));
        require(returndatasize() > 0x1f);
        var_2 = 0x0;
        return;
    }

    function 32d37f85(/*no signature*/) public payable {
        require(var_2 == 0);
        var_2 = 0x1;
        require(msg.value == 0);
        require(msg.sender == tx.origin, "!EOA");
        require(call(gasleft(),0xae7ab96520de3a18e5e111b5eaab095312d7fe84,0x0,0x15c,0x64,0x200,0x20));
        require(returndatasize() > 0x1f);
        require(call(gasleft(),0xae7ab96520de3a18e5e111b5eaab095312d7fe84,0x0,0x15c,0x44,0x1e0,0x20));
        require(returndatasize() > 0x1f);
        require(address(0xdc24316b9ae028f1497c275eb9192a3ea0f67022).code.length);
        require(call(gasleft(),0xdc24316b9ae028f1497c275eb9192a3ea0f67022,0x0,0x15c,0x84,0x0,0x0));
        require(address(vault).code.length);
        require(call(gasleft(),vault,address(this).balance,0x15c,0x4,0x0,0x0));
        require(staticcall(gasleft(),vault,0x17c,0x24,0x1e0,0x20));
        require(returndatasize() > 0x1f);
        require(memory[0x1e0] >= _arg2, "shares < min");
        require(call(gasleft(),vault,0x0,0x17c,0x44,0x200,0x20));
        require(returndatasize() > 0x1f);
        var_2 = 0x0;
        return;
    }

    function vault() public returns (unknown) {
        require(msg.value == 0);
        return vault;
    }

}
