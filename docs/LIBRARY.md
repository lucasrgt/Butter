# Vanilla component library

The standard pack is Beta 1.7.3 chrome, not Material. Atoms live in
`WidgetNames`. Screens compose them in `.butter`. Pixel-perfect JAR
textures remain a non-claim until Worldline M10.

Sources: Aero machine maker GUI types, Retronism side-config tabs, and
the Beta Energistics terminal base.

## Map

| Prior work | Butter | Kind |
| --- | --- | --- |
| Panel / furnace background | `Panel` + `bg-panel` + `border-vanilla` | atom + utility |
| 1px highlight / shadow / black | theme `highlight`, `shadow`, `border` | theme |
| CSS-style rounding | not in the standard pack | 9-slice later |
| `slot` / `big_slot` | `Slot` (`class: "w-26 h-26"` for big) | atom |
| `energy_bar` | `EnergyBar` | atom |
| `progress_arrow` | `RecipeProgress` | atom |
| `flame` | not yet | later |
| `fluid_tank` / `gas_tank` | `FluidTank` | atom |
| `separator` | `Separator` | atom |
| `search_box` / `search_box_light` | `SearchBar` (light is theme) | atom |
| `scrollbar` / `scrollbar_tab` / `_left` | `Scrollbar` (place with `Row`/`Column`) | atom |
| Retronism tabs on top | `TabBar(side: "top")` | atom |
| ME sort tabs on left | `TabBar(side: "left")` + `Tab` | atom |
| ME grid | `ItemGrid` | atom |
| Player inventory | `PlayerInventory` | atom |

## New atoms

`SearchBar` — 88×12, inset bevel, `placeholder`, `value`, `focused`. Role
`search`. Click focuses; `type` / `backspace` edit `value`. Filtering stays
in Java (bind `value` to a `Signal<String>`).

`Tab` — label argument, optional `selected`. Role `tab`. Click selects
exclusively inside its `TabBar`.

`TabBar` — lays out `Tab` children. `side` is `"top"`, `"bottom"`,
`"left"`, or `"right"` (left/right are vertical). Attach beside a `Panel`
with `Row`/`Column`; the bar does not own the panel. Adjacent TabBar+Panel
overlap 1px. The selected tab fills panel color and omits the inner bevel.

`Scrollbar` — track plus thumb from `value` / `max`. Role `scrollbar`.
Pointer y sets `value`.

`Separator` — 1–2px rule. Horizontal by default; use `w-` / `h-` to size.

`border-vanilla` — raised 1px bevel after fill. Not corner radius.

SearchBar is host text, not vanilla `GuiTextField` pixels. Tabs merge as
1px host bevel, not Retronism PNG. Scrollbar is track plus thumb, not Aero
9-slice.

See `examples/vanilla/Chrome.butter`.
