import * as vscode from 'vscode';

// Toggle in the UI to turn ReLine on or off - should probably be saved per editor

const _state: {
	config: any;
	enabled: WeakMap<vscode.TextEditor, boolean>;
	patterns: {
		match: RegExp;
		replacement: {
			[key: string]: {
				value: (...m: any[]) => string;
				moveCursor?: boolean;
			};
		};
	}[]
} = {
	config:{},
	enabled: new WeakMap<vscode.TextEditor, boolean>(),
	patterns: []
};

export function activate(context: vscode.ExtensionContext) {
	console.log('ReLine activated.');

	loadConfig();

	context.subscriptions.push(
		vscode.commands.registerCommand('reline.toggle', toggleEnabled),
		vscode.commands.registerTextEditorCommand('type', type),

		vscode.workspace.onDidChangeConfiguration(loadConfig)
	);
}

async function type(editor: vscode.TextEditor, _edit: vscode.TextEditorEdit, args: { text: string }): Promise<void> {
	if (getEnabled(editor)) {
		// Process on enter.
		if (args.text === '\r' || args.text === '\n' || args.text === '\r\n') {
			// Track if any of the matched patterns have moveCursor set.
			let moveCursor: boolean = false;
			const lang: string = editor.document.languageId;

			let edits: vscode.TextEdit[] = [];
			// For each of the selections get all TextEdits.
			for (let selection of editor.selections) {
				// Process all lines for the selection.
				for (let i = selection.start.line; i <= selection.end.line; i++) {
					const line = editor.document.lineAt(i);
					for (let pattern of _state.patterns) {
						// If the pattern is defined for the selected language or _ (all languages), try to replace the text.
						const replacement = pattern.replacement[lang] || pattern.replacement._;
						if (replacement) {
							let newVal = line.text.replace(pattern.match, replacement.value);
							if (line.text !== newVal) {
								// If no text is selected and the replacement doesn't move the cursor, add the original newline back on.
								if (selection.isEmpty && !replacement.moveCursor) {
									newVal += args.text;
								}
								// Track whether any pattern has the moveCursor flag set.
								moveCursor ||= replacement.moveCursor ?? false;
								// Delete the existing line and then insert the new value to make the cursor behave consistently.
								edits.push(vscode.TextEdit.delete(line.range));
								edits.push(vscode.TextEdit.insert(line.range.start, newVal));
								break;
							}
						}
					}
				}
			}

			// If there are edits then apply them.
			if (edits.length > 0) {
				const wsEdit = new vscode.WorkspaceEdit();
				wsEdit.set(editor.document.uri, edits);
				await vscode.workspace.applyEdit(wsEdit);
				// Move the cursor to the end of the previous blank line.
				if (moveCursor) {
					await vscode.commands.executeCommand('cursorMove', { to: 'prevBlankLine' });
					await vscode.commands.executeCommand('cursorMove', { to: 'wrappedLineEnd' });
				}
				// Return so we don't have the default type handler try and add extra lines.
				return;
			}
		}
	}
	// We didn't change anything, so process the key normally.
	return vscode.commands.executeCommand('default:type', args);
}

function getEnabled(editor: vscode.TextEditor): boolean {
	if (!_state.enabled.has(editor)) {
		_state.enabled.set(editor, _state.config.enabledByDefault);
	}
	return <boolean>_state.enabled.get(editor);
}

function toggleEnabled(): void {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const enabled = getEnabled(editor);
		_state.enabled.set(editor, !enabled);
	}
}

function loadConfig(): void {
	_state.config = vscode.workspace.getConfiguration("reline");

	loadPatterns();
}

async function loadPatterns(): Promise<void> {
	_state.patterns = [];
	const patternNames: string[] = _state.config.patterns.split(/[,;]/);
	for (let p of patternNames) {
		const loaded = await import(`./patterns/${p.trim()}`);
		_state.patterns = _state.patterns.concat(loaded.default.patterns);
	}
}