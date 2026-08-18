const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

const MODULES = ["annotations", "core", "compiler", "cli"];

function workspaceRoot(document) {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (folder) return folder.uri.fsPath;
  const first = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  return first ? first.uri.fsPath : path.dirname(document.uri.fsPath);
}

function classpath(root) {
  const sep = process.platform === "win32" ? ";" : ":";
  const classes = path.join(root, ".butter", "build", "classes");
  return MODULES.map((name) => path.join(classes, name)).join(sep);
}

function missingClasses(root) {
  const classes = path.join(root, ".butter", "build", "classes");
  return MODULES.some((name) => !fs.existsSync(path.join(classes, name)));
}

function formatText(document) {
  const root = workspaceRoot(document);
  if (missingClasses(root)) {
    throw new Error("Run java tools/harness/Verify.java so .butter/build exists.");
  }
  const java = vscode.workspace.getConfiguration("butter").get("java", "java");
  const result = spawnSync(java, ["-cp", classpath(root), "butter.cli.ButterCli", "format", "--stdin"], {
    input: document.getText(),
    encoding: "utf8"
  });
  const text = ((result.stdout || "") + (result.stderr || "")).trim();
  if (result.status !== 0) {
    throw new Error(text || "butter format failed");
  }
  return result.stdout;
}

function activate(context) {
  context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider("butter", {
    provideDocumentFormattingEdits(document) {
      try {
        const formatted = formatText(document);
        if (formatted === document.getText()) return [];
        const last = document.lineCount > 0 ? document.lineAt(document.lineCount - 1).range.end : new vscode.Position(0, 0);
        return [vscode.TextEdit.replace(new vscode.Range(new vscode.Position(0, 0), last), formatted)];
      } catch (error) {
        vscode.window.showErrorMessage(String(error.message || error));
        return [];
      }
    }
  }));
}

function deactivate() {}

module.exports = { activate, deactivate };
