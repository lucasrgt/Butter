# Editor support

Highlighting uses one TextMate grammar. Format uses the Java compiler.

## VS Code

Install the folder `editors/vscode` with **Install from VSIX** after packaging,
or **Developer: Install Extension from Location**.

The grammar lives in `editors/Butter.tmbundle`. Format on save calls
`butter format --stdin` against `.butter/build/classes` produced by
`java tools/harness/Verify.java`. Set `butter.java` if `java` is not on PATH.

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
