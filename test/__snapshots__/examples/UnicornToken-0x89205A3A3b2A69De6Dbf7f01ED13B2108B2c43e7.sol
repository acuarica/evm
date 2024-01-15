// SPDX-License-Identifier: UNLICENSED
contract Contract {

    event Transfer(address indexed _arg0, address indexed _arg1, uint256 _arg2);
    event FrozenFunds(address _arg0, bool _arg1);

mapping (address => unknown) public balanceOf;
mapping (address => unknown) public frozenAccount;
mapping (address => mapping (address => uint256)) public allowance;
mapping (address => mapping (address => unknown)) mapping4;

unknown var1__1; // Slot #1
unknown public totalSupply; // Slot #4
unknown public decimals; // Slot #3
unknown public owner; // Slot #0
unknown var5__5; // Slot #2
    function() external payable {
        if (~msg.data.length == 0) {
            if (msg.sig == 06fdde03) {
                $06fdde03();
            } else {
                if (msg.sig == 095ea7b3) {
                    $095ea7b3();
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
                                if (msg.sig == 70a08231) {
                                    $70a08231();
                                } else {
                                    if (msg.sig == 79c65068) {
                                        $79c65068();
                                    } else {
                                        if (msg.sig == 8da5cb5b) {
                                            $8da5cb5b();
                                        } else {
                                            if (msg.sig == 95d89b41) {
                                                $95d89b41();
                                            } else {
                                                if (msg.sig == a9059cbb) {
                                                    $a9059cbb();
                                                } else {
                                                    if (msg.sig == b414d4b6) {
                                                        $b414d4b6();
                                                    } else {
                                                        if (msg.sig == dc3080f2) {
                                                            $dc3080f2();
                                                        } else {
                                                            if (msg.sig == dd62ed3e) {
                                                                $dd62ed3e();
                                                            } else {
                                                                if (msg.sig == e724529c) {
                                                                    $e724529c();
                                                                } else {
                                                                    if (msg.sig == f2fde38b) {
                                                                        $f2fde38b();
                                                                    } else {
                                                                        throw('JUMP(0x56)@192 destination should be JUMPDEST@2 but found '0x60'');
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
        throw('JUMP(0x56)@192 destination should be JUMPDEST@2 but found '0x60'');
    }

    function name() public payable {
        if (~((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
            if (~(0x1f < (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                    return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+0x20 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - (0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
                }
                return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+(var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0xa0)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                    return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+0x20 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - (0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
                }
                return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+(var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0xc0)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                    return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+0x20 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - (0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
                }
                return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+(var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0xe0)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                    return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+0x20 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - (0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
                }
                return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+(var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0x100)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                    return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+0x20 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - (0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
                }
                return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+(var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0x120)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                    return memory[0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20:(0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20+0x20 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x20 + 0x20 + 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20 - (0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) - 0x80 + 0x20 * ((var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 + 0x1f) / 0x20)];
                }
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0x140)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                }
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0x160)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                }
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0x180)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                }
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0x1a0)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                }
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0x1c0)) {
                if (~(0x1f & (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2) == 0) {
                }
            }
            if (~(0x80 + (var_1 & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff + 0x100 * (0x1 & var_1) == 0) / 0x2 > 0x1e0)) {
            }
        }
    }

    function approve(address _arg0, uint256 _arg1) public payable returns (uint256) {
        allowance[msg.sender][_arg0] = _arg1;
        return 0x0;
    }

    function totalSupply() public view payable returns (unknown) {
        return totalSupply;
    }

    function transferFrom(address _arg0, address _arg1, uint256 _arg2) public payable returns (uint256) {
        if (~(balanceOf[_arg0] >= _arg2)) {
            throw('JUMP(0x56)@402 destination should be JUMPDEST@2 but found '0x60'');
        }
        if (~(balanceOf[_arg1] + _arg2 >= balanceOf[_arg1])) {
            throw('JUMP(0x56)@1448 destination should be JUMPDEST@2 but found '0x60'');
        }
        if (~frozenAccount[_arg0] == 0) {
            throw('JUMP(0x56)@1483 destination should be JUMPDEST@2 but found '0x60'');
        }
        if (~(_arg2 + mapping9[_arg0][msg.sender] <= allowance[_arg0][msg.sender])) {
            throw('JUMP(0x56)@1549 destination should be JUMPDEST@2 but found '0x60'');
        }
        storage[keccak256(_arg0, 0x5)] -= _arg2;
        storage[keccak256(_arg1, 0x5)] += _arg2;
        storage[keccak256(msg.sender, keccak256(_arg0, 0x8))] += _arg2;
        emit Transfer(msg.sender, _arg1, _arg2);
        return 0x0;
    }

    function decimals() public view payable returns (unknown) {
        return decimals;
    }

    function balanceOf(address _arg0) public view payable returns (unknown) {
        return balanceOf[_arg0];
    }

    function mintToken(address _arg0, uint256 _arg1) public payable {
        if (~(owner == msg.sender)) {
            throw('JUMP(0x56)@474 destination should be JUMPDEST@2 but found '0x60'');
        }
        storage[keccak256(_arg0, 0x5)] += _arg1;
        totalSupply += _arg1;
        emit Transfer(owner, _arg0, _arg1);
        return;
    }

    function owner() public view payable returns (unknown) {
        return owner;
    }

    function symbol() public payable {
        if (~((var_5 & 0x100 * (var_5 & 0x1) == 0 + 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff) / 0x2) == 0) {
            if (~(0x1f < (var_5 & 0x100 * (var_5 & 0x1) == 0 + 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff) / 0x2)) {
            }
        }
    }

    function transfer(address _arg0, uint256 _arg1) public payable {
        if (~(balanceOf[msg.sender] >= _arg1)) {
            throw('JUMP(0x56)@628 destination should be JUMPDEST@2 but found '0x60'');
        }
        if (~(_arg1 + balanceOf[_arg0] >= balanceOf[_arg0])) {
            throw('JUMP(0x56)@1029 destination should be JUMPDEST@2 but found '0x60'');
        }
        if (~frozenAccount[msg.sender] == 0) {
            throw('JUMP(0x56)@1067 destination should be JUMPDEST@2 but found '0x60'');
        }
        storage[keccak256(msg.sender, 0x5)] -= _arg1;
        storage[keccak256(_arg0, 0x5)] += _arg1;
        emit Transfer(msg.sender, _arg0, _arg1);
        return;
    }

    function frozenAccount(address _arg0) public view payable returns (unknown) {
        return frozenAccount[_arg0];
    }

    function dc3080f2() public view payable returns (unknown) {
        return mapping9[_arg0][_arg1];
    }

    function allowance(address _arg0, address _arg1) public view payable returns (unknown) {
        return allowance[_arg0][_arg1];
    }

    function freezeAccount(address _arg0, bool _arg1) public payable {
        if (~(owner == msg.sender)) {
            throw('JUMP(0x56)@765 destination should be JUMPDEST@2 but found '0x60'');
        }
        storage[keccak256(_arg0, 0x6)] = _arg1 | 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00 & storage[keccak256(_arg0, 0x6)];
        emit FrozenFunds(_arg0, _arg1);
        return;
    }

    function transferOwnership(address _arg0) public payable {
        if (~(owner == msg.sender)) {
            throw('JUMP(0x56)@798 destination should be JUMPDEST@2 but found '0x60'');
        }
        owner = _arg0 | 0xffffffffffffffffffffffff0000000000000000000000000000000000000000 & owner;
        return;
    }

}
