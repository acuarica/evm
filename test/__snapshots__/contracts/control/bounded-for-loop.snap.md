# contracts/control/bounded for-loop

```sol -no-opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmYPjcvsjL1MSEMDtdGswmUaxVMuxyeHsfaQgTgbUtUoKo
pragma solidity 0.7.6;

contract Contract {

unknown var1__1; // Slot #0
    fallback() external payable {
        undefined local0 = 0x0; // #refs 4
        if (~(local0 < block.number) == 0) {
            var_1 = local0;
            undefined local1 = 0x1 + local0; // #refs 4
            if (~(local1 < block.number) == 0) {
                var_1 = local1;
                undefined local2 = 0x1 + local1; // #refs 4
                if (~(local2 < block.number) == 0) {
                    var_1 = local2;
                    undefined local3 = 0x1 + local2; // #refs 4
                    if (~(local3 < block.number) == 0) {
                        var_1 = local3;
                        undefined local4 = 0x1 + local3; // #refs 4
                        if (~(local4 < block.number) == 0) {
                            var_1 = local4;
                            undefined local5 = 0x1 + local4; // #refs 4
                            if (~(local5 < block.number) == 0) {
                                var_1 = local5;
                                undefined local6 = 0x1 + local5; // #refs 4
                                if (~(local6 < block.number) == 0) {
                                    var_1 = local6;
                                    undefined local7 = 0x1 + local6; // #refs 4
                                    if (~(local7 < block.number) == 0) {
                                        var_1 = local7;
                                        undefined local8 = 0x1 + local7; // #refs 4
                                        if (~(local8 < block.number) == 0) {
                                            var_1 = local8;
                                            undefined local9 = 0x1 + local8; // #refs 4
                                            if (~(local9 < block.number) == 0) {
                                                var_1 = local9;
                                                undefined local10 = 0x1 + local9; // #refs 4
                                                if (~(local10 < block.number) == 0) {
                                                    var_1 = local10;
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
        return;
    }

}

```

```yul -no-opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        let local0 = 0x0 // #refs 4
        if (not(iszero(lt(local0, number())))) {
            sstore(0x0, local0)
            let local1 = add(0x1, local0) // #refs 4
            if (not(iszero(lt(local1, number())))) {
                sstore(0x0, local1)
                let local2 = add(0x1, local1) // #refs 4
                if (not(iszero(lt(local2, number())))) {
                    sstore(0x0, local2)
                    let local3 = add(0x1, local2) // #refs 4
                    if (not(iszero(lt(local3, number())))) {
                        sstore(0x0, local3)
                        let local4 = add(0x1, local3) // #refs 4
                        if (not(iszero(lt(local4, number())))) {
                            sstore(0x0, local4)
                            let local5 = add(0x1, local4) // #refs 4
                            if (not(iszero(lt(local5, number())))) {
                                sstore(0x0, local5)
                                let local6 = add(0x1, local5) // #refs 4
                                if (not(iszero(lt(local6, number())))) {
                                    sstore(0x0, local6)
                                    let local7 = add(0x1, local6) // #refs 4
                                    if (not(iszero(lt(local7, number())))) {
                                        sstore(0x0, local7)
                                        let local8 = add(0x1, local7) // #refs 4
                                        if (not(iszero(lt(local8, number())))) {
                                            sstore(0x0, local8)
                                            let local9 = add(0x1, local8) // #refs 4
                                            if (not(iszero(lt(local9, number())))) {
                                                sstore(0x0, local9)
                                                let local10 = add(0x1, local9) // #refs 4
                                                if (not(iszero(lt(local10, number())))) {
                                                    sstore(0x0, local10)
                                                }
                                                stop()
                                            }
                                            stop()
                                        }
                                        stop()
                                    }
                                    stop()
                                }
                                stop()
                            }
                            stop()
                        }
                        stop()
                    }
                    stop()
                }
                stop()
            }
            stop()
        }
        stop()

    }
}

```

```graphviz -no-opt
digraph G {    
  color="#efefef";
  graph[fontsize=8];

  node[shape=box style="rounded,filled" fontsize=9 fontname="Arial" fillcolor="#efefef"];

  subgraph cluster_0 {
    style="filled,rounded";
    label = "pc @0";
    "id-0" [label="pc @0 (id-0)\l=| 0x0\lmemory[0x40] = 0x80;\lfall: 7:\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_7 {
    style="filled,rounded";
    label = "pc @7";
    "id-1" [label="pc @7 (id-1)\l=| local0\lundefined local0 = 0x0; // #refs 4\lwhen (local0 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
    "id-2" [label="pc @7 (id-2)\l=| local1\lundefined local1 = 0x1 + local0; // #refs 4\lwhen (local1 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
    "id-3" [label="pc @7 (id-3)\l=| local2\lundefined local2 = 0x1 + local1; // #refs 4\lwhen (local2 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
    "id-4" [label="pc @7 (id-4)\l=| local3\lundefined local3 = 0x1 + local2; // #refs 4\lwhen (local3 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
    "id-5" [label="pc @7 (id-5)\l=| local4\lundefined local4 = 0x1 + local3; // #refs 4\lwhen (local4 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
    "id-6" [label="pc @7 (id-6)\l=| local5\lundefined local5 = 0x1 + local4; // #refs 4\lwhen (local5 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
    "id-7" [label="pc @7 (id-7)\l=| local6\lundefined local6 = 0x1 + local5; // #refs 4\lwhen (local6 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
    "id-8" [label="pc @7 (id-8)\l=| local7\lundefined local7 = 0x1 + local6; // #refs 4\lwhen (local7 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
    "id-9" [label="pc @7 (id-9)\l=| local8\lundefined local8 = 0x1 + local7; // #refs 4\lwhen (local8 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
    "id-10" [label="pc @7 (id-10)\l=| local9\lundefined local9 = 0x1 + local8; // #refs 4\lwhen (local9 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
    "id-11" [label="pc @7 (id-11)\l=| local10\lundefined local10 = 0x1 + local9; // #refs 4\lwhen (local10 < block.number) == 0 goto 33 or fall 15\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_15 {
    style="filled,rounded";
    label = "pc @15";
    "id-12" [label="pc @15 (id-12)\l=| add(0x1, local0)\lvar_1 = local0;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-13" [label="pc @15 (id-13)\l=| add(0x1, local1)\lvar_1 = local1;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-14" [label="pc @15 (id-14)\l=| add(0x1, local2)\lvar_1 = local2;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-15" [label="pc @15 (id-15)\l=| add(0x1, local3)\lvar_1 = local3;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-16" [label="pc @15 (id-16)\l=| add(0x1, local4)\lvar_1 = local4;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-17" [label="pc @15 (id-17)\l=| add(0x1, local5)\lvar_1 = local5;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-18" [label="pc @15 (id-18)\l=| add(0x1, local6)\lvar_1 = local6;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-19" [label="pc @15 (id-19)\l=| add(0x1, local7)\lvar_1 = local7;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-20" [label="pc @15 (id-20)\l=| add(0x1, local8)\lvar_1 = local8;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-21" [label="pc @15 (id-21)\l=| add(0x1, local9)\lvar_1 = local9;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-22" [label="pc @15 (id-22)\l=| add(0x1, local10)\lvar_1 = local10;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_33 {
    style="filled,rounded";
    label = "pc @33";
    "id-23" [label="pc @33 (id-23)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-24" [label="pc @33 (id-24)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-25" [label="pc @33 (id-25)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-26" [label="pc @33 (id-26)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-27" [label="pc @33 (id-27)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-28" [label="pc @33 (id-28)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-29" [label="pc @33 (id-29)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-30" [label="pc @33 (id-30)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-31" [label="pc @33 (id-31)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-32" [label="pc @33 (id-32)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-33" [label="pc @33 (id-33)\l=| \lreturn;\l" fillcolor="#cf91f7"];
  }

  "id-0" -> "id-1";
  "id-1" -> "id-33";
  "id-1" -> "id-12";
  "id-2" -> "id-32";
  "id-2" -> "id-13";
  "id-3" -> "id-31";
  "id-3" -> "id-14";
  "id-4" -> "id-30";
  "id-4" -> "id-15";
  "id-5" -> "id-29";
  "id-5" -> "id-16";
  "id-6" -> "id-28";
  "id-6" -> "id-17";
  "id-7" -> "id-27";
  "id-7" -> "id-18";
  "id-8" -> "id-26";
  "id-8" -> "id-19";
  "id-9" -> "id-25";
  "id-9" -> "id-20";
  "id-10" -> "id-24";
  "id-10" -> "id-21";
  "id-11" -> "id-23";
  "id-11" -> "id-22";
  "id-12" -> "id-2";
  "id-13" -> "id-3";
  "id-14" -> "id-4";
  "id-15" -> "id-5";
  "id-16" -> "id-6";
  "id-17" -> "id-7";
  "id-18" -> "id-8";
  "id-19" -> "id-9";
  "id-20" -> "id-10";
  "id-21" -> "id-11";
  "id-22" -> "undefined";

}

```

```sol -opt
// SPDX-License-Identifier: UNLICENSED
// Metadata ipfs://QmNeUP433KicpZd6iGR1rFCCUNQkYqaFR684J4LNiJSuaL
pragma solidity 0.7.6;

contract Contract {

unknown var1__1; // Slot #0
    fallback() external payable {
        undefined local0 = 0x0; // #refs 1
        if (~(local0 < block.number) == 0) {
            var_1 = local0;
            undefined local1 = 0x1 + local0; // #refs 1
            if (~(local1 < block.number) == 0) {
                var_1 = local1;
                undefined local2 = 0x1 + local1; // #refs 1
                if (~(local2 < block.number) == 0) {
                    var_1 = local2;
                    undefined local3 = 0x1 + local2; // #refs 1
                    if (~(local3 < block.number) == 0) {
                        var_1 = local3;
                        undefined local4 = 0x1 + local3; // #refs 1
                        if (~(local4 < block.number) == 0) {
                            var_1 = local4;
                            undefined local5 = 0x1 + local4; // #refs 1
                            if (~(local5 < block.number) == 0) {
                                var_1 = local5;
                                undefined local6 = 0x1 + local5; // #refs 1
                                if (~(local6 < block.number) == 0) {
                                    var_1 = local6;
                                    undefined local7 = 0x1 + local6; // #refs 1
                                    if (~(local7 < block.number) == 0) {
                                        var_1 = local7;
                                        undefined local8 = 0x1 + local7; // #refs 1
                                        if (~(local8 < block.number) == 0) {
                                            var_1 = local8;
                                            undefined local9 = 0x1 + local8; // #refs 1
                                            if (~(local9 < block.number) == 0) {
                                                var_1 = local9;
                                                undefined local10 = 0x1 + local9; // #refs 1
                                                if (~(local10 < block.number) == 0) {
                                                    var_1 = local10;
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
        return;
    }

}

```

```yul -opt
object "runtime" {
    code {
        mstore(0x40, 0x80)
        let local0 = 0x0 // #refs 1
        if (not(iszero(lt(local0, number())))) {
            sstore(0x0, local0)
            let local1 = add(0x1, local0) // #refs 1
            if (not(iszero(lt(local1, number())))) {
                sstore(0x0, local1)
                let local2 = add(0x1, local1) // #refs 1
                if (not(iszero(lt(local2, number())))) {
                    sstore(0x0, local2)
                    let local3 = add(0x1, local2) // #refs 1
                    if (not(iszero(lt(local3, number())))) {
                        sstore(0x0, local3)
                        let local4 = add(0x1, local3) // #refs 1
                        if (not(iszero(lt(local4, number())))) {
                            sstore(0x0, local4)
                            let local5 = add(0x1, local4) // #refs 1
                            if (not(iszero(lt(local5, number())))) {
                                sstore(0x0, local5)
                                let local6 = add(0x1, local5) // #refs 1
                                if (not(iszero(lt(local6, number())))) {
                                    sstore(0x0, local6)
                                    let local7 = add(0x1, local6) // #refs 1
                                    if (not(iszero(lt(local7, number())))) {
                                        sstore(0x0, local7)
                                        let local8 = add(0x1, local7) // #refs 1
                                        if (not(iszero(lt(local8, number())))) {
                                            sstore(0x0, local8)
                                            let local9 = add(0x1, local8) // #refs 1
                                            if (not(iszero(lt(local9, number())))) {
                                                sstore(0x0, local9)
                                                let local10 = add(0x1, local9) // #refs 1
                                                if (not(iszero(lt(local10, number())))) {
                                                    sstore(0x0, local10)
                                                }
                                                stop()
                                            }
                                            stop()
                                        }
                                        stop()
                                    }
                                    stop()
                                }
                                stop()
                            }
                            stop()
                        }
                        stop()
                    }
                    stop()
                }
                stop()
            }
            stop()
        }
        stop()

    }
}

```

```graphviz -opt
digraph G {    
  color="#efefef";
  graph[fontsize=8];

  node[shape=box style="rounded,filled" fontsize=9 fontname="Arial" fillcolor="#efefef"];

  subgraph cluster_0 {
    style="filled,rounded";
    label = "pc @0";
    "id-0" [label="pc @0 (id-0)\l=| 0x0\lmemory[0x40] = 0x80;\lfall: 7:\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_7 {
    style="filled,rounded";
    label = "pc @7";
    "id-1" [label="pc @7 (id-1)\l=| local0\lundefined local0 = 0x0; // #refs 1\lwhen (local0 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
    "id-2" [label="pc @7 (id-2)\l=| local1\lundefined local1 = 0x1 + local0; // #refs 1\lwhen (local1 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
    "id-3" [label="pc @7 (id-3)\l=| local2\lundefined local2 = 0x1 + local1; // #refs 1\lwhen (local2 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
    "id-4" [label="pc @7 (id-4)\l=| local3\lundefined local3 = 0x1 + local2; // #refs 1\lwhen (local3 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
    "id-5" [label="pc @7 (id-5)\l=| local4\lundefined local4 = 0x1 + local3; // #refs 1\lwhen (local4 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
    "id-6" [label="pc @7 (id-6)\l=| local5\lundefined local5 = 0x1 + local4; // #refs 1\lwhen (local5 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
    "id-7" [label="pc @7 (id-7)\l=| local6\lundefined local6 = 0x1 + local5; // #refs 1\lwhen (local6 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
    "id-8" [label="pc @7 (id-8)\l=| local7\lundefined local7 = 0x1 + local6; // #refs 1\lwhen (local7 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
    "id-9" [label="pc @7 (id-9)\l=| local8\lundefined local8 = 0x1 + local7; // #refs 1\lwhen (local8 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
    "id-10" [label="pc @7 (id-10)\l=| local9\lundefined local9 = 0x1 + local8; // #refs 1\lwhen (local9 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
    "id-11" [label="pc @7 (id-11)\l=| local10\lundefined local10 = 0x1 + local9; // #refs 1\lwhen (local10 < block.number) == 0 goto 26 or fall 15\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_15 {
    style="filled,rounded";
    label = "pc @15";
    "id-12" [label="pc @15 (id-12)\l=| add(0x1, local0)\lvar_1 = local0;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-13" [label="pc @15 (id-13)\l=| add(0x1, local1)\lvar_1 = local1;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-14" [label="pc @15 (id-14)\l=| add(0x1, local2)\lvar_1 = local2;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-15" [label="pc @15 (id-15)\l=| add(0x1, local3)\lvar_1 = local3;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-16" [label="pc @15 (id-16)\l=| add(0x1, local4)\lvar_1 = local4;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-17" [label="pc @15 (id-17)\l=| add(0x1, local5)\lvar_1 = local5;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-18" [label="pc @15 (id-18)\l=| add(0x1, local6)\lvar_1 = local6;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-19" [label="pc @15 (id-19)\l=| add(0x1, local7)\lvar_1 = local7;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-20" [label="pc @15 (id-20)\l=| add(0x1, local8)\lvar_1 = local8;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-21" [label="pc @15 (id-21)\l=| add(0x1, local9)\lvar_1 = local9;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
    "id-22" [label="pc @15 (id-22)\l=| add(0x1, local10)\lvar_1 = local10;\lgoto :[J]0x7 branch:7\l" fillcolor="#cf91f7"];
  }

  subgraph cluster_26 {
    style="filled,rounded";
    label = "pc @26";
    "id-23" [label="pc @26 (id-23)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-24" [label="pc @26 (id-24)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-25" [label="pc @26 (id-25)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-26" [label="pc @26 (id-26)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-27" [label="pc @26 (id-27)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-28" [label="pc @26 (id-28)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-29" [label="pc @26 (id-29)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-30" [label="pc @26 (id-30)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-31" [label="pc @26 (id-31)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-32" [label="pc @26 (id-32)\l=| \lreturn;\l" fillcolor="#cf91f7"];
    "id-33" [label="pc @26 (id-33)\l=| \lreturn;\l" fillcolor="#cf91f7"];
  }

  "id-0" -> "id-1";
  "id-1" -> "id-33";
  "id-1" -> "id-12";
  "id-2" -> "id-32";
  "id-2" -> "id-13";
  "id-3" -> "id-31";
  "id-3" -> "id-14";
  "id-4" -> "id-30";
  "id-4" -> "id-15";
  "id-5" -> "id-29";
  "id-5" -> "id-16";
  "id-6" -> "id-28";
  "id-6" -> "id-17";
  "id-7" -> "id-27";
  "id-7" -> "id-18";
  "id-8" -> "id-26";
  "id-8" -> "id-19";
  "id-9" -> "id-25";
  "id-9" -> "id-20";
  "id-10" -> "id-24";
  "id-10" -> "id-21";
  "id-11" -> "id-23";
  "id-11" -> "id-22";
  "id-12" -> "id-2";
  "id-13" -> "id-3";
  "id-14" -> "id-4";
  "id-15" -> "id-5";
  "id-16" -> "id-6";
  "id-17" -> "id-7";
  "id-18" -> "id-8";
  "id-19" -> "id-9";
  "id-20" -> "id-10";
  "id-21" -> "id-11";
  "id-22" -> "undefined";

}

```
