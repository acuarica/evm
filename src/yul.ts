

export function yul() {
    let text = '';

    text += 'object "runtime" {\n';
    text += '    code {\n';
    text += yulStmts(this.main, 8);
    text += '\n';

    for (const [selector, fn] of Object.entries(this.functions)) {
        const name = fn.label !== undefined ? fnsig(parseSig(fn.label)) : `__$${selector}(/*unknown*/)`;
        const view = fn.constant ? ' view' : '';
        const payable = fn.payable ? ' payable' : '';
        text += ' '.repeat(8) + `function ${name} { // public${view}${payable}\n`;
        text += yulStmts(fn.stmts, 12);
        text += ' '.repeat(8) + '}\n';
        text += '\n';
    }

    text += '    }\n';
    text += '}\n';

    return text;
}