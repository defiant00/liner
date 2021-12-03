import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('ReLine activated.');

	// Array of top level patterns
	//   endProcessing and moveCursor should be on the array of top level patterns
	//   Patterns can have child patterns that are only run on matches
	// Load from json
	// Toggle in the UI to turn ReLine on or off - should probably be saved per editor
	// Command to toggle ReLine + a hotkey
	// Option to set if it starts enabled or disabled

	const patterns: {
		match: RegExp;
		replacement: {
			[key: string]: {
				value: string;
				moveCursor?: boolean;
			};
		};
	}[] = [
			{
				match: /(\s*)for\s*([a-z]+)\s*in\s*([0-9]+)\s*to\s*([0-9]+)/,
				replacement: {
					plaintext: { value: '$1for (int $2 = $3; $2 <= $4; $2++) {\n$1\t\n$1}', moveCursor: true },
					_: { value: 'nah' }
				}
			},
			{
				match: /.*/,
				replacement: {
					plaintext: { value: '$&; // yay' },
					markdown: { value: '$&' },
					_: { value: '**$&**' }
				}
			},
		];

	let disposable = vscode.commands.registerTextEditorCommand('type', async (editor: vscode.TextEditor, _edit: vscode.TextEditorEdit, args: { text: string }) => {
		// Process on enter.
		if (args.text === '\r' || args.text === '\n' || args.text === '\r\n') {
			// Track if any of the matched patterns have moveCursor set.
			let moveCursor: boolean = false;
			const lang: string = editor.document.languageId;
			const wsEdit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();

			// For each of the selections get all TextEdits.
			wsEdit.set(editor.document.uri, editor.selections.map(selection => {
				let edits: vscode.TextEdit[] = [];
				// Process all lines for the selection.
				for (let i = selection.start.line; i <= selection.end.line; i++) {
					const line = editor.document.lineAt(i);
					for (let pattern of patterns) {
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
				return edits;
			}).flat());
			// If there are edits then apply them.
			if (wsEdit.size > 0) {
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
		// We didn't change anything, so process the key normally.
		return vscode.commands.executeCommand('default:type', args);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
