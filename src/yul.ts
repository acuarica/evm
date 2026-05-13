

export function yul(a: unknown, name: string) {
    let text = '';

    text += `object "${name}" {\n`;
    text += '    code {\n';
    text += a;
    // text += '\n';

    text += '    }\n';
    text += '}\n';

    return text;
}