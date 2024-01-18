#!/usr/bin/env -S FORCE_COLOR=0 node
/* eslint-env node */

import { Contract, type Ram, Shanghai, type State } from 'sevm';
import type { DataCopy, Create } from 'sevm/ast';
import 'sevm/4bytedb';

// contract Token {
//     event Deposit(uint256 value);
//     fallback() external payable {
//         emit Deposit(3);
//     }
// }
// contract Test {
//     fallback() external payable {
//         new Token();
//     }
// }
const bytecode = '6080604052604051600e90602d565b604051809103906000f0801580156029573d6000803e3d6000fd5b5050005b60918061003a8339019056fe6080604052348015600f57600080fd5b50607480601d6000396000f3fe60806040527f4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e3842660036040518082815260200191505060405180910390a100fea2646970667358221220f03e9c56a5b70c1ba8fadf7d234cbca48d388951bfc7d402f0c92e4cb2afcd9f64736f6c63430007060033a264697066735822122053e5ffa19b83ac364f3adf6836d3758c98ae850b0fc9f5059124bf85d12c8d7264736f6c63430007060033';

let constructorContract: Contract, tokenContract: Contract;
const testContract = new Contract(bytecode, new class extends Shanghai {
    override CREATE = (state: State) => {
        super.CREATE(state);
        const bytecode = (state.stack.top as Create).bytecode!;

        constructorContract = new Contract(bytecode, new class extends Shanghai {
            override CODECOPY = ({ stack, memory }: Ram, _: unknown, bytecode: Uint8Array) => {
                const dest = stack.top?.eval();
                super.CODECOPY({ stack, memory }, _, bytecode);

                if (dest?.isVal()) {
                    const m = memory[Number(dest.val)] as DataCopy;
                    tokenContract = new Contract(m.bytecode!);
                }
            };
        }());
    };
}());

console.log('// Test contract -- factory');
console.log(testContract.solidify());
console.log('// Token contract -- constructor');
console.log(constructorContract!.solidify());
console.log('// Token contract -- deployed bytecode');
console.log(tokenContract!.patchdb().solidify());
