# Changelog

## Unreleased - Minecraft HostUi adapter

- Added a fail-closed TOML theme catalog (`theme.toml`) that extends vanilla
  colors and slot names. Unknown `bg-*` tokens remain compile errors.
- Added `butter format` and editor grammars (VS Code extension plus IntelliJ
  TextMate bundle) for `.butter` files.
- Aligned overlapping widget roles with Worldline (`slot`, `tank`, `energy`).
- Added `HostUi` / `HostUiNode` so Worldline can consume a flattened tree
  without importing Butter into `worldline-api`.
- Added `ButterGuiScreen` against mapped b1.7.3 `GuiScreen`. Compile with
  `java tools/harness/Verify.java --runtime`.
- Numeric widget values export as `HostUiNode.count`.
- `Slot` exports `item`/`count`; live `Slot(index)` overlays player
  `mainInventory` and left-click swaps with the cursor stack.
- Empty `PlayerInventory` / `ItemGrid` / `UpgradeSlots` expand into `Slot`s.
- Host renderer paints slot glyphs; mapped `drawScreen` overlays stack counts.
- Added a two-process mapped `HostUi` live smoke (`smokes/hostui-live`).
- Official-JAR framebuffer match remains a non-claim.

## 0.1.0 - Host runtime

Status: GO.

- Added the zero-dependency `Verify.java` gate with per-file ceilings,
  isolated module compilation, and fail-closed tests.
- Added the `.butter` compiler, Java backing contracts, signals, layout,
  semantics, host renderer, testing selectors, hot template reload, and CLI.
- Added the fusion-reactor reference screen as the first complex fixture.
- Real Minecraft Beta 1.7.3 rendering remains a non-claim of this milestone.
