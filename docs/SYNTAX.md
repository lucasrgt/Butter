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
`bg-*`, `border-*`, `text-*` ink, `font-*` aliases, and `slot-*` names come
from the active theme; see `docs/THEME.md`. Host `Text` honors `text-xs` /
`text-sm` / `text-base` / `text-lg` / `text-xl`, `font-bold`, `text-shadow`,
`wrap`, and `truncate`. `items-*`, `justify-*`, `grow`, `h-full`, `m-*`, and
`gap-x` / `gap-y` pack layout. Variant prefixes (`hover:`, `focus:`,
`disabled:`, `selected:`, `occupied:`) apply only when that state is active.
Vanilla chrome atoms are in `docs/LIBRARY.md`.

`butter format` reprints a parsed file with two-space indent. Editor
highlighting is a TextMate grammar: Cursor and VS Code use `editors/vscode`,
IntelliJ uses `editors/Butter.tmbundle`. See `editors/README.md`.

## Explicit pixel layout

A `Stack` may position direct children using integer `x` and `y` offsets from
its padded content origin. Omitted axes retain Stack alignment. Coordinates
must be in [-32768, 32768]; strings and fractional values fail with B1204.
Positioned children of other containers also fail rather than silently using
flow layout. Width and height still use normal utilities.

```text
public component CrusherControl() {
  Stack(class: "w-176 h-166", children: [
    Slot(0, id: "input", x: 54, y: 33, class: "w-18 h-18"),
    ProgressBar(id: "craft", x: 79, y: 34, class: "w-24 h-17"),
    Slot(1, id: "output", x: 115, y: 33, class: "w-18 h-18")
  ])
}
```

Minecraft version selection belongs to build/adapter configuration, outside
`.butter` source. A template does not change merely because its target changes.
