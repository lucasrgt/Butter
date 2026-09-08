# Butter semantics

Butter owns UI semantics. Worldline consumes a flattened `HostUi` snapshot.

## Blockbench authoring (0.6)

The native Properties panel exposes a Semantics section on the screen and on
each supported component. Metadata is saved in the document's `semantics` map,
keyed by internal widget ID. It survives document JSON and native `.bbmodel`
round-trips. The stable semantic ID is independent of the editable layer name.
Legacy documents acquire stable IDs and container indices when normalized.

| Configuration | Supported components | Contract |
| --- | --- | --- |
| ID, role, label, description | All | Roles must match the component's capabilities |
| Expose region | Row, Column, Player inventory | Include the group in the public tree |
| Container slot | Slot | Persistent index in `0..4095` |
| First container slot | Player inventory | Reserves 36 consecutive indices |
| Tab order | Search | Unique explicit index in `0..511` |
| `enabled`, `visible` bindings | All | Java boolean, signal or getter |
| `item`, `count` bindings | Slot | Java integer, signal or getter |
| `value`, `max` bindings | Progress, Energy, Tank | Java number, signal or getter |
| `value`, `readOnly` bindings | Search | String and boolean respectively |
| Click handler | Slot, Search | A public no-argument `void` method annotated `@ButterAction` |

Duplicating or pasting components assigns new semantic IDs and slot indices,
clears explicit tab order, and preserves labels, bindings and handlers. Rename,
reorder and reparent operations retain existing IDs and indices. Semantic edits
participate in normal undo/redo and respect locked layers.

Use **Semantics / Tree** to inspect the declared contract, or export **Semantic
tree JSON**. `butter_semantics` exposes inspection, update, reset, tree and
validation through MCP. A null patch value removes an override. Reset keeps the
stable ID and allocated slot index. The `semantics` export contains declarations
and binding symbols; it explicitly reports `runtimeObserved: false` and
`compilerValidated: false`. Editor validation does not execute Java.

## Java and runtime contract

```butter
Stack(id: "crusher.control", semantics: (role: screen, label: "Crusher"), children: [
  Slot(id: "ore.input", container_index: 42,
       semantics: (label: "Ore input", description: "Primary input"),
       item: inputItem, count: inputCount, enabled: ready, action: activate),
  SearchBar(id: "ore.query", tabIndex: 0, value: query, readOnly: locked)
])
```

Compile against the backing class to validate actual member types and action
annotations. A template compiled without a backing class retains symbolic
references; mounting unresolved state without a backing instance fails.
Search values must be writable String fields or `Signal<String>` unless
`readOnly: true` is declared literally. A computed or getter-only String cannot
be used as an editable search model. Dotted paths traverse public fields or
no-argument getters.

The runtime propagates disabled/hidden parent state to descendants. Hidden
widgets are omitted from painting and pointer hit-testing but remain observable
in the semantic tree with `visible=false`. Disabled or hidden controls reject
direct action dispatch. Read-only search controls preserve their value during
typing and backspace. Tab/Shift+Tab visit visible, enabled searches by explicit
tab order, followed by unspecified searches in document order.

`container_index` is the persistent public slot selector. It does not create a
Minecraft `Container`, bind a machine inventory, or designate a player inventory
cell. The separate existing `Slot(index: n)` property binds
`player.inventory.mainInventory[n]` in `ButterGuiScreen`. Applications own that
runtime wiring. The editor-generated player slot region currently declares the
36 semantic slots and their geometry; automatic game inventory wiring is not
part of that export.

`HostUiNode.attributes()` carries provider-owned ID, label, description, value,
maximum, visibility, enabled state, focus, read-only state, text and tab order
where applicable. Inventory overlays preserve these attributes. A configured
screen root supplies `HostUi.screen()` and is emitted once. Explicit container
indices survive flattening; legacy slots without one receive unused indices.

Worldline's optional Butter bridge reads these attributes and detects an
optional `press(String)` method. Butter supports `TAB`, `SHIFT_TAB` and
`BACKSPACE`; Worldline maps `REVERSE_TAB` to `SHIFT_TAB`. Other keys remain
unsupported. Butter's product modules have no Worldline dependency.

`GameUiSpec.matchesStructure()` compares role, name and index. Tests that depend
on labels or state must additionally assert those attributes or use selectors
such as `getById`, `getByLabel`, `shouldBeDisabled` and `shouldBeReadOnly`.

## Verification scope

The Butter gate includes semantic type failures, stable slot and alias dispatch,
state propagation, writable search bindings and focus traversal. Its runtime
profile runs the existing inventory/action scenario plus semantic acceptance
against a mapped `ButterGuiScreen` through Worldline in two fresh processes.
This is input/state evidence, not an official-JAR pixel comparison.

The Worldline bridge has a focused host contract test. Changes to that bridge
also change Worldline's broad smoke fingerprints: its full runtime gate must
be requalified through the normal evidence workflow before release. A focused
test or Butter runtime pass does not replace Worldline's aggregate gate.

Overlapping Minecraft roles use the Worldline `GameUiNode` vocabulary:

| Widget | Role |
| --- | --- |
| `Slot`, `UpgradeSlots` | `slot` |
| `FluidTank`, `GasTank` | `tank` |
| `EnergyBar` | `energy` |
| `ProgressBar`, `RecipeProgress` | `progress` |
| `Inventory`, `PlayerInventory`, `ItemGrid` | `inventory` |

PRD aliases `item_slot` and `fluid_tank` canonicalize to `slot` and `tank`.
Butter-only roles stay: `button`, `text`, `slider`, `machine`, `model`, `tooltip`,
`search`, `tab`, `tablist`, `scrollbar`, `separator`, `flame`, `checkbox`,
`toggle`, `radio`.

`SearchBar` infers role `search`, click, and a label from `placeholder`.
Typed text is `value`. `Tab` infers `tab` plus click; click selects inside
the parent `TabBar`. `Scrollbar` infers `scrollbar` plus `set_value`.

Empty `PlayerInventory` expands to 36 indexed `Slot`s (`player-0`..`player-35`).
Empty `Inventory` expands to 27 unindexed `Slot`s. Empty `ItemGrid` expands to
`slots` (default 9) unindexed `Slot`s. Empty `UpgradeSlots` expands to 4
unindexed `Slot`s. `base: n` on `ItemGrid` / `UpgradeSlots` writes `index` from `n`.

`HostUi` adds `type`, `backspace`, `setValue`, and `rightClick` beside `click`.
`HostUi.nodes()` is a flat list: one `screen/{id}` node plus every widget that
has a semantic id. Numeric `value` props are exported as `count` so Worldline
`GameUiNode.count()` can observe energy, tanks, and progress. Nodes also export
`label`, `enabled`, and `focused`.

`Slot` exports `item` as `itemId` and `count` as stack size. A live
`ButterGuiScreen` overlays `Slot(index: n)` from `player.inventory.mainInventory[n]`.
Left-click merges or swaps; right-click splits or places one; shift-click moves
between hotbar and the rest of `mainInventory`.
