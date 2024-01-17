// SPDX-License-Identifier: UNLICENSED
// Metadata bzzr0://0877df264aa5d498c61a45dfe4fc04c68d11820448cf0cc7a275283a271173b4
pragma solidity ;

contract Contract {

    event Approval(address indexed _arg0, address indexed _arg1, uint256 _arg2);
    event LogSetOwner(address indexed _arg0);

    mapping (address => unknown) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

unknown public name; // Slot #7
unknown public owner; // Slot #4
unknown public authority; // Slot #3
unknown public totalSupply; // Slot #0
unknown public decimals; // Slot #6
unknown public symbol; // Slot #5
    function() external payable {
        if (~(msg.data.length < 0x4)) {
            if (msg.sig == 06fdde03) {
                $06fdde03();
            } else {
                if (msg.sig == 07da68f5) {
                    $07da68f5();
                } else {
                    if (msg.sig == 095ea7b3) {
                        $095ea7b3();
                    } else {
                        if (msg.sig == 13af4035) {
                            $13af4035();
                        } else {
                            if (msg.sig == 18160ddd) {
                                $18160ddd();
                            } else {
                                if (msg.sig == 23b872dd) {
                                    $23b872dd();
                                } else {
                                    if (msg.sig == 313ce567) {
                                        $313ce567();
                                    } else {
                                        if (msg.sig == 40c10f19) {
                                            $40c10f19();
                                        } else {
                                            if (msg.sig == 42966c68) {
                                                $42966c68();
                                            } else {
                                                if (msg.sig == 5ac801fe) {
                                                    $5ac801fe();
                                                } else {
                                                    if (msg.sig == 70a08231) {
                                                        $70a08231();
                                                    } else {
                                                        if (msg.sig == 75f12b21) {
                                                            $75f12b21();
                                                        } else {
                                                            if (msg.sig == 7a9e5e4b) {
                                                                $7a9e5e4b();
                                                            } else {
                                                                if (msg.sig == 8da5cb5b) {
                                                                    $8da5cb5b();
                                                                } else {
                                                                    if (msg.sig == 95d89b41) {
                                                                        $95d89b41();
                                                                    } else {
                                                                        if (msg.sig == 9dc29fac) {
                                                                            $9dc29fac();
                                                                        } else {
                                                                            if (msg.sig == a0712d68) {
                                                                                $a0712d68();
                                                                            } else {
                                                                                if (msg.sig == a9059cbb) {
                                                                                    $a9059cbb();
                                                                                } else {
                                                                                    if (msg.sig == b753a98c) {
                                                                                        $b753a98c();
                                                                                    } else {
                                                                                        if (msg.sig == bb35783b) {
                                                                                            $bb35783b();
                                                                                        } else {
                                                                                            if (msg.sig == be9a6555) {
                                                                                                $be9a6555();
                                                                                            } else {
                                                                                                if (msg.sig == bf7e214f) {
                                                                                                    $bf7e214f();
                                                                                                } else {
                                                                                                    if (msg.sig == daea85c5) {
                                                                                                        $daea85c5();
                                                                                                    } else {
                                                                                                        if (msg.sig == dd62ed3e) {
                                                                                                            $dd62ed3e();
                                                                                                        } else {
                                                                                                            if (msg.sig == f2d5d56b) {
                                                                                                                $f2d5d56b();
                                                                                                            } else {
                                                                                                                revert();
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        revert();
    }

    function name() public returns (unknown) {
        require(msg.value == 0);
        return name;
    }

    function stop() public {
        require(msg.value == 0);
        if (~msg.sender != address(this)) {
            log([object Object], [object Object], [object Object], [object Object], memory[0x60:0xc0 + msg.data.length - 0x60 ]ii);
            owner = 0x10000000000000000000000000000000000000000 | 0xffffffffffffffffffffff00ffffffffffffffffffffffffffffffffffffffff & owner;
            return;
        }
        if (~owner != msg.sender) {
            log([object Object], [object Object], [object Object], [object Object], memory[0x60:0xc0 + msg.data.length - 0x60 ]ii);
            owner = 0x10000000000000000000000000000000000000000 | 0xffffffffffffffffffffff00ffffffffffffffffffffffffffffffffffffffff & owner;
            return;
        }
        require(authority);
        require(address(authority).code.length);
        require(call(gasleft() - 0x2c6,local9,0x0,local7,0x64 + local5 - local7,local7,0x20));
        log([object Object], [object Object], [object Object], [object Object], memory[0x60:0xc0 + msg.data.length - 0x60 ]ii);
        owner = 0x10000000000000000000000000000000000000000 | 0xffffffffffffffffffffff00ffffffffffffffffffffffffffffffffffffffff & owner;
        return;
    }

    function approve(address _arg0, uint256 _arg1) public returns (uint256) {
        require(msg.value == 0);
        require((owner / 0x10000000000000000000000000000000000000000) == 0);
        allowance[msg.sender][_arg0] = _arg1;
        emit Approval(msg.sender, _arg0, _arg1);
        return 0x1;
    }

    function setOwner(address _arg0) public {
        require(msg.value == 0);
        if (~msg.sender != address(this)) {
            owner = _arg0 | 0xffffffffffffffffffffffff0000000000000000000000000000000000000000 & owner;
            emit LogSetOwner(_arg0 | 0xffffffffffffffffffffffff0000000000000000000000000000000000000000 & owner);
            return;
        }
        if (~owner != msg.sender) {
            owner = _arg0 | 0xffffffffffffffffffffffff0000000000000000000000000000000000000000 & owner;
            emit LogSetOwner(_arg0 | 0xffffffffffffffffffffffff0000000000000000000000000000000000000000 & owner);
            return;
        }
        require(authority);
        require(address(authority).code.length);
        require(call(gasleft() - 0x2c6,local9,0x0,local7,0x64 + local5 - local7,local7,0x20));
        owner = _arg0 | 0xffffffffffffffffffffffff0000000000000000000000000000000000000000 & owner;
        emit LogSetOwner(_arg0 | 0xffffffffffffffffffffffff0000000000000000000000000000000000000000 & owner);
        return;
    }

    function totalSupply() public returns (unknown) {
        require(msg.value == 0);
        return totalSupply;
    }

    function transferFrom(address _arg0, address _arg1, uint256 _arg2) public {
        require(msg.value == 0);
        require((owner / 0x10000000000000000000000000000000000000000) == 0);
        if (~(_arg0 == msg.sender)) {
            if (~(0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff == allowance[_arg0][msg.sender])) {
                require(allowance[_arg0][msg.sender] - _arg2 <= allowance[_arg0][msg.sender]);
                allowance[_arg0][msg.sender] -= _arg2;
                require(balanceOf[_arg0] - _arg2 <= balanceOf[_arg0]);
                balanceOf[_arg0] -= _arg2;
                require(balanceOf[_arg1] + _arg2 >= balanceOf[_arg1]);
            }
            require(balanceOf[_arg0] - _arg2 <= balanceOf[_arg0]);
        }
        if (~(_arg0 == msg.sender)) {
            require(allowance[_arg0][msg.sender] - _arg2 <= allowance[_arg0][msg.sender]);
        }
        require(balanceOf[_arg0] - _arg2 <= balanceOf[_arg0]);
    }

    function decimals() public returns (unknown) {
        require(msg.value == 0);
        return decimals;
    }

    function mint(address _arg0, uint256 _arg1) public {
        require(msg.value == 0);
        if (~msg.sender != address(this)) {
        }
        if (~owner != msg.sender) {
        }
        if (~authority) {
        }
        require(address(authority).code.length);
        require(call(gasleft() - 0x2c6,local9,0x0,local7,0x64 + local5 - local7,local7,0x20));
    }

    function burn(uint256 _arg0) public {
        require(msg.value == 0);
        if (~msg.sender != address(this)) {
        }
        if (~owner != msg.sender) {
        }
        if (~authority) {
        }
        require(address(authority).code.length);
        require(call(gasleft() - 0x2c6,local10,0x0,local8,0x64 + local6 - local8,local8,0x20));
    }

    function setName(bytes32 _arg0) public {
        require(msg.value == 0);
        if (~msg.sender != address(this)) {
        }
        if (~owner != msg.sender) {
        }
        if (~authority) {
        }
        require(address(authority).code.length);
        require(call(gasleft() - 0x2c6,local9,0x0,local7,0x64 + local5 - local7,local7,0x20));
    }

    function balanceOf(address _arg0) public returns (unknown) {
        require(msg.value == 0);
        return balanceOf[_arg0];
    }

    function stopped() public returns (unknown) {
        require(msg.value == 0);
        return owner / 0x10000000000000000000000000000000000000000;
    }

    function setAuthority(address _arg0) public {
        require(msg.value == 0);
        if (~msg.sender != address(this)) {
        }
        if (~owner != msg.sender) {
        }
        if (~authority) {
        }
        require(address(authority).code.length);
        require(call(gasleft() - 0x2c6,local9,0x0,local7,0x64 + local5 - local7,local7,0x20));
    }

    function owner() public returns (unknown) {
        require(msg.value == 0);
        return owner;
    }

    function symbol() public returns (unknown) {
        require(msg.value == 0);
        return symbol;
    }

    function burn(address _arg0, uint256 _arg1) public {
        require(msg.value == 0);
        if (~msg.sender != address(this)) {
        }
        if (~owner != msg.sender) {
        }
        if (~authority) {
        }
        require(address(authority).code.length);
        require(call(gasleft() - 0x2c6,local9,0x0,local7,0x64 + local5 - local7,local7,0x20));
    }

    function mint(uint256 _arg0) public {
        require(msg.value == 0);
        if (~msg.sender != address(this)) {
        }
        if (~owner != msg.sender) {
        }
        if (~authority) {
        }
        require(address(authority).code.length);
        require(call(gasleft() - 0x2c6,local10,0x0,local8,0x64 + local6 - local8,local8,0x20));
    }

    function transfer(address _arg0, uint256 _arg1) public {
        require(msg.value == 0);
        require((owner / 0x10000000000000000000000000000000000000000) == 0);
        if (~(msg.sender == msg.sender)) {
            if (~(0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff == allowance[msg.sender][msg.sender])) {
                require(allowance[msg.sender][msg.sender] - _arg1 <= allowance[msg.sender][msg.sender]);
            }
            require(balanceOf[msg.sender] - _arg1 <= balanceOf[msg.sender]);
        }
        if (~(msg.sender == msg.sender)) {
            require(allowance[msg.sender][msg.sender] - _arg1 <= allowance[msg.sender][msg.sender]);
        }
        require(balanceOf[msg.sender] - _arg1 <= balanceOf[msg.sender]);
    }

    function push(address _arg0, uint256 _arg1) public {
        require(msg.value == 0);
        require((owner / 0x10000000000000000000000000000000000000000) == 0);
        if (~(msg.sender == msg.sender)) {
            if (~(0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff == allowance[msg.sender][msg.sender])) {
                require(allowance[msg.sender][msg.sender] - _arg1 <= allowance[msg.sender][msg.sender]);
            }
            require(balanceOf[msg.sender] - _arg1 <= balanceOf[msg.sender]);
        }
        if (~(msg.sender == msg.sender)) {
        }
    }

    function move(address _arg0, address _arg1, uint256 _arg2) public {
        require(msg.value == 0);
        require((owner / 0x10000000000000000000000000000000000000000) == 0);
        if (~(_arg0 == msg.sender)) {
            if (~(0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff == allowance[_arg0][msg.sender])) {
            }
        }
        if (~(_arg0 == msg.sender)) {
        }
    }

    function start() public {
        require(msg.value == 0);
        if (~msg.sender != address(this)) {
        }
        if (~owner != msg.sender) {
        }
        if (~authority) {
        }
        require(address(authority).code.length);
        require(call(gasleft() - 0x2c6,local9,0x0,local7,0x64 + local5 - local7,local7,0x20));
    }

    function authority() public returns (unknown) {
        require(msg.value == 0);
        return authority;
    }

    function approve(address _arg0) public {
        require(msg.value == 0);
        require((owner / 0x10000000000000000000000000000000000000000) == 0);
        allowance[msg.sender][_arg0] = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        emit Approval(msg.sender, _arg0, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    }

    function allowance(address _arg0, address _arg1) public returns (unknown) {
        require(msg.value == 0);
        return allowance[_arg0][_arg1];
    }

    function pull(address _arg0, uint256 _arg1) public {
        require(msg.value == 0);
        require((owner / 0x10000000000000000000000000000000000000000) == 0);
        if (~(_arg0 == msg.sender)) {
            if (~(0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff == allowance[_arg0][msg.sender])) {
            }
        }
        if (~(_arg0 == msg.sender)) {
        }
    }

}
