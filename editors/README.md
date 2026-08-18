# Editor support

Highlighting uses one TextMate grammar. Format uses the Java compiler.
Cursor and VS Code share `editors/vscode`. IntelliJ uses the TextMate bundle.

## Cursor

This repository already sets `*.butter` and format-on-save in
`.vscode/settings.json` (Cursor reads that folder). Install the extension
once so the language id `butter` exists:

```text
cursor --install-extension path/to/butter.vsix
```

Or Command Palette → **Developer: Install Extension from Location** →
`editors/vscode`. Reload the window after install. Format still needs
`java tools/harness/Verify.java` so `.butter/build` exists.

## VS Code

Same extension folder as Cursor: `editors/vscode`. Install from location or
from a VSIX. The grammar copy inside the extension must match
`editors/Butter.tmbundle` (the harness checks that).

Format on save calls `butter format --stdin` against `.butter/build/classes`.
Set `butter.java` if `java` is not on PATH.

## IntelliJ IDEA

Settings → Editor → TextMate Bundles → add `editors/Butter.tmbundle`.
That is the IntelliJ highlighting path. This repository does not vendor the
IntelliJ SDK, so there is no compiled JetBrains plugin.

Format is the same CLI. Add an External Tool:

```text
Program: java
Arguments: -cp .butter/build/classes/annotations;.butter/build/classes/core;.butter/build/classes/compiler;.butter/build/classes/cli butter.cli.ButterCli format $FilePath$
Working directory: $ProjectFileDir$
```

On macOS and Linux, replace `;` with `:`.

## Format contract

`butter format` parses then reprints. Invalid files fail closed. Comments are
trivia in the lexer today and are not preserved. Canonical layout is two-space
indent, named arguments after positional, no trailing commas.
