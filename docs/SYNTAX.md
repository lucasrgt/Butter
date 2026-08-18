# Butter syntax

Preferred form is Flutter-like named parameters inside an explicit
`public component`. A trailing widget tree without `public`/`private` is
only a snippet sugar; screens should name the public component.

```text
private component MetricCard(title: String, child: Widget) {
  Panel(class: "p-4 bg-panel", children: [Text(title, class: "text-sm"), child])
}

public component FusionReactorPanel() {
  Column(
    class: "p-8 gap-4 bg-panel",
    children: [
      MetricCard(title: "Energy output", child: EnergyBar(id: "energy-output"))
    ]
  )
}
```

A file may declare one `public component`, any number of `private component`
helpers, and `let` bindings. `let` is composition, not reactive state.
A `component` without `public` or `private` is a compile error (`B1103`).

Unknown utility tokens, duplicate public components, missing required props,
and type mismatches fail at compile time with `BUTTER B####` diagnostics.
`bg-*`, `border-*`, and `slot-*` names come from the active theme; see
`docs/THEME.md`. Vanilla chrome atoms (`SearchBar`, `Tab`, `TabBar`,
`Scrollbar`, `Separator`) are in `docs/LIBRARY.md`.

`butter format` reprints a parsed file with two-space indent. Editor
highlighting is a TextMate grammar: Cursor and VS Code use `editors/vscode`,
IntelliJ uses `editors/Butter.tmbundle`. See `editors/README.md`.
