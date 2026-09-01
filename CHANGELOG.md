# Changelog

## Unreleased

- Migrated the external suite to the isolated Worldline TestKit 0.3.1 Gradle
  project under `tests/worldline`; specs remain Java 8 and use Butter's own
  compiled module classes.

## Unreleased - Minecraft HostUi adapter

- Adopted the visual GUI builder from Worldline under
  `editors/gui-builder`; it now exports native `.butter` components while
  retaining neutral `GameUiSpec` JSON for Worldline verification.

- Layout utilities `items-*`, `justify-*`, `grow`, `h-full`, `m-*`, and
  `gap-x` / `gap-y` now pack. Variant tokens apply only in that state.
- Added `Flame`, `Checkbox`, `Toggle`, `Radio`, and `GasTank`. Tanks, recipe
  arrows, sliders, and boolean controls paint on the host. `ItemGrid(filter:)`
  hides non-matching slots. Empty `Inventory` expands to 27 slots.
- `HostUi` gained `type`, `backspace`, `setValue`, and `rightClick`. Mapped
  slots merge, right-click split, and shift-move on `mainInventory`.
- Host `Text` tokens (`text-lg`, `font-bold`, `text-muted`) size and color
  the host framebuffer. Mapped `drawString` still uses the default font.
- Added vanilla chrome atoms (`SearchBar`, `Tab`, `TabBar`, `Scrollbar`,
  `Separator`) and `border-vanilla` 1px bevel. SearchBar types on the host,
  tabs select and overlap an adjacent panel by 1px, scrollbar pointer sets
  `value`. See `docs/LIBRARY.md`.
- Named `component` declarations require `public` or `private`. The fusion
  reactor screen uses `public component FusionReactorPanel` instead of a
  trailing widget tree.
- Added a fail-closed TOML theme catalog (`theme.toml`) that extends vanilla
  colors and slot names. Unknown `bg-*` tokens remain compile errors.
- Added `butter format` and editor grammars (Cursor/VS Code extension plus
  IntelliJ TextMate bundle) for `.butter` files.
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
