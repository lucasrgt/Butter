# Butter semantics

Butter owns UI semantics. Worldline consumes a flattened `HostUi` snapshot.

Overlapping Minecraft roles use the Worldline `GameUiNode` vocabulary:

| Widget | Role |
| --- | --- |
| `Slot`, `UpgradeSlots` | `slot` |
| `FluidTank` | `tank` |
| `EnergyBar` | `energy` |
| `ProgressBar`, `RecipeProgress` | `progress` |
| `Inventory`, `PlayerInventory`, `ItemGrid` | `inventory` |

PRD aliases `item_slot` and `fluid_tank` canonicalize to `slot` and `tank`.
Butter-only roles stay: `button`, `text`, `slider`, `machine`, `model`, `tooltip`,
`search`, `tab`, `tablist`, `scrollbar`, `separator`.

`SearchBar` infers role `search`, click, and a label from `placeholder`.
Typed text is `value`. `Tab` infers `tab` plus click; click selects inside
the parent `TabBar`. `Scrollbar` infers `scrollbar` plus `set_value`.

Empty `PlayerInventory` expands to 36 indexed `Slot`s (`player-0`..`player-35`).
Empty `ItemGrid` expands to `slots` (default 9) unindexed `Slot`s. Empty
`UpgradeSlots` expands to 4 unindexed `Slot`s.

`HostUi.nodes()` is a flat list: one `screen/{id}` node plus every widget that
has a semantic id. Numeric `value` props are exported as `count` so Worldline
`GameUiNode.count()` can observe energy, tanks, and progress.

`Slot` exports `item` as `itemId` and `count` as stack size. A live
`ButterGuiScreen` overlays `Slot(index: n)` from `player.inventory.mainInventory[n]`
and left-click swaps that slot with the cursor stack.
