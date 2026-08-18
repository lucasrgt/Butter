# Mapped HostUi Live Map

## Claim

A mapped b1.7.3 client that opens `ButterGuiScreen` exposes the same flattened
`GameUi` tree Worldline already uses for inventory. `GameUi.click` ignites and
scrams through `HostUi`, Escape clears the tree, `Slot(index: 0)` shows a live
cobblestone stack, and a second click swaps that stack onto the cursor and
back. Two fresh mapped JVMs must emit the same trace.

## Scenario

Boot the Worldline headless client, load a memory world, record the empty
tree, put cobblestone item id `4` x8 in main slot 0, open a Butter reactor
screen, pick up and place the stack, click `ignite`, click `scram`, close with
Escape, and record the empty tree again.

Frozen trace:

```text
closed=-/0/0/-;open=reactor/5/0/4x8;pick=reactor/5/0/-1x0;place=reactor/5/0/4x8;ignite=reactor/5/180000/4x8;scram=reactor/5/0/4x8;closed=-/0/0/-
```

## Exact boundary

The subject uses `UiMinecraftRuntime.ui()` after `B173Gui.open` displays the
Butter screen. Worldline product modules still do not import Butter; the
adapter binds `butter.testing.HostUi` by reflection. `B173Gui.putMain` is a
laboratory seed, not a public `GamePlayer` mutation API.

Canonical command:

```text
java tools/harness/Verify.java --runtime
```

## Non-claims

This is not an official-JAR pixel oracle, not GL item sprites, and not vanilla
container merge/shift-click. Headless smoke does not call `drawScreen` because
mapped `drawRect` needs OpenGL. The official client has no `ButterGuiScreen`.
