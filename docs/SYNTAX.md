# Butter syntax

Preferred form is Flutter-like named parameters:

```text
Column(
  class: "p-8 gap-4",
  children: [
    Text("ME Terminal", class: "text-lg font-bold"),
    Button("Craft", id: "craft", class: "px-8 h-20 bg-accent")
  ]
)
```

A file may declare one public `component`, any number of `private component`
helpers, and `let` bindings. `let` is composition, not reactive state.

Unknown utility tokens, duplicate public components, missing required props,
and type mismatches fail at compile time with `BUTTER B####` diagnostics.
`bg-*`, `border-*`, and `slot-*` names come from the active theme; see
`docs/THEME.md`.

`butter format` reprints a parsed file with two-space indent. Editor
highlighting is a TextMate grammar shared by the VS Code extension and
the IntelliJ TextMate bundle; see `editors/README.md`.
