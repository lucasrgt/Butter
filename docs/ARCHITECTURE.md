# Butter Architecture

Modules are physical source roots compiled separately in the order declared
by `harness.properties`. A module may see only its declared dependencies.

```text
annotations          compile-time pairing and actions
signals              Signal / Computed / Effect
core                 WidgetSpec, Binding, utilities, Theme
compiler             parse .butter, bind, theme.toml, fail closed
layout               constraints and deterministic boxes
semantics            roles, ids, actions
runtime              mount, resolve, invalidate
widgets              builtin catalog
render               HostCanvas painter
testing              selectors and clicks
dev                  template reload
cli                  user commands (compile, check, format)
reference            fusion reactor fixture

adapters/minecraft   mapped GuiScreen + HostUi (compiled by --runtime)
```

The compiler resolves props, utilities, bindings, semantics, and the
component graph before runtime when it can. `WidgetExpander` then turns
empty `PlayerInventory` / `ItemGrid` / `UpgradeSlots` into `Slot` children.
Runtime invalidation rebuilds the resolved tree when signals fire. Vanilla
chrome atoms are listed in `docs/LIBRARY.md`.

`.butter` files never embed arbitrary Java. Complex logic lives in the
backing class. One file exposes exactly one `public component`; `private`
components and `let` bindings may share that file.

## Version-independent editor source

The Blockbench editor stores a GUI tree and optional leaf pixel positions.
It exports version-independent `.butter` source through a positioned Stack.
Its separate target profile selects an adapter for compilation/preview; the
source does not embed Minecraft version checks. Beta 1.7.3 is the first profile;
1.7.10, 1.12.2 and modern adapters remain planned, not silently emulated.
