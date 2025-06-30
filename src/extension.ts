import * as vsc from 'vscode';

enum Dir {
	Up = 1,
	Down,
	Left,
	Right,
	None,
}

let drawMode = false;
let lastDir = Dir.None;

export function activate(context: vsc.ExtensionContext) {
	const setContext = (key: string, value: any) =>
		vsc.commands.executeCommand('setContext', key, value);

	const insertAtCursor = (dir: string) => {
		const editor = vsc.window.activeTextEditor;
		if (!editor) return;

		let old_a = editor.selection.anchor;
		let old_b = editor.selection.active;
		let old_replacement = '';

		let a = editor.selection.anchor;
		let b = editor.selection.active;
		if (a === b) {
			b = new vsc.Position(b.line, b.character + 1);
		}
		let y = a.line;
		let a_x = a.character;
		let b_x = b.character;

		if (b_x - a_x !== 1) return;
		if (a.line !== b.line) return;

		let char = '';
		switch (dir) {
			case '←':
				a = new vsc.Position(y, a_x - 1);
				b = new vsc.Position(y, b_x - 1);
				if (lastDir === Dir.Up) { old_replacement = '┓'; }
				if (lastDir === Dir.Down) { old_replacement = '┛'; }
				lastDir = Dir.Left;
				char = '━';
				break;
			case '→':
				a = new vsc.Position(y, a_x + 1);
				b = new vsc.Position(y, b_x + 1);
				if (lastDir === Dir.Up) { old_replacement = '┏'; }
				if (lastDir === Dir.Down) { old_replacement = '┗'; }
				lastDir = Dir.Right;
				char = '━';
				break;
			case '↑':
				a = new vsc.Position(y - 1, a_x);
				b = new vsc.Position(y - 1, b_x);
				if (lastDir === Dir.Left) { old_replacement = '┗'; }
				if (lastDir === Dir.Right) { old_replacement = '┛'; }
				lastDir = Dir.Up;
				char = '┃';
				break;
			case '↓':
				a = new vsc.Position(y + 1, a_x);
				b = new vsc.Position(y + 1, b_x);
				if (lastDir === Dir.Left) { old_replacement = '┏'; }
				if (lastDir === Dir.Right) { old_replacement = '┓'; }
				lastDir = Dir.Down;
				char = '┃';
				break;
		}

		let old_rng = new vsc.Selection(old_a, old_b);
		let rng = new vsc.Selection(a, b);
		editor.edit(editBuilder => {
			editBuilder.replace(rng, char);
			if (old_replacement === '') return;
			editBuilder.replace(old_rng, old_replacement);
		}, {
			undoStopBefore: false,
			undoStopAfter: false,
		});

		const newSelection = new vsc.Selection(a, b);
		editor.selection = newSelection;

	};

	// If startBlock is true, it's the start of an atom, if it's false, it's the end of an atom
	const addUndoMarker = async (startBlock: boolean) => {
		const editor = vsc.window.activeTextEditor;
		if (editor) {
			await editor.edit(() => { }, {
				undoStopBefore: startBlock,
				undoStopAfter: !startBlock,
			});
		}
	};

	context.subscriptions.push(
		vsc.commands.registerCommand('drawlines.start', async () => {
			drawMode = true;
			setContext('drawlines.mode', 'active');
			const editor = vsc.window.activeTextEditor;
			addUndoMarker(true);
			vsc.commands.executeCommand('toggleVim');
			vsc.window.showInformationMessage('Line drawing mode ON');
		}),

		vsc.commands.registerCommand('drawlines.exit', async () => {
			drawMode = false;
			lastDir = Dir.None;
			setContext('drawlines.mode', 'inactive');
			addUndoMarker(false);
			vsc.commands.executeCommand('toggleVim');
			vsc.window.showInformationMessage('Line drawing mode OFF');
		}),

		vsc.commands.registerCommand('drawlines.left', () => {
			if (drawMode) insertAtCursor('←');
			vsc.window.showInformationMessage('LEFT');
		}),
		vsc.commands.registerCommand('drawlines.right', () => {
			if (drawMode) insertAtCursor('→');
		}),
		vsc.commands.registerCommand('drawlines.up', () => {
			if (drawMode) insertAtCursor('↑');
		}),
		vsc.commands.registerCommand('drawlines.down', () => {
			if (drawMode) insertAtCursor('↓');
		})
	);
}

export function deactivate() {
}
