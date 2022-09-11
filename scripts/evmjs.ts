import { readFileSync } from 'fs';
import { Jump, JumpDest, Jumpi } from '../src/ast';
import { Block, ControlFlowGraph } from '../src/cfg';
import { formatOpcode } from '../src/opcode';
import { compile } from '../test/contracts/utils/solc';
import EVM from '../test/utils/evmtest';
export const CONTRACT2 = `contract C {
                mapping(address => uint256) private _values;
                function _getValue(address from) internal view returns (uint256) {
                    return _values[from];
                }
                function getForSender() external view returns (uint256) {
                    return _getValue(msg.sender);
                }
                function getForArg(address from) external view returns (uint256) {
                    return _getValue(from);
                }
            }`;

export const CONTRACT0 = `contract C {
    mapping(address => uint256) private _values;
    function _msgSender() internal view returns (address) {
        return msg.sender;
    }
    function setInline(uint256 value) external {
        _values[msg.sender] = value + 3;
    }
    function setInternal(uint256 value) external {
        _values[_msgSender()] = value + 5;
    }
}`;

export const CONTRACT1 = `contract C {
                uint256 total = 0;
                function() external {
                    total = f1();
                }

                function f1() internal view returns (uint256) {
                    uint256 sum = 0xa;
                    for (uint256 i = 9; i < block.number; i++) {
                        sum += i;
                    }

                    return sum;
                }
            }`;
export const CONTRACT3 = `contract C {
                mapping(uint256 => uint256) private _values;
                function _getValue(uint256 n) internal view returns (uint256) {
                    uint256 result = 0;
                    for (uint256 i = 0; i < n; i++) {
                        result += _values[i];
                    }
                    return result;
                }
                function getFor5() external view returns (uint256) {
                    return _getValue(5);
                }
                function getForArg(uint256 n) external view returns (uint256) {
                    return _getValue(n);
                }
            }`;

export const CONTRACT11 = `contract C {
                uint256 total = 0;
                fallback() external payable {
                    uint256 val = 3;
                    if (block.number == 8) {
                        val = 7;
                    }
                    total = val;
                }
            }`;

export const CONTRACT23 = `contract C {
            mapping (address => uint256) private _allowances;
            function approve(uint256 amount) external {
                _approve(msg.sender, amount);
            }
            function _approve(address owner, uint256 amount) private {
                require(owner != address(0), "approve");
                require(amount > 0, "approve address");
                _allowances[owner] = amount;
            }

        }`;

export const CONTRACT24 = `contract C {
            function balanceOf(uint256 from) external pure returns (uint256) { return from; }
            function symbol() external pure returns (uint256) { return 3; }
            function thisAddress() external view returns (address) { return address(this); }
        }`;
// export const path='./data/smoke/OgvStaking-0x2a4cfBb8168d26f8a3b919A14dbc0Cd24b4bC329.bytecode';
// export const path='./data/smoke/Fair-0x88d0773a09cc1b43a3c3d3cbb4e30f4009641887.bytecode';
// export const bytecode = readFileSync(path, 'utf8');

const evm = new EVM(compile('C', CONTRACT11, '0.8.16'));
// const evm = new EVM(bytecode);

evm.opcodes.forEach(op => console.error(formatOpcode(op)));

const write = console.log;

write('digraph G {');
// dot(evm.contract.getFunction('balanceOf(uint256)')!.cfg);
dot(evm.contract.main.cfg);
write('}');

function dot({ blocks }: ControlFlowGraph) {
    for (const [pc, block] of Object.entries(blocks)) {
        writeNode(pc, block);

        const last = block.stmts.at(-1);
        if (last instanceof Jumpi) {
            writeEdge(pc, last.destBranch!.key);
            writeEdge(pc, last.fallBranch!.key);
        } else if (last instanceof Jump) {
            writeEdge(pc, last.destBranch!.key);
        } else if (last instanceof JumpDest) {
            writeEdge(pc, last.fallBranch!.key);
        }
    }

    function writeNode(pc: string, block: Block) {
        let label = 'key:' + pc;
        // label += '\\l';
        // label += block.branch.state.stack.values.map(elem => '=| ' + elem).join('\\l');
        label += '\\l';
        label += block.opcodes.map(op => formatOpcode(op)).join('\\l');
        label += '\\l';
        label += block.stack.values.map(elem => '=| ' + elem).join('\\l');
        label += '\\l';
        label += block.stmts.map(stmt => stmt.toString()).join('\\l');

        write(`"${pc}" [label="${label}"];`);
    }

    function writeEdge(src: string, key: string) {
        write(`"${src}" -> "${key}";`);
    }
}
