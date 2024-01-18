# ::examples

```out Advanced-Hooks.ts
// Test contract -- factory
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmTz9xerKDRmnQnVkit4ixqmpn2e7x2gnYWTQTxZ4Pszpy
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        require(new Contract(memory[memory[0x40]..memory[0x40]+0x91 + memory[0x40] - memory[0x40]]).value(0x0).address == 0 == 0);
        return;
    }

}

// Token contract -- constructor
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmeWTvuWS7UTUtZyKQFTDTsesoHauftVaUod8SCKsXq19p
pragma solidity 0.7.6;

contract Contract {

    fallback() external payable {
        require(msg.value == 0);
        return (this.code[0x1d:(0x1d+0x74)], memory[0x20], 0x80, memory[0x60]);
    }

}

// Token contract -- deployed bytecode
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmeWTvuWS7UTUtZyKQFTDTsesoHauftVaUod8SCKsXq19p
pragma solidity 0.7.6;

contract Contract {

    event Deposit(uint256 _arg0);

    fallback() external payable {
        emit Deposit(0x3);
        return;
    }

}


```

```out Decode-Bytecode-into-Opcodes.mjs
[
  'PUSH1(0x60)@0 0x60 (96)',
  'PUSH1(0x60)@2 0x40 (64)',
  'MSTORE(0x52)@4',
  'PUSH1(0x60)@5 0x04 (4)',
  'CALLDATASIZE(0x36)@7',
  'LT(0x10)@8',
  'PUSH2(0x61)@9 0x02a5 (677)',
  'JUMPI(0x57)@12',
  'PUSH4(0x63)@13 0xffffffff (4294967295)',
  'PUSH1(0x60)@18 0xe0 (224)',
  'PUSH1(0x60)@20 0x02 (2)',
  'EXP(0xa)@22',
  'PUSH1(0x60)@23 0x00 (0)',
  'CALLDATALOAD(0x35)@25',
  'DIV(0x4)@26',
  'AND(0x16)@27',
  'PUSH4(0x63)@28 0x01ffc9a7 (33540519)',
  'DUP2(0x81)@33',
  'EQ(0x14)@34',
  'PUSH2(0x61)@35 0x02dd (733)',
  'JUMPI(0x57)@38',
  'DUP1(0x80)@39',
  'PUSH4(0x63)@40 0x0519ce79 (85577337)',
  'EQ(0x14)@45',
  'PUSH2(0x61)@46 0x0329 (809)',
  'JUMPI(0x57)@49',
  'DUP1(0x80)@50',
  'PUSH4(0x63)@51 0x0560ff44 (90242884)',
  'EQ(0x14)@56',
  'PUSH2(0x61)@57 0x0358 (856)',
  'JUMPI(0x57)@60',
  'DUP1(0x80)@61',
  'PUSH4(0x63)@62 0x05e45546 (98850118)',
  'EQ(0x14)@67',
  'PUSH2(0x61)@68 0x03f1 (1009)',
  'JUMPI(0x57)@71',
  'DUP1(0x80)@72',
  'PUSH4(0x63)@73 0x06fdde03 (117300739)',
  'EQ(0x14)@78',
  'PUSH2(0x61)@79 0x0416 (1046)',
  'JUMPI(0x57)@82',
  'DUP1(0x80)@83',
  'PUSH4(0x63)@84 0x095ea7b3 (157198259)',
  'EQ(0x14)@89',
  'PUSH2(0x61)@90 0x0429 (1065)',
  'JUMPI(0x57)@93',
  'DUP1(0x80)@94',
  'PUSH4(0x63)@95 0x0a0f8168 (168788328)',
  'EQ(0x14)@100',
  'PUSH2(0x61)@101 0x044b (1099)',
  'JUMPI(0x57)@104',
  'DUP1(0x80)@105',
  'PUSH4(0x63)@106 0x0e583df0 (240664048)',
  'EQ(0x14)@111',
  'PUSH2(0x61)@112 0x045e (1118)',
  'JUMPI(0x57)@115',
  'DUP1(0x80)@116',
  'PUSH4(0x63)@117 0x14001f4c (335552332)',
  'EQ(0x14)@122',
  'PUSH2(0x61)@123 0x0471 (1137)',
  'JUMPI(0x57)@126',
  'DUP1(0x80)@127',
  'PUSH4(0x63)@128 0x18160ddd (404098525)',
  'EQ(0x14)@133',
  'PUSH2(0x61)@134 0x0490 (1168)',
  'JUMPI(0x57)@137',
  'DUP1(0x80)@138',
  'PUSH4(0x63)@139 0x183a7947 (406485319)',
  'EQ(0x14)@144',
  'PUSH2(0x61)@145 0x04a3 (1187)',
  'JUMPI(0x57)@148',
  'DUP1(0x80)@149',
  'PUSH4(0x63)@150 0x1940a936 (423668022)',
  'EQ(0x14)@155',
  'PUSH2(0x61)@156 0x04b6 (1206)',
  'JUMPI(0x57)@159',
  'DUP1(0x80)@160',
  'PUSH4(0x63)@161 0x19c2f201 (432206337)',
  'EQ(0x14)@166',
  'PUSH2(0x61)@167 0x04cc (1228)',
  'JUMPI(0x57)@170',
  'DUP1(0x80)@171',
  'PUSH4(0x63)@172 0x21717ebf (561086143)',
  'EQ(0x14)@177',
  'PUSH2(0x61)@178 0x04df (1247)',
  'JUMPI(0x57)@181',
  'DUP1(0x80)@182',
  'PUSH4(0x63)@183 0x23b872dd (599290589)',
  'EQ(0x14)@188',
  'PUSH2(0x61)@189 0x04f2 (1266)',
  'JUMPI(0x57)@192',
  'DUP1(0x80)@193',
  'PUSH4(0x63)@194 0x24e7a38a (619160458)',
  'EQ(0x14)@199',
  'PUSH2(0x61)@200 0x051a (1306)',
  'JUMPI(0x57)@203',
  'DUP1(0x80)@204',
  'PUSH4(0x63)@205 0x27d7874c (668436300)',
  'EQ(0x14)@210',
  'PUSH2(0x61)@211 0x0539 (1337)',
  ... 6780 more items
]

```

```out Decompile-a-Contract.mjs
// SPDX-License-Identifier: UNLICENSED
// Metadata bzzr0://deb4c2ccab3c2fdca32ab3f46728389c2fe2c165d5fafa07661e4e004f6c344a
pragma solidity ;

contract Contract {

    event Deposit(address indexed _arg0, uint256 _arg1);
    event Approval(address indexed _arg0, address indexed _arg1, uint256 _arg2);
    event Transfer(address indexed _arg0, address indexed _arg1, uint256 _arg2);
    event Withdrawal(address indexed _arg0, uint256 _arg1);

    mapping (address => unknown) public balanceOf;
    mapping (address => mapping (address => unknown)) public allowance;

    unknown var1__1; // Slot #0
    unknown public decimals; // Slot #2
    unknown var3__3; // Slot #1

    function() external payable {
        if (~(msg.data.length < 0x4)) {
            undefined local0 = 0xffffffff & msg.data / 0x100000000000000000000000000000000000000000000000000000000; // #refs 10
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
                            if (msg.sig == 2e1a7d4d) {
                                $2e1a7d4d();
                            } else {
                                if (msg.sig == 313ce567) {
                                    $313ce567();
                                } else {
                                    if (msg.sig == 70a08231) {
                                        $70a08231();
                                    } else {
                                        if (msg.sig == 95d89b41) {
                                            $95d89b41();
                                        } else {
                                            if (msg.sig == a9059cbb) {
                                                $a9059cbb();
                                            } else {
                                                if (msg.sig == d0e30db0) {
                                                    $d0e30db0();
                                                } else {
                                                    if (msg.sig == dd62ed3e) {
                                                        $dd62ed3e();
                                                    } else {
                                                        storage[keccak256(msg.sender, 0x3)] += msg.value;
                                                        emit Deposit(0xffffffffffffffffffffffffffffffffffffffff & msg.sender, msg.value);
                                                        return;
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
        storage[keccak256(msg.sender, 0x3)] += msg.value;
        emit Deposit(0xffffffffffffffffffffffffffffffffffffffff & msg.sender, msg.value);
        return;
    }

    function name() public {
        require(msg.value == 0);
        undefined local1 = 0x0; // #refs 2
        undefined local5 = memory[0x40]; // #refs 34
        undefined local7 = (0x100 * (0x1 & var_1) == 0 - 0x1 & var_1) / 0x2; // #refs 1
        if (~local7 == 0) {
            if (~(0x1f < local7)) {
                undefined local11 = memory[0x40]; // #refs 2
                undefined local12 = 0x20 + local11; // #refs 1
                undefined local13 = memory[local5]; // #refs 22
                undefined local14 = 0x20 + local12; // #refs 11
                undefined local15 = 0x20 + local5; // #refs 11
                undefined local16 = 0x0; // #refs 3
                if (~(local16 < local13) == 0) {
                    undefined local17 = local16 + 0x20; // #refs 3
                    if (~(local17 < local13) == 0) {
                        undefined local18 = local17 + 0x20; // #refs 3
                        if (~(local18 < local13) == 0) {
                            undefined local19 = local18 + 0x20; // #refs 3
                            if (~(local19 < local13) == 0) {
                                undefined local20 = local19 + 0x20; // #refs 3
                                if (~(local20 < local13) == 0) {
                                    undefined local21 = local20 + 0x20; // #refs 3
                                    if (~(local21 < local13) == 0) {
                                        undefined local22 = local21 + 0x20; // #refs 3
                                        if (~(local22 < local13) == 0) {
                                            undefined local23 = local22 + 0x20; // #refs 3
                                            if (~(local23 < local13) == 0) {
                                                undefined local24 = local23 + 0x20; // #refs 3
                                                if (~(local24 < local13) == 0) {
                                                    undefined local25 = local24 + 0x20; // #refs 3
                                                    if (~(local25 < local13) == 0) {
                                                        undefined local26 = local25 + 0x20; // #refs 3
                                                        if (~(local26 < local13) == 0) {
                                                        }
                                                        undefined local27 = 0x1f & local13; // #refs 2
                                                        if (~local27 == 0) {
                                                            return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local27 - memory[0x40])];
                                                        }
                                                        return memory[memory[0x40]:(memory[0x40]+local13 + local14 - memory[0x40])];
                                                    }
                                                    undefined local26 = 0x1f & local13; // #refs 2
                                                    if (~local26 == 0) {
                                                        return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local26 - memory[0x40])];
                                                    }
                                                    return memory[memory[0x40]:(memory[0x40]+local13 + local14 - memory[0x40])];
                                                }
                                                undefined local25 = 0x1f & local13; // #refs 2
                                                if (~local25 == 0) {
                                                    return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local25 - memory[0x40])];
                                                }
                                                return memory[memory[0x40]:(memory[0x40]+local13 + local14 - memory[0x40])];
                                            }
                                            undefined local24 = 0x1f & local13; // #refs 2
                                            if (~local24 == 0) {
                                                return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local24 - memory[0x40])];
                                            }
                                            return memory[memory[0x40]:(memory[0x40]+local13 + local14 - memory[0x40])];
                                        }
                                        undefined local23 = 0x1f & local13; // #refs 2
                                        if (~local23 == 0) {
                                            return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local23 - memory[0x40])];
                                        }
                                        return memory[memory[0x40]:(memory[0x40]+local13 + local14 - memory[0x40])];
                                    }
                                    undefined local22 = 0x1f & local13; // #refs 2
                                    if (~local22 == 0) {
                                        return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local22 - memory[0x40])];
                                    }
                                }
                                undefined local21 = 0x1f & local13; // #refs 2
                                if (~local21 == 0) {
                                }
                            }
                            undefined local20 = 0x1f & local13; // #refs 2
                            if (~local20 == 0) {
                            }
                        }
                        undefined local19 = 0x1f & local13; // #refs 2
                        if (~local19 == 0) {
                        }
                    }
                    undefined local18 = 0x1f & local13; // #refs 2
                    if (~local18 == 0) {
                    }
                }
                undefined local17 = 0x1f & local13; // #refs 2
                if (~local17 == 0) {
                }
            }
            undefined local11 = 0x20 + local5 + local7; // #refs 32
            if (~(local11 > 0x20 + 0x20 + local5)) {
                undefined local13 = memory[0x40]; // #refs 2
                undefined local14 = 0x20 + local13; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + local5)) {
                undefined local15 = memory[0x40]; // #refs 2
                undefined local16 = 0x20 + local15; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local17 = memory[0x40]; // #refs 2
                undefined local18 = 0x20 + local17; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local19 = memory[0x40]; // #refs 2
                undefined local20 = 0x20 + local19; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local21 = memory[0x40]; // #refs 2
                undefined local22 = 0x20 + local21; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local23 = memory[0x40]; // #refs 2
                undefined local24 = 0x20 + local23; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local25 = memory[0x40]; // #refs 2
                undefined local26 = 0x20 + local25; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local27 = memory[0x40]; // #refs 2
                undefined local28 = 0x20 + local27; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local29 = memory[0x40]; // #refs 2
                undefined local30 = 0x20 + local29; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local31 = memory[0x40]; // #refs 2
                undefined local32 = 0x20 + local31; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
            }
        }
    }

    function approve(address _arg0, uint256 _arg1) public returns (uint256) {
        require(msg.value == 0);
        undefined local1 = 0x4; // #refs 1
        undefined local3 = msg.data[0x20 + local1]; // #refs 2
        undefined local6 = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[local1]; // #refs 1
        allowance[msg.sender][_arg0] = local3;
        emit Approval(0xffffffffffffffffffffffffffffffffffffffff & msg.sender, 0xffffffffffffffffffffffffffffffffffffffff & local6, local3);
        return 0x1;
    }

    function totalSupply() public returns (uint256) {
        require(msg.value == 0);
        return address(this).balance;
    }

    function transferFrom(address _arg0, address _arg1, uint256 _arg2) public returns (uint256) {
        require(msg.value == 0);
        undefined local1 = 0x4; // #refs 1
        undefined local4 = msg.data[0x20 + 0x20 + local1]; // #refs 26
        undefined local5 = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[local1]; // #refs 14
        require((balanceOf[_arg0] < local4) == 0 == 0 == 0);
        if (~(0xffffffffffffffffffffffffffffffffffffffff & local5) != (0xffffffffffffffffffffffffffffffffffffffff & msg.sender) == 0) {
            if (~allowance[_arg0][msg.sender] != 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff == 0) {
                require((allowance[_arg0][msg.sender] < local4) == 0 == 0 == 0);
                storage[keccak256(msg.sender, keccak256(_arg0, 0x4))] -= _arg2;
                storage[keccak256(_arg0, 0x3)] -= _arg2;
                undefined local27 = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[0x20 + local1]; // #refs 1
                storage[keccak256(_arg1, 0x3)] += _arg2;
                emit Transfer(0xffffffffffffffffffffffffffffffffffffffff & local5, 0xffffffffffffffffffffffffffffffffffffffff & local27, local4);
                return 0x1;
            }
            storage[keccak256(_arg0, 0x3)] -= _arg2;
            undefined local17 = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[0x20 + local1]; // #refs 1
            storage[keccak256(_arg1, 0x3)] += _arg2;
            emit Transfer(0xffffffffffffffffffffffffffffffffffffffff & local5, 0xffffffffffffffffffffffffffffffffffffffff & local17, local4);
            return 0x1;
        }
        if (~(0xffffffffffffffffffffffffffffffffffffffff & local5) != (0xffffffffffffffffffffffffffffffffffffffff & msg.sender) == 0) {
            require((allowance[_arg0][msg.sender] < local4) == 0 == 0 == 0);
            storage[keccak256(msg.sender, keccak256(_arg0, 0x4))] -= _arg2;
            storage[keccak256(_arg0, 0x3)] -= _arg2;
            undefined local23 = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[0x20 + local1]; // #refs 1
            storage[keccak256(_arg1, 0x3)] += _arg2;
            emit Transfer(0xffffffffffffffffffffffffffffffffffffffff & local5, 0xffffffffffffffffffffffffffffffffffffffff & local23, local4);
            return 0x1;
        }
        storage[keccak256(_arg0, 0x3)] -= _arg2;
        undefined local13 = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[0x20 + local1]; // #refs 1
        storage[keccak256(_arg1, 0x3)] += _arg2;
        emit Transfer(0xffffffffffffffffffffffffffffffffffffffff & local5, 0xffffffffffffffffffffffffffffffffffffffff & local13, local4);
        return 0x1;
    }

    function withdraw(uint256 _arg0) public {
        require(msg.value == 0);
        undefined local1 = 0x4; // #refs 1
        undefined local2 = msg.data[local1]; // #refs 6
        require((balanceOf[msg.sender] < local2) == 0 == 0 == 0);
        storage[keccak256(msg.sender, 0x3)] -= _arg0;
        undefined local9 = memory[0x40]; // #refs 1
        require(call(local2 == 0 * 0x8fc,0xffffffffffffffffffffffffffffffffffffffff & msg.sender,local2,local9,memory[0x40] - local9,local9,0x0) == 0 == 0);
        emit Withdrawal(0xffffffffffffffffffffffffffffffffffffffff & msg.sender, local2);
        return;
    }

    function decimals() public returns (unknown) {
        require(msg.value == 0);
        return decimals;
    }

    function balanceOf(address _arg0) public returns (unknown) {
        require(msg.value == 0);
        undefined local1 = 0x4; // #refs 1
        return balanceOf[_arg0];
    }

    function symbol() public {
        require(msg.value == 0);
        undefined local1 = 0x1; // #refs 2
        undefined local5 = memory[0x40]; // #refs 34
        undefined local7 = (0x100 * (0x1 & var_3) == 0 - 0x1 & var_3) / 0x2; // #refs 1
        if (~local7 == 0) {
            if (~(0x1f < local7)) {
                undefined local11 = memory[0x40]; // #refs 2
                undefined local12 = 0x20 + local11; // #refs 1
                undefined local13 = memory[local5]; // #refs 22
                undefined local14 = 0x20 + local12; // #refs 11
                undefined local15 = 0x20 + local5; // #refs 11
                undefined local16 = 0x0; // #refs 3
                if (~(local16 < local13) == 0) {
                    undefined local17 = local16 + 0x20; // #refs 3
                    if (~(local17 < local13) == 0) {
                        undefined local18 = local17 + 0x20; // #refs 3
                        if (~(local18 < local13) == 0) {
                            undefined local19 = local18 + 0x20; // #refs 3
                            if (~(local19 < local13) == 0) {
                                undefined local20 = local19 + 0x20; // #refs 3
                                if (~(local20 < local13) == 0) {
                                    undefined local21 = local20 + 0x20; // #refs 3
                                    if (~(local21 < local13) == 0) {
                                        undefined local22 = local21 + 0x20; // #refs 3
                                        if (~(local22 < local13) == 0) {
                                            undefined local23 = local22 + 0x20; // #refs 3
                                            if (~(local23 < local13) == 0) {
                                                undefined local24 = local23 + 0x20; // #refs 3
                                                if (~(local24 < local13) == 0) {
                                                    undefined local25 = local24 + 0x20; // #refs 3
                                                    if (~(local25 < local13) == 0) {
                                                        undefined local26 = local25 + 0x20; // #refs 3
                                                        if (~(local26 < local13) == 0) {
                                                        }
                                                        undefined local27 = 0x1f & local13; // #refs 2
                                                        if (~local27 == 0) {
                                                            return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local27 - memory[0x40])];
                                                        }
                                                        return memory[memory[0x40]:(memory[0x40]+local13 + local14 - memory[0x40])];
                                                    }
                                                    undefined local26 = 0x1f & local13; // #refs 2
                                                    if (~local26 == 0) {
                                                        return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local26 - memory[0x40])];
                                                    }
                                                    return memory[memory[0x40]:(memory[0x40]+local13 + local14 - memory[0x40])];
                                                }
                                                undefined local25 = 0x1f & local13; // #refs 2
                                                if (~local25 == 0) {
                                                    return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local25 - memory[0x40])];
                                                }
                                                return memory[memory[0x40]:(memory[0x40]+local13 + local14 - memory[0x40])];
                                            }
                                            undefined local24 = 0x1f & local13; // #refs 2
                                            if (~local24 == 0) {
                                                return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local24 - memory[0x40])];
                                            }
                                            return memory[memory[0x40]:(memory[0x40]+local13 + local14 - memory[0x40])];
                                        }
                                        undefined local23 = 0x1f & local13; // #refs 2
                                        if (~local23 == 0) {
                                            return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local23 - memory[0x40])];
                                        }
                                        return memory[memory[0x40]:(memory[0x40]+local13 + local14 - memory[0x40])];
                                    }
                                    undefined local22 = 0x1f & local13; // #refs 2
                                    if (~local22 == 0) {
                                        return memory[memory[0x40]:(memory[0x40]+0x20 + local13 + local14 - local22 - memory[0x40])];
                                    }
                                }
                                undefined local21 = 0x1f & local13; // #refs 2
                                if (~local21 == 0) {
                                }
                            }
                            undefined local20 = 0x1f & local13; // #refs 2
                            if (~local20 == 0) {
                            }
                        }
                        undefined local19 = 0x1f & local13; // #refs 2
                        if (~local19 == 0) {
                        }
                    }
                    undefined local18 = 0x1f & local13; // #refs 2
                    if (~local18 == 0) {
                    }
                }
                undefined local17 = 0x1f & local13; // #refs 2
                if (~local17 == 0) {
                }
            }
            undefined local11 = 0x20 + local5 + local7; // #refs 32
            if (~(local11 > 0x20 + 0x20 + local5)) {
                undefined local13 = memory[0x40]; // #refs 2
                undefined local14 = 0x20 + local13; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + local5)) {
                undefined local15 = memory[0x40]; // #refs 2
                undefined local16 = 0x20 + local15; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local17 = memory[0x40]; // #refs 2
                undefined local18 = 0x20 + local17; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local19 = memory[0x40]; // #refs 2
                undefined local20 = 0x20 + local19; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local21 = memory[0x40]; // #refs 2
                undefined local22 = 0x20 + local21; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local23 = memory[0x40]; // #refs 2
                undefined local24 = 0x20 + local23; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local25 = memory[0x40]; // #refs 2
                undefined local26 = 0x20 + local25; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local27 = memory[0x40]; // #refs 2
                undefined local28 = 0x20 + local27; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local29 = memory[0x40]; // #refs 2
                undefined local30 = 0x20 + local29; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
                undefined local31 = memory[0x40]; // #refs 2
                undefined local32 = 0x20 + local31; // #refs 1
            }
            if (~(local11 > 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + 0x20 + local5)) {
            }
        }
    }

    function transfer(address _arg0, uint256 _arg1) public returns (uint256) {
        require(msg.value == 0);
        undefined local1 = 0x4; // #refs 1
        undefined local3 = 0xffffffffffffffffffffffffffffffffffffffff & msg.data[local1]; // #refs 8
        undefined local4 = msg.data[0x20 + local1]; // #refs 27
        address local5 = msg.sender; // #refs 14
        require((balanceOf[msg.sender] < local4) == 0 == 0 == 0);
        if (~(0xffffffffffffffffffffffffffffffffffffffff & local5) != (0xffffffffffffffffffffffffffffffffffffffff & msg.sender) == 0) {
            if (~allowance[msg.sender][msg.sender] != 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff == 0) {
                require((allowance[msg.sender][msg.sender] < local4) == 0 == 0 == 0);
                storage[keccak256(msg.sender, keccak256(msg.sender, 0x4))] -= _arg1;
                storage[keccak256(msg.sender, 0x3)] -= _arg1;
                storage[keccak256(_arg0, 0x3)] += _arg1;
                emit Transfer(0xffffffffffffffffffffffffffffffffffffffff & local5, 0xffffffffffffffffffffffffffffffffffffffff & local3, local4);
                return 0x1;
            }
            storage[keccak256(msg.sender, 0x3)] -= _arg1;
            storage[keccak256(_arg0, 0x3)] += _arg1;
            emit Transfer(0xffffffffffffffffffffffffffffffffffffffff & local5, 0xffffffffffffffffffffffffffffffffffffffff & local3, local4);
            return 0x1;
        }
        if (~(0xffffffffffffffffffffffffffffffffffffffff & local5) != (0xffffffffffffffffffffffffffffffffffffffff & msg.sender) == 0) {
            require((allowance[msg.sender][msg.sender] < local4) == 0 == 0 == 0);
            storage[keccak256(msg.sender, keccak256(msg.sender, 0x4))] -= _arg1;
            storage[keccak256(msg.sender, 0x3)] -= _arg1;
            storage[keccak256(_arg0, 0x3)] += _arg1;
            emit Transfer(0xffffffffffffffffffffffffffffffffffffffff & local5, 0xffffffffffffffffffffffffffffffffffffffff & local3, local4);
            return 0x1;
        }
        storage[keccak256(msg.sender, 0x3)] -= _arg1;
        storage[keccak256(_arg0, 0x3)] += _arg1;
        emit Transfer(0xffffffffffffffffffffffffffffffffffffffff & local5, 0xffffffffffffffffffffffffffffffffffffffff & local3, local4);
        return 0x1;
    }

    function deposit() public payable {
        storage[keccak256(msg.sender, 0x3)] += msg.value;
        emit Deposit(0xffffffffffffffffffffffffffffffffffffffff & msg.sender, msg.value);
        return;
    }

    function allowance(address _arg0, address _arg1) public returns (unknown) {
        require(msg.value == 0);
        undefined local1 = 0x4; // #refs 1
        return allowance[_arg0][_arg1];
    }

}


```

```out Detect-Functions-Events-ERCs.mjs
functions [
  'createPromoKitty(uint256,address)',
  'setNewAddress(address)',
  'supportsInterface(bytes4)',
  'cfoAddress()',
  'tokenMetadata(uint256,string)',
  'promoCreatedCount()',
  'name()',
  'approve(address,uint256)',
  'ceoAddress()',
  'GEN0_STARTING_PRICE()',
  'setSiringAuctionAddress(address)',
  'totalSupply()',
  'isPregnant(uint256)',
  'GEN0_AUCTION_DURATION()',
  'siringAuction()',
  'transferFrom(address,address,uint256)',
  'setGeneScienceAddress(address)',
  'setCEO(address)',
  'setCOO(address)',
  'createSaleAuction(uint256,uint256,uint256,uint256)',
  'unpause()',
  'canBreedWith(uint256,uint256)',
  'createSiringAuction(uint256,uint256,uint256,uint256)',
  'setAutoBirthFee(uint256)',
  'approveSiring(address,uint256)',
  'setCFO(address)',
  'setSecondsPerBlock(uint256)',
  'paused()',
  'withdrawBalance()',
  'ownerOf(uint256)',
  'GEN0_CREATION_LIMIT()',
  'newContractAddress()',
  'setSaleAuctionAddress(address)',
  'balanceOf(address)',
  'secondsPerBlock()',
  'pause()',
  'tokensOfOwner(address)',
  'giveBirth(uint256)',
  'withdrawAuctionBalances()',
  'symbol()',
  'cooldowns(uint256)',
  'transfer(address,uint256)',
  'cooAddress()',
  'autoBirthFee()',
  'erc721Metadata()',
  'createGen0Auction(uint256)',
  'isReadyToBreed(uint256)',
  'PROMO_CREATION_LIMIT()',
  'setMetadataAddress(address)',
  'saleAuction()',
  'getKitty(uint256)',
  'bidOnSiringAuction(uint256,uint256)',
  'gen0CreatedCount()',
  'geneScience()',
  'breedWithAuto(uint256,uint256)'
]
events [
  'Approval(address,address,uint256)',
  'Transfer(address,address,uint256)',
  'Birth(address,uint256,uint256,uint256,uint256)',
  'ContractUpgrade(address)'
]
isERC 165 true

```

```out Extract-Contract-Metadata.mjs
Metadata {
  protocol: 'ipfs',
  hash: 'QmVH44HYS7Kxd5z769QYrhS9tzM4cYcXAeq1h6wcEBEqVK',
  solc: '0.6.12'
}

```

```out Simple-Hook.mjs
top Prop { symbol: 'tx.gasprice', type: 'uint', tag: 'Prop' }

```

```out Use-with-Import.mjs
// SPDX-License-Identifier: UNLICENSED
contract Contract {

    function() external payable {
        return;
    }

}


```

```out Use-with-Require.js
// SPDX-License-Identifier: UNLICENSED
contract Contract {

    function() external payable {
        return;
    }

}


```
