<h1 align="center">Butter</h1>

<p align="center"><strong>Flutter and Tailwind inspired UI for Minecraft Beta 1.7.3.</strong></p>

<p align="center">
  <a href="#getting-started">Getting Started</a> |
  <a href="#capabilities">Capabilities</a> |
  <a href="#fail-closed-model">Contracts</a> |
  <a href="#documentation">Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/milestone-v0.1.0%20host%20runtime%20GO-2EA44F?style=flat-square" alt="v0.1.0 host runtime GO">
  <img src="https://img.shields.io/badge/inspired%20by-Flutter%20%2B%20Tailwind-02569B?style=flat-square" alt="Flutter and Tailwind inspired">
  <img src="https://img.shields.io/badge/Minecraft-Beta%201.7.3-62B47A?style=flat-square" alt="Minecraft Beta 1.7.3">
  <img src="https://img.shields.io/badge/product-Java%208-5586A4?style=flat-square" alt="Java 8 product">
  <img src="https://img.shields.io/badge/harness-JDK%2021-6B5B95?style=flat-square" alt="JDK 21 harness">
</p>

Butter is a compiler-first UI framework for Minecraft Beta 1.7.3, inspired by
Flutter and Tailwind. Screens are Flutter-style component trees in `.butter`
files, paired with typed Java backing classes. Angular-style contracts and
signals own behavior. A fail-closed Tailwind-like utility catalog and TOML
theme own style. A semantic tree is what Worldline and tests query.

The player runtime is a small Java library plus a Minecraft-native adapter.
Worldline is the laboratory used to validate Butter. Players do not need
that laboratory to open a screen.

<table>
<tr><td><b>Templates first</b></td><td><code>.butter</code> files describe structure, style, bindings, and semantics. Java never hides inside the template.</td></tr>
<tr><td><b>Fail-closed contracts</b></td><td>Unknown utilities, missing actions, wrong types, and duplicate IDs are compile errors with <code>BUTTER B####</code> diagnostics.</td></tr>
<tr><td><b>One semantic owner</b></td><td>Butter owns widget metadata. Worldline consumes a flattened <code>HostUi</code> tree by reflection and does not import Butter types.</td></tr>
<tr><td><b>Theme, not plugins</b></td><td>A TOML subset extends vanilla colors and slot names. Unknown <code>bg-*</code> tokens stay compile errors.</td></tr>
<tr><td><b>Honest pixels</b></td><td>Host-canvas tests prove layout and interaction. Official-JAR framebuffer match remains a later proof.</td></tr>
</table>

---

## Runtime matrix

| Target | Game/runtime | Toolchain | Distribution model |
| --- | --- | --- | --- |
| Host runtime | No Minecraft window | Product `--release 8`, harness JDK 21 | Pure-Java compile, layout, signals, framebuffer, CLI |
| Mapped adapter | Minecraft Beta 1.7.3 through a mapped client | `Verify.java --runtime` | `ButterGuiScreen` against mapped `GuiScreen` |
| Worldline lab | Mapped live `HostUi` via `GameUi` | Sibling Worldline workspace | Reflection bind; `worldline-api` stays Butter-free |

The `main` line currently declares version `0.1.0` and milestone `host-runtime`
in `release/butter.properties`. StationAPI is not a requirement and has no
adapter in this repository.

---

## Getting started

### 1. Run the canonical gate

Requirements:

- JDK 21 for the repository harness
- Product modules compile with `--release 8`

```text
java tools/harness/Verify.java
```

The gate checks per-file source ceilings, compiles modules in the order
declared by `harness.properties`, treats warnings as errors, and runs the
complete test suite. Derived output is written to `.butter/build/`.

Minecraft-linked adapter compilation needs a mapped b1.7.3 client (see
`harness.properties` `runtime.workspace`) and:

```text
java tools/harness/Verify.java --runtime
```

Host-canvas tests do not replace that compile, and that compile does not
replace an official-JAR pixel oracle.

### Worldline TestKit consumer

Butter carries external Java 8 specs under `tests/worldline/`. The isolated
Gradle project uses `dev.worldline.test` 0.2.0 rather than Worldline repository
sources and exercises formatting, compilation, runtime mounting, and semantic
lookup in host-only mode. Run:

```text
tests/worldline/gradlew.bat -p tests/worldline worldlineDoctor worldlineTest
```

### 2. Author a template

Preferred form is Flutter-like named parameters. Save as `Hello.butter`:

```text
public component Hello() {
  Column(
    class: "p-8 gap-4",
    children: [
      Text("ME Terminal", class: "text-lg font-bold"),
      Button("Craft", id: "craft", class: "px-8 h-20 bg-accent")
    ]
  )
}
```

A file exposes exactly one `public component`. `private component` helpers and
`let` bindings may share the file. `let` is composition, not reactive state.

A working copy lives at [`examples/hello/Hello.butter`](examples/hello/Hello.butter).

### 3. Pair a Java backing class

Complex logic stays in Java. The compiler fail-closes if an `action` or
enabled binding is missing from the backing type:

```java
@ButterComponent(template = "Panel.butter")
public static final class Panel {
    public boolean canCraft() { return true; }
    @ButterAction public void craft() {}
}
```

Signals, computed values, and actions for the fusion-reactor fixture are in
[`FusionReactorPanel.java`](modules/reference/src/main/java/butter/reference/FusionReactorPanel.java).

### 4. Compile, check, and format

After a successful verify, the CLI is on the harness classpath:

```text
java -cp .butter/build/classes/annotations;.butter/build/classes/core;.butter/build/classes/compiler;.butter/build/classes/cli butter.cli.ButterCli compile examples/hello/Hello.butter
java -cp ... butter.cli.ButterCli check modules/reference/src/main/butter
java -cp ... butter.cli.ButterCli format examples/hello/Hello.butter
```

On Unix classpaths, replace `;` with `:`. `format --stdout` and `format --stdin`
exist for editor integration. Invalid templates fail closed; the formatter
does not invent syntax. Cursor highlighting is the VS Code extension in
[`editors/vscode`](editors/vscode); see [`editors/README.md`](editors/README.md).

Place `theme.toml` next to a `.butter` file or directory to extend vanilla
colors. See [`docs/THEME.md`](docs/THEME.md) and [`examples/thaum/`](examples/thaum/).

---

## Authoring workflow

```text
.butter + theme.toml + @ButterComponent Java
                    |
                    v
              compiler (fail closed)
                    |
      +-------------+-------------+
      |                           |
      v                           v
 widget tree                 semantic tree
      |                           |
      v                           v
 layout + host framebuffer    HostUi snapshot
      |                           |
      v                           v
 ButterGuiScreen (mapped)     Worldline GameUi
```

`.butter` files never embed arbitrary Java. Worldline may consume the
semantic tree; it does not own Butter widget metadata.

---

## Capabilities

### Templates and compiler

| Capability | What it provides |
| --- | --- |
| `.butter` syntax | Named parameters, lists, records, `public component`, `private component`, `let` |
| Fail-closed diagnostics | `BUTTER B####` for unknown utilities, types, actions, and duplicate IDs |
| Java contracts | `@ButterComponent` template pairing and `@ButterAction` methods |
| Pretty-printer | Deterministic `butter format` from the same parser the compiler uses |

### Widgets, layout, and paint

| Capability | What it provides |
| --- | --- |
| Layout | `Row`, `Column`, `Stack`, `Grid`, padding, gap, width/height, alignment |
| Chrome | `Panel`, `Text`, `Button`, `Slider`, `Tooltip`, `Spacer`, `SearchBar`, `Tab`, `TabBar`, `Scrollbar`, `Separator` |
| Machine widgets | `EnergyBar`, `ProgressBar`, `FluidTank`, `MachinePanel`, `RecipeProgress` |
| Inventory | `Slot`, `PlayerInventory`, `ItemGrid`, `UpgradeSlots` expand into slots |
| Host framebuffer | Deterministic `HostRenderer` fills, glyphs, and hit testing |
| Mapped overlay | `ButterGuiScreen` paints `drawRect` / `drawString` stack counts |

### Runtime and semantics

| Capability | What it provides |
| --- | --- |
| Signals | `Signal`, `Computed`, `Effect`; rebuild on invalidation; no public `watch()` |
| Semantic roles | Worldline-aligned `slot`, `tank`, `energy`, `progress`; Butter-only roles stay local |
| `HostUi` | Flattened `[screen/{id}, …widgets with ids]` for tests and Worldline |
| Live slots | `Slot(index)` overlays `mainInventory`; left-click swaps with the cursor |
| Template reload | `.butter` reload without DCEVM; Java still uses `javac` |
| Reference screen | Fusion reactor fixture under `modules/reference` |

### Themes

| Capability | What it provides |
| --- | --- |
| Vanilla catalog | Built-in `panel`, `accent`, `tooltip`, `button`, `text`, `energy`, `slot`, `highlight`, `shadow`, `border`, `muted` |
| TOML overlay | `id`, `[colors]`, `[slots]`, `[fonts]`; `#RRGGBB` / `#AARRGGBB` |
| Token unlock | A color named `vis` makes `bg-vis` and `border-vis` legal |
| Host lookup | `HostRenderer` paints `bg-*` from the active theme |

---

## Template example

A public component can compose private helpers. Bindings stay symbolic until
mount:

```text
public component ReactorControls() {
  Row(
    class: "gap-4",
    children: [
      Button("Ignite", id: "ignite", enabled: canIgnite, action: ignite, class: "px-8 h-20 bg-accent"),
      Button("Standby", id: "standby", action: standby, class: "px-8 h-20"),
      Button("SCRAM", id: "scram", enabled: canScram, action: scram, class: "px-8 h-20 bg-accent")
    ]
  )
}
```

Theme overlays are a fail-closed TOML subset, not a plugin system:

```toml
id = "thaumcraft"

[colors]
panel = "#1A1020"
accent = "#6B3DAA"
vis = "#2E8B57"
arcane = "#C9A227"

[slots]
research = "gui/thaum/slot.png"
```

Unknown tables, unquoted values, and unknown `bg-*` / `border-*` / `slot-*`
tokens are compile errors. Vanilla remains the base catalog.

The complete fusion-reactor tree is
[`modules/reference/src/main/butter/`](modules/reference/src/main/butter/).
Syntax rules live in [`docs/SYNTAX.md`](docs/SYNTAX.md). Theme rules live in
[`docs/THEME.md`](docs/THEME.md).

---

## Fail-closed model

Butter does not treat unknown style or a missing action as a runtime surprise.
The compiler is the gate; the harness is the second gate.

### Compile diagnostics

| Condition | Code |
| --- | --- |
| Unexpected syntax | `B1001` |
| Multiple public components | `B1101` |
| Component missing `public` or `private` | `B1103` |
| Property type mismatch | `B1204` |
| Unknown utility token | `B1301` |
| Missing `@ButterAction` | `B1401` |
| Duplicate semantic id | `B1501` |
| Unknown component | `B1601` |
| Invalid `theme.toml` | `B1701`–`B1705` |

### Source ceilings

There is no total line budget. Tests are unlimited. Product behavior may not
move into tests, generated files, or harness code to evade a per-file ceiling.

| Kind | Max code lines per file | Roots |
| --- | --- | --- |
| Product | 200 | `modules/*/src/main/java` |
| Harness | 300 | `tools/` |
| Smoke | 150 | `smokes/` |
| Adapter | 150 | `adapters/` |

Modules compile separately. A module may depend only on modules listed in
`harness.properties`. Cycles fail closed.

---

## Architecture

```text
annotations          compile-time pairing and actions
signals              Signal / Computed / Effect
core                 WidgetSpec, Binding, utilities, Theme
compiler             parse .butter, bind, theme.toml, format, fail closed
layout               constraints and deterministic boxes
semantics            roles, ids, actions
runtime              mount, resolve, invalidate
widgets              builtin catalog
render               HostCanvas painter
testing              HostUi, selectors, clicks
dev                  template reload
cli                  compile, check, format, version
reference            fusion reactor fixture

adapters/minecraft   mapped GuiScreen + HostUi (compiled by --runtime)
```

The dependency direction is deliberate: compiler, signals, and core do not
import Minecraft. `adapters/minecraft` is compiled by `--runtime` and must
not appear on those product classpaths.

The complete module map is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
The behavioral and engineering constitution is in [`AGENTS.md`](AGENTS.md).

---

## Documentation

| Document | Use it for |
| --- | --- |
| [Vision](docs/VISION.md) | Why Butter exists and what Worldline must not own |
| [Architecture](docs/ARCHITECTURE.md) | Module order, compile-time vs runtime boundaries |
| [Syntax](docs/SYNTAX.md) | `.butter` form, components, utilities |
| [Themes](docs/THEME.md) | Fail-closed TOML catalog and token unlock |
| [Library](docs/LIBRARY.md) | Vanilla chrome atoms mapped from Aero / Retronism / ME |
| [Semantics](docs/SEMANTICS.md) | Roles, `HostUi` flattening, slot export |
| [Worldline](docs/WORLDLINE.md) | Reflection bind, lab `open`/`putMain`, non-claims |
| [Roadmap](docs/ROADMAP.md) | GO stages and v0.1.0 non-claims |
| [Editor support](editors/README.md) | Cursor/VS Code extension and IntelliJ TextMate bundle |
| [Live HostUi map](smokes/hostui-live/MAP.md) | Mapped two-process smoke boundary |
| [Changelog](CHANGELOG.md) | Unreleased adapter work and 0.1.0 host runtime |
| [Engineering guide](AGENTS.md) | Constitution and canonical verify commands |

Useful direct links:

- [Hello template](examples/hello/Hello.butter)
- [Vanilla chrome example](examples/vanilla/Chrome.butter)
- [Thaumcraft-style theme example](examples/thaum/)
- [Vanilla theme catalog](themes/vanilla.toml)
- [Fusion reactor backing class](modules/reference/src/main/java/butter/reference/FusionReactorPanel.java)

---

## Compatibility and scope

Butter targets:

- Minecraft Beta 1.7.3 as the visual and input oracle for the Minecraft
  renderer.
- Java 8 bytecode for product modules.
- JDK 21 for `tools/harness/Verify.java`.
- A mapped b1.7.3 client for `--runtime` adapter compilation and the live
  `HostUi` smoke.

It is not a browser UI, an HTML emulator, a StationAPI requirement, or a
replacement for vanilla container logic. v0.1.0 does not claim:

- Official-JAR framebuffer match (blocked on Worldline M10).
- GL item sprites; mapped screens paint `drawRect` / `drawString` counts.
- Vanilla merge or shift-click; slot click is cursor swap.
- A public `watch()` API.
- DCEVM Java reload.

Never commit or distribute the official Minecraft JAR, original assets, or
decompiled Minecraft sources.

---

## Build and contribute

### Canonical gate

```text
java tools/harness/Verify.java
```

### Mapped adapter and live HostUi

```text
java tools/harness/Verify.java --runtime
```

Version and frozen milestone status are authoritative in
`release/butter.properties`.

Contributions should keep artifacts in English, fail closed on unknown
utilities and missing contracts, preserve module dependency order, stay
inside the per-file ceilings, and keep Minecraft types out of compiler,
signals, and core.

---

## Project transparency

Butter is developed with substantial AI assistance. Architecture, product
decisions, review, and release responsibility remain with the maintainer.
The repository keeps source, tests, diagnostics, and non-claims public so
status can be inspected rather than inferred from the development process.

Maintainer: [lucasrgt](https://github.com/lucasrgt)
