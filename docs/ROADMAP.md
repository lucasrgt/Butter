# Butter Roadmap

A stage is GO only when its contract, non-claims, tests, and canonical
gate are committed.

| Stage | Objective | Current state |
| --- | --- | --- |
| Harness | `Verify.java`, modules, file ceilings | GO |
| B0 | Parse `.butter` into a static widget tree | GO |
| B1 | Row, Column, Stack, Grid, padding, constraints | GO |
| B2 | Host framebuffer for Text, Panel, Button | GO - host |
| B2b | Mapped `GuiScreen` adapter compile | GO - `--runtime` |
| B3 | `@ButterComponent` pairing, fail-closed Java contracts | GO |
| B4 | Signal, Computed, Effect, rebuild on invalidation | GO |
| B5 | Semantic tree with stable IDs and roles | GO |
| B6 | `HostUi` flattened tree Worldline can bind | GO - contract |
| B7 | Slot stacks, PlayerInventory, ItemGrid, Tooltip, swap | GO |
| B8 | Hot reload for `.butter` | GO |
| B9 | Host painters plus mapped stack-count overlay | GO |
| B10 | Fusion reactor reference screen | GO - host E2E |
| Theme catalog | Fail-closed TOML colors and slot names | GO - host |
| Editor grammar | TextMate highlight + `butter format` | GO - host |
| Worldline smoke | Mapped live `ButterGuiScreen` via `GameUi` | GO - `--runtime` |
| Minecraft pixels | Official-JAR framebuffer / GL item icons | Blocked on Worldline M10 |

## Non-claims of v0.1.0

- No official-JAR framebuffer match (Worldline M10).
- No GL item sprites; mapped screens paint `drawRect` / `drawString` counts.
- Slot click is cursor swap, not vanilla merge/shift-click.
- No StationAPI requirement or adapter.
- No public `watch()` API.
- No HTML or browser emulation.
