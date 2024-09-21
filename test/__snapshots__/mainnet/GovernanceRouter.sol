// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmRjCGNVER4kcqSX9zcx1VRisTy771uRr6PdxsnNSP8uwh
pragma solidity 0.7.6;

contract Contract {

    event e1cc453e5e6d48a5e3dd7dc6c72117211d2bea20fbb91fd980ebc3e7f73fe546;
    event 5397c02652a688dd1cac8544f233b3daaf96d7a9f974af80b70ab1538359e261;

    mapping (unknown => unknown) mapping1;

    unknown public governor; // Slot #3
    uint256 var2__2; // Slot #1
    unknown var3__3; // Slot #6
    unknown var4__4; // Slot #4
    unknown var5__5; // Slot #2

    fallback() external payable {
        require(msg.value == 0);
        if (msg.data.length >= 0x4) {
            if (0x63706be3 <= msg.data >>> 0xe0) {
                if (0xde314b19 <= msg.data >>> 0xe0) {
                    if (0xe8c6f83a <= msg.data >>> 0xe0) {
                        if (msg.sig == e8c6f83a) {
                            $e8c6f83a();
                        } else {
                            if (msg.sig == f05151df) {
                                $f05151df();
                            } else {
                                if (msg.sig == ffa1ad74) {
                                    $ffa1ad74();
                                } else {
                                    revert();
                                }
                            }
                        }
                    }
                    if (msg.sig == de314b19) {
                        $de314b19();
                    } else {
                        if (msg.sig == e5429298) {
                            $e5429298();
                        } else {
                            if (msg.sig == e6b3d949) {
                                $e6b3d949();
                            } else {
                                revert();
                            }
                        }
                    }
                }
                if (0x670a43c4 <= msg.data >>> 0xe0) {
                    if (msg.sig == 670a43c4) {
                        $670a43c4();
                    } else {
                        if (msg.sig == 8d3638f4) {
                            $8d3638f4();
                        } else {
                            if (msg.sig == db2021ae) {
                                $db2021ae();
                            } else {
                                revert();
                            }
                        }
                    }
                }
                if (msg.sig == 63706be3) {
                    $63706be3();
                } else {
                    if (msg.sig == 66cf8fab) {
                        $66cf8fab();
                    } else {
                        revert();
                    }
                }
            }
            if (0x41bdc8b5 <= msg.data >>> 0xe0) {
                if (0x4fedbbb5 <= msg.data >>> 0xe0) {
                    if (msg.sig == 4fedbbb5) {
                        $4fedbbb5();
                    } else {
                        if (msg.sig == 5585416c) {
                            $5585416c();
                        } else {
                            if (msg.sig == 56d5d475) {
                                $56d5d475();
                            } else {
                                revert();
                            }
                        }
                    }
                }
                if (msg.sig == 41bdc8b5) {
                    $41bdc8b5();
                } else {
                    if (msg.sig == 4626abee) {
                        $4626abee();
                    } else {
                        if (msg.sig == 485cc955) {
                            $485cc955();
                        } else {
                            revert();
                        }
                    }
                }
            }
            if (0x2ead72f6 <= msg.data >>> 0xe0) {
                if (msg.sig == 2ead72f6) {
                    $2ead72f6();
                } else {
                    if (msg.sig == 316c92b6) {
                        $316c92b6();
                    } else {
                        if (msg.sig == 3339df96) {
                            $3339df96();
                        } else {
                            revert();
                        }
                    }
                }
            }
            if (msg.sig == 0c340a24) {
                $0c340a24();
            } else {
                if (msg.sig == 0ce21995) {
                    $0ce21995();
                } else {
                    revert();
                }
            }
        }
        revert();
    }

    function e8c6f83a(/*no signature*/) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 == _arg0);
        require(msg.sender == governor, "! called by governor");
        if (var_2) {
            require(var_2 > block.timestamp, "in recovery");
            log(0xe1cc453e5e6d48a5e3dd7dc6c72117211d2bea20fbb91fd980ebc3e7f73fe546, _arg0, mapping6[_arg0], _arg1);
            if (_arg1 == 0) {
                mapping6[_arg0] = 0x0;
                if (0x0 < var_3) {
                    if (0x0 >= var_3) {
                        revert('Invalid instruction (0xfe)');
                    }
                    if (storage[keccak256(0x6)] == _arg0) {
                        if (0x0 >= var_3) {
                            revert('Invalid instruction (0xfe)');
                        }
                        storage[keccak256(0x6)] = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000 & storage[keccak256(0x6)];
                        if (0x1 == 0x3) {
                            if (0x25 == 0x25) {
                                require(0xffffffffff != 0x3, "Validity assertion failed");
                                require(0x30000000000000000000000a0000000000000000000000025000000 != 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000, 0x8c379a0, 0x20, 0x28, this.code[0x383a:(0x383a+0x28)], memory[0x129]);
                                require(0xffffffffff != 0x3, 0x8c379a0, 0x20, 0x2b, this.code[0x3862:(0x3862+0x2b)], memory[0x129]);
                                require(address(var_4).code.length);
                                require(staticcall(gasleft(),local57,local55,0x4 + memory[0x40] - local55,local55,0x20));
                                require(0x10a + returndatasize() - 0x10a >= 0x20);
                                require(memory[0x10a] == memory[0x10a]);
                                if (0x0 < var_3) {
                                    if (0x0 >= var_3) {
                                        revert('Invalid instruction (0xfe)');
                                    }
                                    if (storage[keccak256(0x6)] != 0x0) {
                                        if (0x0 >= var_3) {
                                            revert('Invalid instruction (0xfe)');
                                        }
                                        if (0x0 >= var_3) {
                                            revert('Invalid instruction (0xfe)');
                                        }
                                        require(address(memory[0x10a]).code.length);
                                        require(call(gasleft(),local89,0x0,local87,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local81) + local79 - local87,local87,0x0));
                                        if (0x1 < var_3) {
                                            if (0x1 >= var_3) {
                                                revert('Invalid instruction (0xfe)');
                                            }
                                            if ((storage[keccak256(0x6)] / 0x100000000) != 0x0) {
                                                if (0x1 >= var_3) {
                                                    revert('Invalid instruction (0xfe)');
                                                }
                                                if (0x1 >= var_3) {
                                                    revert('Invalid instruction (0xfe)');
                                                }
                                                if (0x0 < memory[0xc5]) {
                                                    if (0x20 < memory[0xc5]) {
                                                        if (0x40 < memory[0xc5]) {
                                                            if (0x60 < memory[0xc5]) {
                                                                if (0x80 < memory[0xc5]) {
                                                                    if (0xa0 < memory[0xc5]) {
                                                                        if (0xc0 < memory[0xc5]) {
                                                                            if (0xe0 < memory[0xc5]) {
                                                                            }
                                                                            if (0xe0 > memory[0xc5]) {
                                                                                require(address(memory[0x10a]).code.length);
                                                                                require(call(gasleft(),local121,0x0,local119,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local108) + local106 - local119,local119,0x0));
                                                                                if (0x2 < var_3) {
                                                                                    if (0x2 >= var_3) {
                                                                                        revert('Invalid instruction (0xfe)');
                                                                                    }
                                                                                    if ((storage[keccak256(0x6)] / 0x10000000000000000) != 0x0) {
                                                                                        if (0x2 >= var_3) {
                                                                                            revert('Invalid instruction (0xfe)');
                                                                                        }
                                                                                        if (0x2 >= var_3) {
                                                                                            revert('Invalid instruction (0xfe)');
                                                                                        }
                                                                                    }
                                                                                    if (0x3 < var_3) {
                                                                                        if (0x3 >= var_3) {
                                                                                            revert('Invalid instruction (0xfe)');
                                                                                        }
                                                                                        if ((storage[keccak256(0x6)] / 0x1000000000000000000000000) != 0x0) {
                                                                                            if (0x3 >= var_3) {
                                                                                                revert('Invalid instruction (0xfe)');
                                                                                            }
                                                                                            if (0x3 >= var_3) {
                                                                                                revert('Invalid instruction (0xfe)');
                                                                                            }
                                                                                        }
                                                                                        if (0x4 < var_3) {
                                                                                            if (0x4 >= var_3) {
                                                                                                revert('Invalid instruction (0xfe)');
                                                                                            }
                                                                                            if ((storage[keccak256(0x6)] / 0x100000000000000000000000000000000) != 0x0) {
                                                                                                if (0x4 >= var_3) {
                                                                                                    revert('Invalid instruction (0xfe)');
                                                                                                }
                                                                                                if (0x4 >= var_3) {
                                                                                                    revert('Invalid instruction (0xfe)');
                                                                                                }
                                                                                            }
                                                                                            if (0x5 < var_3) {
                                                                                                if (0x5 >= var_3) {
                                                                                                    revert('Invalid instruction (0xfe)');
                                                                                                }
                                                                                                if ((storage[keccak256(0x6)] / 0x10000000000000000000000000000000000000000) != 0x0) {
                                                                                                    if (0x5 >= var_3) {
                                                                                                        revert('Invalid instruction (0xfe)');
                                                                                                    }
                                                                                                    if (0x5 >= var_3) {
                                                                                                        revert('Invalid instruction (0xfe)');
                                                                                                    }
                                                                                                }
                                                                                                if (0x6 < var_3) {
                                                                                                    if (0x6 >= var_3) {
                                                                                                        revert('Invalid instruction (0xfe)');
                                                                                                    }
                                                                                                    if ((storage[keccak256(0x6)] / 0x1000000000000000000000000000000000000000000000000) != 0x0) {
                                                                                                        if (0x6 >= var_3) {
                                                                                                            revert('Invalid instruction (0xfe)');
                                                                                                        }
                                                                                                        if (0x6 >= var_3) {
                                                                                                            revert('Invalid instruction (0xfe)');
                                                                                                        }
                                                                                                    }
                                                                                                    if (0x7 < var_3) {
                                                                                                        if (0x7 >= var_3) {
                                                                                                            revert('Invalid instruction (0xfe)');
                                                                                                        }
                                                                                                        if ((storage[keccak256(0x6)] / 0x100000000000000000000000000000000000000000000000000000000) != 0x0) {
                                                                                                            if (0x7 >= var_3) {
                                                                                                                revert('Invalid instruction (0xfe)');
                                                                                                            }
                                                                                                            if (0x7 >= var_3) {
                                                                                                                revert('Invalid instruction (0xfe)');
                                                                                                            }
                                                                                                        }
                                                                                                        if (0x8 < var_3) {
                                                                                                            if (0x8 >= var_3) {
                                                                                                                revert('Invalid instruction (0xfe)');
                                                                                                            }
                                                                                                            if (storage[0x1 + keccak256(0x6)] != 0x0) {
                                                                                                                if (0x8 >= var_3) {
                                                                                                                    revert('Invalid instruction (0xfe)');
                                                                                                                }
                                                                                                                if (0x8 >= var_3) {
                                                                                                                    revert('Invalid instruction (0xfe)');
                                                                                                                }
                                                                                                            }
                                                                                                            if (0x9 < var_3) {
                                                                                                                if (0x9 >= var_3) {
                                                                                                                    revert('Invalid instruction (0xfe)');
                                                                                                                }
                                                                                                                if ((storage[0x1 + keccak256(0x6)] / 0x100000000) != 0x0) {
                                                                                                                    if (0x9 >= var_3) {
                                                                                                                        revert('Invalid instruction (0xfe)');
                                                                                                                    }
                                                                                                                    if (0x9 >= var_3) {
                                                                                                                        revert('Invalid instruction (0xfe)');
                                                                                                                    }
                                                                                                                }
                                                                                                                if (0xa < var_3) {
                                                                                                                    if (0xa >= var_3) {
                                                                                                                        revert('Invalid instruction (0xfe)');
                                                                                                                    }
                                                                                                                    if ((storage[0x1 + keccak256(0x6)] / 0x10000000000000000) != 0x0) {
                                                                                                                        if (0xa >= var_3) {
                                                                                                                            revert('Invalid instruction (0xfe)');
                                                                                                                        }
                                                                                                                        if (0xa >= var_3) {
                                                                                                                            revert('Invalid instruction (0xfe)');
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                                return;
                                                                                                            }
                                                                                                            return;
                                                                                                        }
                                                                                                        return;
                                                                                                    }
                                                                                                    return;
                                                                                                }
                                                                                                return;
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                            require(address(memory[0x10a]).code.length);
                                                                            require(call(gasleft(),local121,0x0,local119,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local108) + local106 - local119,local119,0x0));
                                                                        }
                                                                        if (0xc0 > memory[0xc5]) {
                                                                            require(address(memory[0x10a]).code.length);
                                                                            require(call(gasleft(),local120,0x0,local118,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local108) + local106 - local118,local118,0x0));
                                                                        }
                                                                        require(address(memory[0x10a]).code.length);
                                                                        require(call(gasleft(),local120,0x0,local118,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local108) + local106 - local118,local118,0x0));
                                                                    }
                                                                    if (0xa0 > memory[0xc5]) {
                                                                        require(address(memory[0x10a]).code.length);
                                                                        require(call(gasleft(),local119,0x0,local117,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local108) + local106 - local117,local117,0x0));
                                                                    }
                                                                    require(address(memory[0x10a]).code.length);
                                                                    require(call(gasleft(),local119,0x0,local117,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local108) + local106 - local117,local117,0x0));
                                                                }
                                                                if (0x80 > memory[0xc5]) {
                                                                    require(address(memory[0x10a]).code.length);
                                                                    require(call(gasleft(),local118,0x0,local116,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local108) + local106 - local116,local116,0x0));
                                                                }
                                                                require(address(memory[0x10a]).code.length);
                                                                require(call(gasleft(),local118,0x0,local116,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local108) + local106 - local116,local116,0x0));
                                                            }
                                                            if (0x60 > memory[0xc5]) {
                                                                require(address(memory[0x10a]).code.length);
                                                                require(call(gasleft(),local117,0x0,local115,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local108) + local106 - local115,local115,0x0));
                                                            }
                                                            require(address(memory[0x10a]).code.length);
                                                            require(call(gasleft(),local117,0x0,local115,0x80 + (0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 & 0x1f + local108) + local106 - local115,local115,0x0));
                                                        }
                                                        if (0x40 > memory[0xc5]) {
                                                        }
                                                    }
                                                    if (0x20 > memory[0xc5]) {
                                                    }
                                                }
                                                if (0x0 > memory[0xc5]) {
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            require(0xffffffffff != 0xffffffffff, "Validity assertion failed");
                            require(0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000 != 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000, 0x8c379a0, 0x20, 0x28, this.code[0x383a:(0x383a+0x28)], memory[0x129]);
                            require(0xffffffffff != 0xffffffffff, 0x8c379a0, 0x20, 0x2b, this.code[0x3862:(0x3862+0x2b)], memory[0x129]);
                            require(address(var_4).code.length);
                            require(staticcall(gasleft(),local57,local55,0x4 + memory[0x40] - local55,local55,0x20));
                            require(0x10000000000000000000000e4 + returndatasize() - 0x10000000000000000000000e4 >= 0x20);
                            require(memory[0x10000000000000000000000e4] == memory[0x10000000000000000000000e4]);
                        }
                        if (0x1 == 0x3) {
                            require(0xffffffffff != 0x3, "Validity assertion failed");
                        }
                    }
                    if (0x1 < var_3) {
                        if (0x1 >= var_3) {
                            revert('Invalid instruction (0xfe)');
                        }
                        if (storage[keccak256(0x6)] / 0x100000000 == _arg0) {
                            if (0x1 >= var_3) {
                                revert('Invalid instruction (0xfe)');
                            }
                            storage[keccak256(0x6)] = 0xffffffffffffffffffffffffffffffffffffffffffffffff00000000ffffffff & storage[keccak256(0x6)];
                        }
                        if (0x2 < var_3) {
                            if (0x2 >= var_3) {
                                revert('Invalid instruction (0xfe)');
                            }
                            if (storage[keccak256(0x6)] / 0x10000000000000000 == _arg0) {
                                if (0x2 >= var_3) {
                                    revert('Invalid instruction (0xfe)');
                                }
                                storage[keccak256(0x6)] = 0xffffffffffffffffffffffffffffffffffffffff00000000ffffffffffffffff & storage[keccak256(0x6)];
                            }
                            if (0x3 < var_3) {
                                if (0x3 >= var_3) {
                                    revert('Invalid instruction (0xfe)');
                                }
                                if (storage[keccak256(0x6)] / 0x1000000000000000000000000 == _arg0) {
                                    if (0x3 >= var_3) {
                                        revert('Invalid instruction (0xfe)');
                                    }
                                    storage[keccak256(0x6)] = 0xffffffffffffffffffffffffffffffff00000000ffffffffffffffffffffffff & storage[keccak256(0x6)];
                                }
                                if (0x4 < var_3) {
                                    if (0x4 >= var_3) {
                                        revert('Invalid instruction (0xfe)');
                                    }
                                    if (storage[keccak256(0x6)] / 0x100000000000000000000000000000000 == _arg0) {
                                        if (0x4 >= var_3) {
                                            revert('Invalid instruction (0xfe)');
                                        }
                                        storage[keccak256(0x6)] = 0xffffffffffffffffffffffff00000000ffffffffffffffffffffffffffffffff & storage[keccak256(0x6)];
                                    }
                                    if (0x5 < var_3) {
                                        if (0x5 >= var_3) {
                                            revert('Invalid instruction (0xfe)');
                                        }
                                        if (storage[keccak256(0x6)] / 0x10000000000000000000000000000000000000000 == _arg0) {
                                            if (0x5 >= var_3) {
                                                revert('Invalid instruction (0xfe)');
                                            }
                                            storage[keccak256(0x6)] = 0xffffffffffffffff00000000ffffffffffffffffffffffffffffffffffffffff & storage[keccak256(0x6)];
                                        }
                                        if (0x6 < var_3) {
                                            if (0x6 >= var_3) {
                                                revert('Invalid instruction (0xfe)');
                                            }
                                            if (storage[keccak256(0x6)] / 0x1000000000000000000000000000000000000000000000000 == _arg0) {
                                                if (0x6 >= var_3) {
                                                    revert('Invalid instruction (0xfe)');
                                                }
                                                storage[keccak256(0x6)] = 0xffffffff00000000ffffffffffffffffffffffffffffffffffffffffffffffff & storage[keccak256(0x6)];
                                            }
                                            if (0x7 < var_3) {
                                                if (0x7 >= var_3) {
                                                    revert('Invalid instruction (0xfe)');
                                                }
                                                if (storage[keccak256(0x6)] / 0x100000000000000000000000000000000000000000000000000000000 == _arg0) {
                                                    if (0x7 >= var_3) {
                                                        revert('Invalid instruction (0xfe)');
                                                    }
                                                    storage[keccak256(0x6)] = storage[keccak256(0x6)];
                                                }
                                                if (0x8 < var_3) {
                                                    if (0x8 >= var_3) {
                                                        revert('Invalid instruction (0xfe)');
                                                    }
                                                    if (storage[0x1 + keccak256(0x6)] == _arg0) {
                                                        if (0x8 >= var_3) {
                                                            revert('Invalid instruction (0xfe)');
                                                        }
                                                        storage[0x1 + keccak256(0x6)] = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000 & storage[0x1 + keccak256(0x6)];
                                                    }
                                                    if (0x9 < var_3) {
                                                        if (0x9 >= var_3) {
                                                            revert('Invalid instruction (0xfe)');
                                                        }
                                                        if (storage[0x1 + keccak256(0x6)] / 0x100000000 == _arg0) {
                                                            if (0x9 >= var_3) {
                                                                revert('Invalid instruction (0xfe)');
                                                            }
                                                            storage[0x1 + keccak256(0x6)] = 0xffffffffffffffffffffffffffffffffffffffffffffffff00000000ffffffff & storage[0x1 + keccak256(0x6)];
                                                        }
                                                        if (0xa < var_3) {
                                                            if (0xa >= var_3) {
                                                                revert('Invalid instruction (0xfe)');
                                                            }
                                                            if (storage[0x1 + keccak256(0x6)] / 0x10000000000000000 == _arg0) {
                                                                if (0xa >= var_3) {
                                                                    revert('Invalid instruction (0xfe)');
                                                                }
                                                                storage[0x1 + keccak256(0x6)] = 0xffffffffffffffffffffffffffffffffffffffff00000000ffffffffffffffff & storage[0x1 + keccak256(0x6)];
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
            if (mapping6[_arg0] == 0) {
                var_3 += 0x1;
                storage[var_3 / 0x8 + 0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f] = _arg0 * 0x100 ** (0x4 * (var_3 & 0x7)) | storage[var_3 / 0x8 + 0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f] & ~(0xffffffff * 0x100 ** (0x4 * (var_3 & 0x7)));
                mapping6[_arg0] = _arg1;
            }
            mapping6[_arg0] = _arg1;
        }
        require(var_2 == 0, "in recovery");
        log(0xe1cc453e5e6d48a5e3dd7dc6c72117211d2bea20fbb91fd980ebc3e7f73fe546, _arg0, mapping6[_arg0], _arg1);
        if (_arg1 == 0) {
            mapping6[_arg0] = 0x0;
        }
        if (mapping6[_arg0] == 0) {
            var_3 += 0x1;
            storage[var_3 / 0x8 + 0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f] = _arg0 * 0x100 ** (0x4 * (var_3 & 0x7)) | storage[var_3 / 0x8 + 0xf652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f] & ~(0xffffffff * 0x100 ** (0x4 * (var_3 & 0x7)));
            mapping6[_arg0] = _arg1;
        }
        mapping6[_arg0] = _arg1;
    }

    function f05151df(/*no signature*/) public returns (unknown) {
        if (var_2) {
            return var_2 < block.timestamp;
        }
        return var_2;
    }

    function VERSION() public view returns (uint256) {
        return 0x0;
    }

    function de314b19(/*no signature*/) public view returns (unknown) {
        return var_5;
    }

    function e5429298(/*no signature*/) public view returns (unknown) {
        return var_2;
    }

    function e6b3d949(/*no signature*/) public {
        require(msg.data.length - 0x4 >= 0x20);
        require(_arg0 == _arg0);
    }

    function 670a43c4(/*no signature*/) public view returns (uint256) {
        return 0x127500;
    }

    function 8d3638f4(/*no signature*/) public view returns (uint256) {
        return 0x657468;
    }

    function db2021ae(/*no signature*/) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 == _arg0);
    }

    function 63706be3(/*no signature*/) public {
        require(msg.sender == var_5, "! called by recovery manager");
        require(var_2, "recovery not initiated");
        var_2 = 0x0;
        log(0x5397c02652a688dd1cac8544f233b3daaf96d7a9f974af80b70ab1538359e261, var_5);
        return;
    }

    function 66cf8fab(/*no signature*/) public returns (unknown) {
        require(msg.data.length - 0x4 >= 0x20);
        require(_arg0 < var_3);
        return storage[_arg0 / 0x8 + keccak256(0x6)] / 0x100 ** (0x4 * _arg0 % 0x8);
    }

    function 4fedbbb5(/*no signature*/) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 == _arg0);
    }

    function 5585416c(/*no signature*/) public view returns (unknown) {
        return governor / 0x10000000000000000000000000000000000000000;
    }

    function 56d5d475(/*no signature*/) public {
        require(msg.data.length - 0x4 >= 0x60);
        require(_arg0 == _arg0);
    }

    function 41bdc8b5(/*no signature*/) public {
        require(msg.data.length - 0x4 >= 0x20);
        require(_arg0 == _arg0);
    }

    function 4626abee(/*no signature*/) public {
        require(msg.data.length - 0x4 >= 0x20);
        require(_arg0 <= 0xffffffffffffffff);
        require(0x4 + _arg0 + 0x1f < msg.data.length);
        require(msg.data[0x4 + _arg0] <= 0xffffffffffffffff);
        require(0x4 + _arg0 + msg.data[0x4 + _arg0] * 0x20 + 0x20 <= msg.data.length);
        if (var_2) {
            if (var_2 > block.timestamp) {
                require(msg.sender == governor, "! called by governor");
                if (0x0 < msg.data[0x4 + _arg0]) {
                    if (0x0 >= msg.data[0x4 + _arg0]) {
                        revert('Invalid instruction (0xfe)');
                    }
                    require(msg.data[0x4 + _arg0 + 0x20] < msg.data.length - 0x4 + _arg0 + 0x20 + 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc1);
                    require(msg.data.length - msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 >= 0x40);
                    require(msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] <= 0xffffffffffffffff);
                    require(msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] + 0x1f < msg.data.length);
                    if (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] > 0xffffffffffffffff) {
                        revert('Invalid instruction (0xfe)');
                    }
                    if (0xc0 + (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x20 < 0xc0 | 0xc0 + (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x20 > 0xffffffffffffffff) {
                        revert('Invalid instruction (0xfe)');
                    }
                    require(msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x20 <= msg.data.length);
                }
            }
            require(msg.sender == var_5, "! called by recovery manager");
            if (0x0 < msg.data[0x4 + _arg0]) {
                if (0x0 >= msg.data[0x4 + _arg0]) {
                    revert('Invalid instruction (0xfe)');
                }
                require(msg.data[0x4 + _arg0 + 0x20] < msg.data.length - 0x4 + _arg0 + 0x20 + 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc1);
                require(msg.data.length - msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 >= 0x40);
                require(msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] <= 0xffffffffffffffff);
                require(msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] + 0x1f < msg.data.length);
                if (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] > 0xffffffffffffffff) {
                    revert('Invalid instruction (0xfe)');
                }
                if (0xc0 + (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x20 < 0xc0 | 0xc0 + (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x20 > 0xffffffffffffffff) {
                    revert('Invalid instruction (0xfe)');
                }
                require(msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x20 <= msg.data.length);
            }
        }
        if (var_2 == 0) {
            require(msg.sender == governor, "! called by governor");
            if (0x0 < msg.data[0x4 + _arg0]) {
                if (0x0 >= msg.data[0x4 + _arg0]) {
                    revert('Invalid instruction (0xfe)');
                }
                require(msg.data[0x4 + _arg0 + 0x20] < msg.data.length - 0x4 + _arg0 + 0x20 + 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc1);
                require(msg.data.length - msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 >= 0x40);
                require(msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] <= 0xffffffffffffffff);
                require(msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] + 0x1f < msg.data.length);
                if (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] > 0xffffffffffffffff) {
                    revert('Invalid instruction (0xfe)');
                }
                if (0xc0 + (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x20 < 0xc0 | 0xc0 + (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x20 > 0xffffffffffffffff) {
                    revert('Invalid instruction (0xfe)');
                }
                require(msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x20 <= msg.data.length);
            }
        }
        require(msg.sender == var_5, "! called by recovery manager");
        if (0x0 < msg.data[0x4 + _arg0]) {
            if (0x0 >= msg.data[0x4 + _arg0]) {
                revert('Invalid instruction (0xfe)');
            }
            require(msg.data[0x4 + _arg0 + 0x20] < msg.data.length - 0x4 + _arg0 + 0x20 + 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc1);
            require(msg.data.length - msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 >= 0x40);
            require(msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] <= 0xffffffffffffffff);
            require(msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] + 0x1f < msg.data.length);
            if (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] > 0xffffffffffffffff) {
                revert('Invalid instruction (0xfe)');
            }
            if (0xc0 + (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x20 < 0xc0 | 0xc0 + (msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x1f & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0) + 0x20 > 0xffffffffffffffff) {
                revert('Invalid instruction (0xfe)');
            }
            require(msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20] + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + msg.data[msg.data[0x4 + _arg0 + 0x20] + 0x4 + _arg0 + 0x20 + 0x20]] + 0x20 <= msg.data.length);
        }
    }

    function initialize(address _arg0, address _arg1) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 == _arg0);
    }

    function 2ead72f6(/*no signature*/) public {
        require(msg.data.length - 0x4 >= 0x20);
        require(_arg0 == _arg0);
    }

    function 316c92b6(/*no signature*/) public {
        if (var_2) {
            require(var_2 > block.timestamp, "in recovery");
            require(msg.sender == var_5, "! called by recovery manager");
            if (var_2) {
            }
            require(0x127500 + block.timestamp >= block.timestamp, "SafeMath: addition overflow");
        }
        if (var_2) {
        }
        if (msg.sender != var_5) {
        }
        if (var_2) {
        }
        require(0x127500 + block.timestamp >= block.timestamp, "SafeMath: addition overflow");
    }

    function 3339df96(/*no signature*/) public view returns (unknown) {
        return var_4;
    }

    function governor() public view returns (unknown) {
        return governor;
    }

    function 0ce21995(/*no signature*/) public {
        require(msg.data.length - 0x4 >= 0x40);
        require(_arg0 == _arg0);
    }

}
