import * as path from 'path';
import * as vscode from 'vscode';

let _state: {
	config: vscode.WorkspaceConfiguration;
	enabled: vscode.Memento;
	statusBar: vscode.StatusBarItem;
	channel: vscode.OutputChannel;
	patterns: {
		match: RegExp;
		replacement: {
			[key: string]: {
				value: (...m: any[]) => string;
				moveCursor: boolean;
			};
		};
	}[]
};

export function activate(context: vscode.ExtensionContext) {
	const toggle: string = 'liner.toggle';

	_state = {
		config: vscode.workspace.getConfiguration('liner'),
		enabled: context.workspaceState,
		statusBar: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 500),
		channel: vscode.window.createOutputChannel("Liner"),
		patterns: []
	};
	_state.statusBar.command = toggle;

	_state.channel.appendLine("Liner activated.");
	_state.channel.appendLine('Configuration loaded.');

	// Library location has not been configured, so ask the user if they would like to set it up.
	if (!_state.config.libraryLocation) {
		vscode.window.showInformationMessage('Liner pattern library location has not been configured, would you like to set it now? (you can always change this later under Settings)', 'Yes', 'No', "I don't want a pattern library").then(answer => {
			if (answer === 'Yes') {
				vscode.window.showOpenDialog({ canSelectFolders: true, title: 'Select Pattern Library Location' }).then(uris => {
					if (uris && uris[0]) {
						_state.config.update('libraryLocation', uris[0].fsPath, true);
					}
				});
			} else if (answer !== 'No') {
				// The "I don't want a pattern library" option.
				_state.config.update('libraryLocation', 'none', true);
			}
		});
	}

	loadPatterns();
	updateStatusBar();

	context.subscriptions.push(
		vscode.commands.registerCommand(toggle, toggleEnabled),
		vscode.commands.registerTextEditorCommand('type', type),

		vscode.window.onDidChangeActiveTextEditor(updateStatusBar),
		vscode.workspace.onDidChangeConfiguration(reloadConfig),
		vscode.workspace.onDidRenameFiles(fileRenamed),

		_state.statusBar,
		_state.channel,
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
								moveCursor ||= replacement.moveCursor;
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

// Get whether the document in the editor has Liner enabled.
function getEnabled(editor: vscode.TextEditor): boolean {
	if (_state.enabled.get(editor.document.uri.toString()) === undefined) {
		_state.enabled.update(editor.document.uri.toString(), _state.config.enabledByDefault);
	}
	return <boolean>_state.enabled.get(editor.document.uri.toString());
}

// Toggle Liner for the document in the current editor.
function toggleEnabled(): void {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const enabled: boolean = getEnabled(editor);
		_state.enabled.update(editor.document.uri.toString(), !enabled);

		updateStatusBar();
	}
}

// Update the status bar with Liner's status, or hide it if it is not a text editor.
function updateStatusBar(): void {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const enabled: boolean = getEnabled(editor);
		_state.statusBar.text = `Liner ${enabled ? 'On' : 'Off'}`;
		_state.statusBar.show();
	} else {
		_state.statusBar.hide();
	}
}

// The enabled flag is tracked by URI, so if it changed then update the flag so Liner
// being enabled properly follows files when being moved or renamed.
function fileRenamed(event: vscode.FileRenameEvent): void {
	for (let file of event.files) {
		// Don't need to check if this is undefined since setting the value to undefined
		// clears the value, which is the desired behavior.
		_state.enabled.update(file.newUri.toString(), _state.enabled.get(file.oldUri.toString()));
		_state.enabled.update(file.oldUri.toString(), undefined);
	}
}

// Reload the configuration and patterns on a settings change.
function reloadConfig(): void {
	_state.config = vscode.workspace.getConfiguration('liner');
	_state.channel.appendLine('Configuration loaded.');
	loadPatterns();
}

// Load the patterns.
async function loadPatterns(): Promise<void> {
	_state.patterns = [];
	const patternNames: string[] = _state.config.patterns.split(/[,;]/);
	for (let patternName of patternNames) {
		const trimmed = patternName.trim();
		let loaded;
		// Try the user's library location first.
		if (_state.config.libraryLocation && _state.config.libraryLocation !== 'none') {
			try {
				loaded = await import(path.join(_state.config.libraryLocation, trimmed));
				_state.channel.appendLine(`${loaded.patterns.length} pattern(s) loaded from '${trimmed}'`);
			} catch { }
		}
		// Try the built-in library if it wasn't in the user library.
		if (!loaded) {
			try {
				loaded = await import(`./patterns/${trimmed}`);
				_state.channel.appendLine(`${loaded.patterns.length} built-in pattern(s) loaded from '${trimmed}'`);
			} catch { }
		}
		if (loaded) {
			_state.patterns = _state.patterns.concat(loaded.patterns);
		} else {
			_state.channel.appendLine(` ** Unable to load pattern library '${trimmed}'`);
		}
	}
}