export default class {
    static patterns: {
        match: RegExp;
        replacement: {
            [key: string]: {
                value: (...m: any[]) => string;
                moveCursor: boolean;
            };
        };
    }[] = [
            {
                match: /^(\s*)for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+)\s+to\s+(.+)$/,
                replacement: {
                    typescript: { value: (...m) => `${m[1]}for (let ${m[2]} = ${formatTs(m[3])}; ${m[2]} <= ${formatTs(m[4])}; ${m[2]}++) {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
                }
            },
            {
                match: /^(\s*)if\s+([^{]*)$/,
                replacement: {
                    typescript: { value: (...m) => `${m[1]}if (${formatTs(m[2])}) {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
                }
            },
            {
                match: /^(\s*)(.*)\/$/,
                replacement: {
                    typescript: {value: (...m) => `${m[1]}${formatTs(m[2])} {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
                }
            },
            {
                match: /.*/,
                replacement: {
                    typescript: { value: (...m) => formatTs(m[0]), moveCursor: false }
                }
            }
        ];
}

function formatTs(val: string): string {
    return val
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\beq\b/g, '===')
        .replace(/\bneq\b/g, '!==')
        .replace(/\bge\b/g, '>=')
        .replace(/\ble\b/g, '<=');
}