import { TopLevelFunction } from '../opcodes/jumpi';
import { stringifyInstructions } from './stringifyInstructions';

export default (
    functionName: string,
    functionInstance: TopLevelFunction,
    functionHashes: { [s: string]: string }
): string => {
    let output = '';
    output += 'function ';
    if (functionName in functionHashes) {
        const fullFunction = functionHashes[functionName];
        const fullFunctionName = fullFunction.split('(')[0];
        const fullFunctionArguments = fullFunction
            .replace(fullFunctionName, '')
            .substring(1)
            .slice(0, -1);
        if (fullFunctionArguments) {
            output += fullFunctionName + '(';
            output += fullFunctionArguments
                .split(',')
                .map((a: string, i: number) => a + ' _arg' + i)
                .join(', ');
            output += ')';
        } else {
            output += fullFunction;
        }
    } else {
        output += functionName + '()';
    }
    output += ' ' + functionInstance.visibility;
    if (functionInstance.constant) {
        output += ' view';
    }
    if (functionInstance.payable) {
        output += ' payable';
    }
    if (functionInstance.returns.length > 0) {
        output += ' returns (' + functionInstance.returns.join(', ') + ')';
    }
    output += ' {\n';
    output += stringifyInstructions(functionInstance.items, 4);
    output += '}\n\n';
    return output;
};
