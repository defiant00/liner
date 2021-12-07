export default class {
    static patterns: {
        match: RegExp;
        replacement: {
            [key: string]: {
                value: (...m: any[]) => string;
                moveCursor?: boolean;
            };
        };
    }[] = [
            {
                match: /(\s*)for\s*([a-z]+)\s*in\s*([0-9]+)\s*to\s*([0-9]+)/,
                replacement: {
                    plaintext: { value: (...m) => `${m[1]}for (int ${m[2]} = ${m[3]}; ${m[2]} <= ${m[4]}; ${m[2]}++) {\n${m[1]}\t\n${m[1]}}`, moveCursor: true },
                    _: { value: () => 'nah' }
                }
            },
            {
                match: /.*/,
                replacement: {
                    plaintext: { value: (...m) => `${m[0]}; // yay` },
                    markdown: { value: (...m) => m[0] },
                    _: { value: (...m) => `**${m[0]}**` }
                }
            },
        ];
}
