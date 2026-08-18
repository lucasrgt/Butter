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
Runtime invalidation rebuilds the resolved tree when signals fire.

`.butter` files never embed arbitrary Java. Complex logic lives in the
backing class. One file exposes exactly one public component; private
components and `let` bindings may share that file.
