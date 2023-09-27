import type { IEvents } from './ast/log';
import type { IStore } from './ast/storage';

/**
 *
 * @param events
 * @returns
 */
export function stringifyEvents(events: IEvents) {
    let text = '';

    for (const [topic, event] of Object.entries(events)) {
        text += 'event ';
        if (event.sig === undefined) {
            text += topic;
        } else {
            const eventName = event.sig.split('(')[0];
            const params = event.sig.replace(eventName, '').substring(1).slice(0, -1);
            if (params) {
                text += eventName + '(';
                text += params
                    .split(',')
                    .map((param, i) =>
                        i < event.indexedCount ? `${param} indexed _arg${i}` : `${param} _arg${i}`
                    )
                    .join(', ');
                text += ')';
            } else {
                text += event.sig;
            }
        }
        text += ';\n';
    }

    return text;
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
            .map(expr => (expr.isVal() ? 'bigint' : expr.type ?? ''))
            .filter(t => t.trim() !== '');
        if (types.length === 0) {
            types.push('unknown');
        }
        const name = variable.label ? ` public ${variable.label}` : ` var${index + 1}`;
        output += [...new Set(types)].join('|') + name + '; // Slot #' + hash;
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
                const mappingChild0 = mappingChild[0];
                if (
                    mappingChild.length > 0 &&
                    mappingChild0.type &&
                    !mappingKey.includes(mappingChild0.type)
                ) {
                    mappingKey.push(mappingChild0.type);
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
                    mapping.values.forEach(mappingChild2 => {
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
