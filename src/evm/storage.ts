import type { State } from '../state';
import { type Expr, type IInst, type Inst, Tag } from './expr';
import type { Sha3 } from './system';
import { Add, Sub } from './math';

export interface IStore {
    /**
     * vars definition
     */
    readonly variables: { [location: string]: Variable };

    /**
     * mappings definition
     */
    readonly mappings: {
        [location: string]: {
            name: string | undefined;
            structs: bigint[];
            keys: Expr[][];
            values: Expr[];
        };
    };
}

/**
 *
 */
export class Variable {
    constructor(public label: string | undefined, readonly types: Expr[]) {}
}

/**
 *
 * @param variables
 * @returns
 */
export function stringifyVariables(variables: IStore['variables']) {
    let output = '';
    Object.entries(variables).forEach(([hash, variable], index) => {
        const types: string[] = variable.types
            .map(expr => expr.eval())
            .map(expr => (!expr.isVal() ? '???expr.type' ?? '' : 'bigint'))
            .filter(t => t.trim() !== '');
        if (types.length === 0) {
            types.push('unknown');
        }
        const name = variable.label ? ` public ${variable.label}` : ` var${index + 1}`;
        output += [...new Set(types)].join('|') + name + '; // #' + hash;
        output += '\n';
    });

    if (Object.keys(variables).length > 0) {
        output += '\n';
    }

    return output;
}

/**
 *
 * @param mappings
 * @returns
 */
export function stringifyStructs(mappings: IStore['mappings']) {
    let text = '';

    Object.keys(mappings)
        .filter(key => mappings[key].structs.length > 0)
        .forEach(key => {
            const mapping = mappings[key];
            text += `struct ${mapping.name}Struct {\n`;
            mapping.structs.forEach(struct => {
                text += `    ${struct.toString()};\n`;
            });
            text += '}\n\n';
        });

    return text;
}

/**
 *
 * @param mappings
 * @returns
 */
export function stringifyMappings(mappings: IStore['mappings']) {
    let output = '';

    Object.keys(mappings).forEach((key: string, index: number) => {
        const mapping = mappings[key];
        if (mapping.name) {
            output += stringifyMapping(mapping) + ' public ' + mapping.name + ';';
        } else {
            output += stringifyMapping(mapping) + ` mapping${index + 1};`;
        }
        output += '\n';
    });

    if (Object.keys(mappings).length > 0) {
        output += '\n';
    }

    return output;

    function stringifyMapping(mapping: IStore['mappings'][keyof IStore['mappings']]) {
        const mappingKey: string[] = [];
        const mappingValue: string[] = [];
        let deepMapping = false;
        mapping.keys
            .filter(mappingChild => mappingChild.length > 0)
            .forEach(mappingChild => {
                if (
                    mappingChild.length > 0 &&
                    mappingChild[0].type &&
                    !mappingKey.includes(mappingChild[0].type)
                ) {
                    mappingKey.push(mappingChild[0].type);
                }
                if (mappingChild.length > 1 && !deepMapping) {
                    deepMapping = true;
                    mappingValue.push(
                        stringifyMapping({
                            name: mapping.name,
                            structs: mapping.structs,
                            keys: mapping.keys.map(items => {
                                items.shift();
                                return items;
                            }),
                            values: mapping.values,
                        })
                    );
                } else if (mappingChild.length === 1 && !deepMapping) {
                    mapping.values.forEach((mappingChild2: any) => {
                        if (mappingChild2.type && !mappingValue.includes(mappingChild2.type)) {
                            mappingValue.push(mappingChild2.type);
                        }
                    });
                }
            });
        if (mappingKey.length === 0) {
            mappingKey.push('unknown');
        }
        if (mapping.structs.length > 0 && mappingValue.length === 0) {
            mappingValue.push(`${mapping.name}Struct`);
        } else if (mappingValue.length === 0) {
            mappingValue.push('unknown');
        }
        return 'mapping (' + mappingKey.join('|') + ' => ' + mappingValue.join('|') + ')';
    }
}

export class MappingStore implements IInst {
    readonly name = 'MappingStore';

    constructor(
        readonly mappings: IStore['mappings'],
        readonly location: number,
        readonly items: Expr[],
        readonly data: Expr,
        readonly structlocation?: bigint
    ) {
        const loc = location;
        if (!(loc in mappings)) {
            mappings[loc] = { name: undefined, structs: [], keys: [], values: [] };
        }
        mappings[loc].keys.push(items);
        if (structlocation === undefined) {
            mappings[loc].values.push(data);
        }
    }

    eval() {
        return this;
    }

    toString() {
        let mappingName = `mapping${this.location + 1}`;
        if (this.location in this.mappings && this.mappings[this.location].name) {
            mappingName = this.mappings[this.location].name!;
        }

        if (
            this.data.tag === 'Add' &&
            this.data.right.tag === 'MappingLoad' &&
            this.data.right.location === this.location
        ) {
            return (
                mappingName +
                this.items.map(item => '[' + item.str() + ']').join('') +
                ' += ' +
                this.data.left.str() +
                ';'
            );
        } else if (
            this.data.tag === 'Add' &&
            this.data.left.tag === 'MappingLoad' &&
            this.data.left.location === this.location
        ) {
            return (
                mappingName +
                this.items.map(item => '[' + item.str() + ']').join('') +
                ' += ' +
                this.data.right.str() +
                ';'
            );
        } else if (
            this.data.tag === 'Sub' &&
            this.data.left.tag === 'MappingLoad' &&
            this.data.left.location === this.location
        ) {
            return (
                mappingName +
                this.items.map(item => '[' + item.str() + ']').join('') +
                ' -= ' +
                this.data.right.str() +
                ';'
            );
        } else {
            return (
                mappingName +
                this.items.map(item => `[${item.str()}]`).join('') +
                ' = ' +
                this.data.str() +
                ';'
            );
        }
    }
}

export class SStore {
    readonly name = 'SStore';

    constructor(
        readonly location: Expr,
        readonly data: Expr,
        readonly variables: IStore['variables']
    ) {
        // if (isVal(this.location)) {
        //     const loc = this.location.toString();
        //     if (loc in this.variables) {
        //         this.variables[loc].types.push(this.data.type);
        //     } else {
        //         this.variables[loc] = new Variable(undefined, [this.data.type]);
        //     }
        // }
    }

    eval() {
        return new SStore(this.location.eval(), this.data.eval(), this.variables);
    }

    toString() {
        let variableName = 'storage[' + this.location.str() + ']';
        const loc = this.location.toString();
        if (this.location.isVal() && loc in this.variables) {
            const label = this.variables[loc].label;
            if (label) {
                variableName = label;
            } else {
                variableName = `var${Object.keys(this.variables).indexOf(loc) + 1}`;
            }
        }
        if (
            this.data instanceof Add &&
            this.data.right instanceof SLoad &&
            this.data.right.location.str() === this.location.str()
        ) {
            return variableName + ' += ' + this.data.left.str() + ';';
        } else if (
            this.data instanceof Sub &&
            this.data.left instanceof SLoad &&
            this.data.left.location.str() === this.location.str()
        ) {
            return variableName + ' -= ' + this.data.right.str() + ';';
        } else {
            return variableName + ' = ' + this.data.str() + ';';
        }
    }
}

export class MappingLoad extends Tag('MappingLoad') {
    readonly type?: string;

    constructor(
        readonly mappings: IStore['mappings'],
        readonly location: number,
        readonly items: Expr[],
        readonly structlocation?: bigint
    ) {
        super();
        if (!(location in mappings)) {
            mappings[location] = {
                name: undefined,
                structs: [],
                keys: [],
                values: [],
            };
        }
        mappings[location].keys.push(items);
    }

    eval() {
        return this;
    }

    str(): string {
        let mappingName = `mapping${this.location + 1}`;
        const maybeName = this.mappings[this.location].name;
        if (this.location in this.mappings && maybeName) {
            mappingName = maybeName;
        }
        if (this.structlocation) {
            return (
                mappingName +
                this.items.map(item => `[${item.str()}]`).join('') +
                '[' +
                this.structlocation.toString() +
                ']'
            );
        } else {
            return mappingName + this.items.map(item => '[' + item.str() + ']').join('');
        }
    }
}

export class SLoad extends Tag('SLoad') {
    readonly name = 'SLOAD';
    readonly type?: string;
    readonly wrapped = false;

    constructor(readonly location: Expr, readonly variables: IStore['variables']) {
        super();
    }

    eval(): Expr {
        return new SLoad(this.location.eval(), this.variables);
    }

    str(): string {
        if (this.location.isVal() && this.location.toString() in this.variables) {
            const label = this.variables[this.location.toString()].label;
            if (label) {
                return label;
            } else {
                return `var${Object.keys(this.variables).indexOf(this.location.toString()) + 1}`;
            }
        } else {
            return 'storage[' + this.location.str() + ']';
        }
    }
}

function parseSha3(sha: Sha3): [number | undefined, Expr[]] {
    const shas = [sha];
    const mappings = [];
    let base = undefined;
    while (shas.length > 0) {
        const sha = shas.shift()!;
        for (const arg of sha.args) {
            if (arg.tag === 'Sha3' && arg.args) {
                shas.unshift(arg);
            } else if (base === undefined && arg.tag === 'Val') {
                base = Number(arg.val);
            } else {
                mappings.unshift(arg);
            }
        }
    }
    return [base, mappings];
}

export const STORAGE = ({ variables, mappings }: IStore) => {
    return {
        SLOAD: ({ stack }: State<Inst, Expr>): void => {
            const loc = stack.pop();

            if (loc.tag === 'Sha3') {
                const [base, parts] = parseSha3(loc);
                if (base !== undefined && parts.length > 0) {
                    stack.push(new MappingLoad(mappings, base, parts));
                } else {
                    stack.push(new SLoad(loc, variables));
                }
            } else if (loc.tag === 'Add' && loc.left.tag === 'Sha3' && loc.right.isVal()) {
                const [base, parts] = parseSha3(loc.left);
                if (base !== undefined && parts.length > 0) {
                    stack.push(new MappingLoad(mappings, base, parts, loc.right.val));
                } else {
                    stack.push(new SLoad(loc, variables));
                }
            } else if (loc.tag === 'Add' && loc.left.isVal() && loc.right.tag === 'Sha3') {
                const [base, parts] = parseSha3(loc.right);
                if (base !== undefined && parts.length > 0) {
                    stack.push(new MappingLoad(mappings, base, parts, loc.left.val));
                } else {
                    stack.push(new SLoad(loc, variables));
                }
            } else {
                stack.push(new SLoad(loc, variables));
            }
        },

        SSTORE: ({ stack, stmts }: State<Inst, Expr>): void => {
            const loc = stack.pop();
            const data = stack.pop();

            if (loc.isVal()) {
                sstoreVariable();
            } else if (loc.tag === 'Sha3') {
                const [base, parts] = parseSha3(loc);
                if (base !== undefined && parts.length > 0) {
                    stmts.push(new MappingStore(mappings, base, parts, data));
                } else {
                    sstoreVariable();
                }
            } else if (loc.tag === 'Add' && loc.left.tag === 'Sha3' && loc.right.isVal()) {
                const [base, parts] = parseSha3(loc.left);
                if (base !== undefined && parts.length > 0) {
                    stmts.push(new MappingStore(mappings, base, parts, data, loc.right.val));
                } else {
                    sstoreVariable();
                }
            } else if (loc.tag === 'Add' && loc.left.isVal() && loc.right.tag === 'Sha3') {
                const [base, parts] = parseSha3(loc.right);
                if (base !== undefined && parts.length > 0) {
                    stmts.push(new MappingStore(mappings, base, parts, data, loc.left.val));
                } else {
                    sstoreVariable();
                }
            } else {
                sstoreVariable();
            }

            function sstoreVariable() {
                if (loc.isVal()) {
                    const key = loc.val.toString();
                    if (key in variables) {
                        variables[key].types.push(data);
                    } else {
                        variables[key] = new Variable(undefined, [data]);
                    }
                }
                stmts.push(new SStore(loc, data, variables));
            }
        },
    };
};
