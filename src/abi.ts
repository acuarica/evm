/**
 * The following elementary types exist[1]:
 *
 * - `uint<M>`: unsigned integer type of M bits, 0 < M <= 256, M % 8 == 0. e.g. uint32, uint8, uint256.
 * - `int<M>: two’s complement signed integer type of M bits, 0 < M <= 256, M % 8 == 0.
 * - `address`: equivalent to uint160, except for the assumed interpretation and language typing. For computing the function selector, address is used.
 * - `uint`, `int`: synonyms for uint256, int256 respectively. For computing the function selector, uint256 and int256 have to be used.
 * - `bool`: equivalent to uint8 restricted to the values 0 and 1. For computing the function selector, bool is used.
 * - `fixed<M>x<N>`: signed fixed-point decimal number of M bits, 8 <= M <= 256, M % 8 == 0, and 0 < N <= 80, which denotes the value v as v / (10 ** N).
 * - `ufixed<M>x<N>`: unsigned variant of fixed<M>x<N>.
 * - `fixed`, `ufixed`: synonyms for fixed128x18, ufixed128x18 respectively. For computing the function selector, fixed128x18 and ufixed128x18 have to be used.
 * - `bytes<M>`: binary type of M bytes, 0 < M <= 32.
 * - `function`: an address (20 bytes) followed by a function selector (4 bytes). Encoded identical to bytes24.
 *
 * See also [2] for more information on Types.
 *
 * - [1] https://docs.soliditylang.org/en/v0.8.19/abi-spec.html#types
 * - [2] https://docs.soliditylang.org/en/v0.8.19/types.html
 */
export type Type = (typeof ELEM_TYPES)[number];

/**
 * Determine whether the given `type` is a valid elementary Solidity type.
 *
 * @see {@link Type} definition for more info on `Type`.
 *
 * @param type value to check if it is a valid elementary type.
 * @returns
 */
export function isElemType(type: string): type is Type {
    return (ELEM_TYPES as readonly string[]).includes(type);
}

function getCanonicalType(type: string): string {
    switch (type) {
        case 'uint': return 'uint256';
        case 'int': return 'int256';
        case 'fixed': return 'fixed128x18';
        case 'ufixed': return 'ufixed128x18';
        default: return type;
    }
}

/**
 *
 */
const BITS = [...Array(32).keys()].map(n => (n + 1) * 8) as SizeN<32, [8]>;

/**
 *
 */
const BYTES = [...Array(32).keys()].map(n => n + 1) as SizeN<32, [1]>;

/**
 *
 */
const ELEM_TYPES = [
    'address',
    'address payable',
    'bool',
    'uint',
    ...BITS.map(n => `uint${n}` as const),
    'int',
    ...BITS.map(n => `int${n}` as const),
    'bytes',
    ...BYTES.map(n => `bytes${n}` as const),
    'string',
    'function',
] as const;

class Tokenizer {
    readonly ID_REGEX = /^\w+\b/;

    position = 0;
    constructor(readonly input: string) { }
    next(): [pos: number, kind: 'ID' | 'LIT' | 'TYPE' | 'OP' | null, token: string | null] {
        while (this.input[this.position] === ' ') this.position++;

        const i = this.position;
        const matchType = this.input.slice(i).match(this.ID_REGEX);
        if (matchType) {
            this.position += matchType[0].length;
            const kind = isElemType(matchType[0])
                ? 'TYPE'
                : !Number.isNaN(Number(matchType[0]))
                    ? 'LIT'
                    : 'ID';
            return [i, kind, matchType[0]];
        }
        switch (this.input[i]) {
            case '(':
            case ')':
            case ',':
            case '[':
            case ']':
                this.position++;
                return [i, 'OP', this.input[i]];
        }
        return [i, null, null];
    }

    *[Symbol.iterator](): Generator<[pos: number, kind: 'ID' | 'LIT' | 'TYPE' | 'OP', token: string]> {
        for (let [pos, kind, token] = this.next(); token !== null; [pos, kind, token] = this.next()) {
            yield [pos + 1, kind!, token];
        }
    }
}

class Tokens {
    readonly #tokens: [pos: number, kind: 'ID' | 'LIT' | 'TYPE' | 'OP', token: string][] = [];

    constructor(readonly sig: string) {
        this.#tokens = [...new Tokenizer(sig)];
    }

    peek() {
        if (this.#tokens.length === 0) throw new Error('Reached end of input.');
        return this.#tokens[0];
    }

    next() {
        if (this.#tokens.length === 0) throw new Error('Reached end of input.');
        return this.#tokens.shift()!;
    }

    consume(value: string) {
        const [, , next] = this.next();
        if (next !== value) throw new Error(`Expected '${value}' but got '${next}'`);
    }
}

export type Ty = { type: string, components?: Ty[], arrayLength?: number | null, arrayType?: Ty };

export type SigMember = {
    name: string,
    inputs: ({ name?: string; } & Ty)[],
}

export function parseSig(sig: string): SigMember {
    const tokens = new Tokens(sig);
    let [pos, kind, name] = tokens.next();
    if (name === 'function') [pos, kind, name] = tokens.next();
    if (kind !== 'ID') throw new Error(`Expected function name, found '${name}':${pos}`);

    const inputs = [];
    tokens.consume('(');

    let [, , n] = tokens.peek();
    while (n !== ')') {
        inputs.push(parseParam());
        [, , n] = tokens.peek();
        if (n === ',') tokens.consume(',');
    }
    tokens.consume(')');

    return { name, inputs };

    function parseParam() {
        const ty = parseType();
        const [, kind, name] = tokens.peek();
        if (kind !== 'ID') return { ...ty } as const;
        tokens.consume(name);
        return { ...ty, name } as const;
    }

    function parseType(): Ty {
        const baseType = function () {
            // eslint-disable-next-line prefer-const
            let [pos, , ty] = tokens.peek();
            if (ty === '(') {
                const components = [];
                tokens.consume('(');
                let tupTy;
                [, , ty] = tokens.peek();
                while (ty !== ')') {
                    tupTy = parseType();
                    components.push(tupTy);
                    [, , ty] = tokens.peek();
                    if (ty === ',') tokens.consume(',');
                }
                tokens.consume(')');
                return { type: 'tuple', components } as const;

            } else if (isElemType(ty)) {
                tokens.next();
                return { type: getCanonicalType(ty) } as const;
            } else {
                throw new Error(`Invalid type ${ty}: ${pos}`);
            }
        }();

        const dims: (number | null)[] = [];
        let [, , array] = tokens.peek();
        while (array === '[') {
            tokens.consume('[');
            const [, kind, size] = tokens.peek();
            if (kind === 'LIT') {
                tokens.consume(size);
                tokens.consume(']');
                dims.push(Number(size));
            } else {
                dims.push(null);
                tokens.consume(']');
            }
            [, , array] = tokens.peek();
        }

        return dims.reduce<Ty>((ty, size, i) => {
            return {
                type: `${baseType.type}${dims.slice(0, i + 1).map(size => `[${size === null ? '' : size}]`).join('')}`,
                // baseType: 'array',
                arrayType: ty,
                arrayLength: size
            };
        }, baseType);
    }
}

/**
 * 
 * https://docs.soliditylang.org/en/develop/abi-spec.html#handling-tuple-types
 * 
 * @param member 
 */
export function sighash(member: ReturnType<typeof parseSig>): string {
    return `${member.name}(${member.inputs.map(sighashType).join(',')})`;

    function sighashType(ty: Ty): string {
        if (ty.arrayType !== undefined) {
            const len = ty.arrayLength === null ? '' : ty.arrayLength;
            return `${sighashType(ty.arrayType)}[${len}]`;
        } else if (ty.type === 'tuple') {
            return `(${ty.components!.map(sighashType).join(',')})`;
        } else {
            return ty.type;
        }
    }
}
