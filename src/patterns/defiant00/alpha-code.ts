export const patterns: {
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
                javascript: { value: (...m) => `${m[1]}for (let ${m[2]} = ${formatJsTs(m[3])}; ${m[2]} < ${formatJsTs(m[4])}; ${m[2]}++) {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
                typescript: { value: (...m) => `${m[1]}for (let ${m[2]} = ${formatJsTs(m[3])}; ${m[2]} < ${formatJsTs(m[4])}; ${m[2]}++) {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
            }
        },
        {
            match: /^(\s*)if\s+([^{]*)$/,
            replacement: {
                javascript: { value: (...m) => `${m[1]}if (${formatJsTs(m[2])}) {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
                typescript: { value: (...m) => `${m[1]}if (${formatJsTs(m[2])}) {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
            }
        },
        {
            match: /^(\s*)while\s+([^{]*)$/,
            replacement: {
                javascript: { value: (...m) => `${m[1]}while (${formatJsTs(m[2])}) {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
                typescript: { value: (...m) => `${m[1]}while (${formatJsTs(m[2])}) {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
            }
        },
        {
            match: /^(\s*)(.*)\/$/,
            replacement: {
                javascript: { value: (...m) => `${m[1]}${formatJsTs(m[2])} {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
                typescript: { value: (...m) => `${m[1]}${formatJsTs(m[2])} {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
            }
        },
        {
            match: /.*/,
            replacement: {
                javascript: { value: (...m) => formatJsTs(m[0]), moveCursor: false },
                typescript: { value: (...m) => formatJsTs(m[0]), moveCursor: false },
            }
        }
    ];

function formatJsTs(val: string): string {
    return val
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\beq\b/g, '===')
        .replace(/\bneq\b/g, '!==');
}