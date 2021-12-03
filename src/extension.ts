import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('ReLine activated.');

	// Array of top level patterns
	// Patterns can have child patterns that are only run on matches
	// Flag to move cursor
	// Flag for if a pattern ends processing? Or do all top level patterns end processing,
	//	and child patterns do not? Probably better to have a flag for more control.
	// Load from json
	// Language identifier - replacement as a language => string map?
	//	- need to have a generic fallthrough match as well, maybe '*'?
	// Toggle in the UI to turn ReLine on or off - should probably be saved per editor
	// Command to toggle ReLine + a hotkey
	// Option to set if it starts enabled or disabled

	const patterns = [
		{ regex: /(\s*)for\s*([a-z]+)\s*in\s*([0-9]+)\s*to\s*([0-9]+)/, replacement: '$1for (int $2 = $3; $2 <= $4; $2++) {\n$1\t\n$1}' },
		{ regex: /.*/, replacement: '$&; //yay\n\n\n[after]' },
	];

	let disposable = vscode.commands.registerTextEditorCommand('type', async (editor: vscode.TextEditor, _edit: vscode.TextEditorEdit, args: { text: string }) => {
		if (args.text === '\r' || args.text === '\n' || args.text === '\r\n') {
			const we: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
			we.set(editor.document.uri, editor.selections.map(selection => {
				let edits: vscode.TextEdit[] = [];
				for (let i = selection.start.line; i <= selection.end.line; i++) {
					const line = editor.document.lineAt(i);
					for (let pattern of patterns) {
						const newVal = line.text.replace(pattern.regex, pattern.replacement);
						if (line.text !== newVal) {
							edits.push(vscode.TextEdit.delete(line.range));
							edits.push(vscode.TextEdit.insert(line.range.start, newVal));
							break;
						}
					}
				}
				return edits;
			}).flat());
			if (we.size > 0) {
				await vscode.workspace.applyEdit(we);
				await vscode.commands.executeCommand('cursorMove', { to: 'prevBlankLine' });
				await vscode.commands.executeCommand('cursorMove', { to: 'wrappedLineEnd' });
				return;
			}
		}
		return vscode.commands.executeCommand('default:type', args);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
