# Blockbench Butter 0.9

A native Blockbench mode for authoring Butter interfaces, with 34 dedicated tools
in the existing Pixel Harness MCP server. Uses the shared Butter builder tree
and presets, native dockable panels and the existing native 3D viewport. No second server,
iframe or separate application is required.

## Build and install

```text
cd editors/blockbench
bun install
bun run check
bun test src
bun run build
```

Load `dist/blockbench_butter.js` with Blockbench's **Load Plugin from File**.
For MCP, build/load Pixel Harness's `fork/dist/mcp.js` and refresh the client's
tool list. The server remains at `http://localhost:3000/bb-mcp`. The UI works
without MCP; the companion API is `globalThis.BlockbenchButter`, version 1.

## Authoring

- **Components / Layers / Properties:** native, dockable and foldable panels.
  Select from the canvas or layer tree; rename, reparent, reorder, duplicate,
  hide, delete and undo/redo. Hidden layers remain in exports.
- **Component library:** search titles/keywords, combine with Layout, Inventory,
  Machine or Input categories, and browse grouped results. Each page contains
  at most 10 components across all groups. Pagination appears only when needed;
  custom packs retain their declared categories. Search remains focused as results
  update. `butter_view` controls search/category/page; `butter_components` queries
  the catalog without changing the current filters. The pack filter and **Packs**
  manager add declarative JSON/PNG components, immutable versions, import/export,
  combination and the original Tech Pack. See [Component packs](COMPONENT-PACKS.md).
- **Position:** edit X/Y, drag components, or move the selected component/group
  with arrows (1 pixel) and Shift + arrows (10 pixels). Holding an arrow waits
  350 ms, then repeats every 75 ms. Release, focus change to a text field,
  window blur, project switch or mode switch stops the sequence.
- **Grid:** visible toolbar toggle and 1–32 pixel spacing. Opacity and optional
  drag snapping are beside the canvas zoom controls. Keyboard movement
  always uses the exact 1/10 pixel step. Grid and selection never enter PNG exports.
- **Preview:** Fit or integer zoom up to 8x; source view; clean PNG export at
  1–6x. The split button shows the current machine in a native orbitable 3D
  viewport beside the GUI. Drag the vertical divider to resize, double-click to
  center, or focus it and use arrow keys (Shift for a larger step).
- **Canvas navigation:** Ctrl + mouse wheel zooms in integer steps from 1x to 8x,
  anchored under the cursor. Hold Space and drag to pan freely, including beyond
  the GUI pane through pointer capture. Releasing Space, losing focus or leaving
  the mode cancels panning. Text fields keep their normal Space key behavior.
  The center icon fits and recenters the GUI. Pan offsets are session state in
  screen pixels; they do not move components or affect export pixels/source.
- **Current project:** Butter uses the model in the active project automatically.
  New GUI presets replace only that project's GUI, with undo. No project picker
  is needed. `butter_begin` can create a separate tab with `new_project: true`.
  `butter_attach` remains an explicit MCP command for copying a GUI between projects.
- **Controls:** document/history actions occupy the top bar; zoom/grid/snap are
  next to the canvas. Controls use 28px height and 12px text; palette buttons are
  32px high. Properties keep the version dropdown above the selected component.
  Explanations and keyboard hints appear in tooltips.
  Neutral buttons remap the color token used by Blockbench's native hover rule
  to keep text readable; active buttons retain the theme's accent pair.
- **Persistence:** document JSON and the `butter_gui` property in `.bbmodel`
  retain the tree, pixel positions, hidden/locked layers, component variants,
  test properties and selected target. `butter_editor` retains selection, camera
  and view settings in native projects; GUI undo/redo survives plugin reload
  through an in-memory project property.

## Shared source and version adapters

The same `.butter` source describes the interface across Minecraft targets.
There is no version keyword or conditional target code inside that source.
The document's `target` field is compilation/preview configuration outside the
template. **Beta 1.7.3 is available and selected by default.** The Minecraft dropdown
shows 1.7.10, 1.12.2 and modern Minecraft as planned adapters; selecting an
unimplemented adapter fails explicitly.

Pixel export emits a `Stack` with explicit integer `x`/`y` and width/height on
its leaf widgets. Groups become positioned leaves; PlayerInventory expands to
36 semantic slots. Butter's layout engine honors these positions. The compiler
rejects fractional/out-of-range coordinates and positioned children of non-Stack
parents. Ordinary Row/Column flow remains available when authoring `.butter`.
The neutral GameUiSpec export contains semantic roles/indices, not layout.

## Minecraft assets and pixel evidence

Use the **folder button below Minecraft** or `butter_assets` with a local Beta 1.7.3
JAR. Furnace GUI, widget/item atlases, default font and character map are read.
No Minecraft JAR, original texture or decompiled source is bundled with this
plugin or stored in documents. Only the local JAR path is remembered locally;
asset status exposes its SHA-256. Missing assets use a clearly marked fallback.

The preview uses the original bitmap glyphs/advances, slot pixels and frame
perimeter, with nearest-neighbor integer scaling and transparent outside corners.
The `butter_preview` furnace reference was compared against **Gui and FontRenderer
executed from the original JAR in an LWJGL Pbuffer**: 0 differing RGBA pixels out
of 29,216 at 176x166. This validates that reference's text and chrome, not every
possible widget, game input, texture pack or future adapter. Component states are
authoring simulations. Full compiled GUI behavior in game still requires its
Java backing/container integration.

A component audit found exact preview matches for the frame/title, empty slot,
empty inventory and zero-progress arrow. Active states are now exposed for
component testing; SearchBar remains an authoring approximation. The separate Java HostRenderer differed in
all 26 tested native component/state fixtures. The preview result does not certify
the Java runtime. Custom energy/tank gauges have no direct vanilla counterpart.

## MCP controls

| Area | Tools |
| --- | --- |
| Documents and catalog | `butter_components`, `butter_begin`, `butter_inspect`, `butter_import`, `butter_export`, `butter_file` |
| Components and layers | `butter_add`, `butter_update`, `butter_move`, `butter_duplicate`, `butter_remove`, `butter_select`, `butter_history` |
| Variants and visual tests | `butter_properties` |
| Declarative packs and instances | `butter_library`, `butter_component` |
| Semantic contracts | `butter_semantics` |
| Pixel positioning and alignment | `butter_nudge`, `butter_position`, `butter_align`, `butter_distribute` |
| Batch editing and hierarchy | `butter_edit`, `butter_clipboard`, `butter_tree`, `butter_frame` |
| Command reference | `butter_capabilities` |
| Workspace | `butter_view`, `butter_panels`, `butter_attach`, `butter_camera` |
| Targets and assets | `butter_versions`, `butter_assets` |
| Inspection | `butter_preview`, `butter_validate` |

```text
butter_assets {"action":"load","path":"C:/path/to/minecraft.jar"}
butter_view {"layout":"split","zoom":"fit","grid":true,"grid_size":8}
butter_view {"pan_x":40,"pan_y":-20,"component_search":"gauge","component_category":"machine"}
butter_components {"search":"slot","category":"inventory","page":1}
butter_select {"id":"w3"}
butter_nudge {"dx":1,"dy":0}
butter_position {"id":"w3","x":54,"y":33}
butter_versions {}
butter_export {"format":"butter"}
```

Tree mutations accept `expected_revision`. Invalid edits leave the committed
document unchanged. `butter_file` uses an explicit absolute local path to open
JSON or save JSON, `.butter`, GameUiSpec or PNG. `butter_validate` validates the
authoring document and bounds; compile exports through Butter CLI for contract
validation. General `.butter` source import, arbitrary runtime widgets, Java
live container state and theme editing are outside this editor. Semantics supports
typed Java binding/action declarations for the exported source.

## Verification

Run the three editor commands above, `java tools/harness/Verify.java` from Butter,
and `bun fork/scripts/gate.mjs --root .` from Pixel Harness. Tests cover tree
validation, transactions, native project parsing, position/history/duplication,
source independence and bitmap advances. Live MCP/UI checks cover keyboard
steps/repeat, grid-free exports, file round-trip, native panels/camera, version
failures and geometry preservation. The original-JAR comparison is a separate
local check; host-canvas tests alone are not the Minecraft oracle.
Catalog tests use a 23-entry fixture to exercise all pagination boundaries, and
camera tests verify cursor anchoring across zoom levels. Live pointer checks use
the existing Blockbench Chromium debug endpoint to exercise actual hover, Ctrl
wheel and Space-drag events, separately from synthetic DOM-event checks.


## Selection, hierarchy and editing (0.5)

Canvas selection can target groups or individual components. Shift-click and
Shift-marquee toggle membership; Ctrl-click or double-click selects a child
directly. Drag empty space for a selection rectangle. Ctrl+A selects all,
Ctrl+Shift+A / Esc clears selection, Ctrl+I inverts, Enter selects parents, and
Tab / Shift+Tab cycles candidates when the canvas is focused.

Drag components, entire groups or multiple selections with live outlines and
coordinates. Shift constrains an axis; Alt duplicates before moving. Grid
snapping takes precedence over optional edge/center guides. X/Y fields move
the selection union. Arrow movement and each complete pointer drag create one
history entry. Escape cancels a movement. Ctrl+Z undoes; Ctrl+Y / Ctrl+Shift+Z
redoes. No-op edits retain the redo branch. History also restores selection.

Delete / Backspace deletes selected layers. Ctrl+C / X / V use an **internal
Butter clipboard**, shared across project tabs; they do not read or replace the
OS clipboard. Ctrl+Shift+V pastes in place, Ctrl+D duplicates, and repeated paste
offsets copies. Copies receive fresh ids and unique semantic names. Player
inventory remains unique and directly under the screen.

Ctrl+G groups; Ctrl+Shift+G ungroups. Layers expose collapsible folders,
expand/collapse-all and search. Drag rows before/after another row or into a
group; drop them onto the canvas to reposition. Reparent, group, ungroup, delete
and stacking changes preserve other components' pixel coordinates. Ctrl+[ / ]
steps backward/forward; adding Shift sends to back/front, within each parent.

Eye and lock controls support inherited visibility and locks. Ctrl+H hides;
Ctrl+Shift+H shows all. Ctrl+L toggles locking; Ctrl+Shift+L unlocks all. Locked
subtrees reject movement, deletion, grouping and reparenting. Hidden flags are
preview-only; locked flags protect authoring. Both persist in the document.

Properties offer six alignment directions and horizontal/vertical equal-gap
distribution (three or more selections). Alignment references are Auto,
Selection, Canvas or Parent. Auto uses the canvas for one selection and the
selection bounds for multiple. Alt+H / Alt+V center horizontally/vertically.
Integer rounding can make adjacent distributed gaps differ by one pixel.

F frames selection, Shift+F / Ctrl+0 fits the canvas, Ctrl+1 sets actual pixels.
F2 focuses rename; Ctrl+F searches components, Ctrl+Shift+F searches layers.
The Edit button and canvas/layer context menus expose actions. Press **?** or
the help button for the complete categorized reference (also returned by
`butter_capabilities`). Text fields and native dialogs retain their own keys.

The authoring canvas remains 176 × 166 with intrinsic Beta widget dimensions;
arbitrary resize handles and additional Minecraft adapters remain unavailable.
View preferences and collapsed folders persist in native projects; the internal
clipboard remains session state. Canvas coordinates and lock/visibility flags
persist in `.bbmodel` and authoring JSON.

## Configurable semantics

Optional **Machine contract** dropdowns link fields/events to Pixel Harness cell
resources and machine actions. Custom packs can carry extensible resource catalogs,
including plasma. Export the standalone GUI contract without either editor at
runtime. See [machine contract integration](../../docs/MACHINE-CONTRACT.md).

Properties now includes a Semantics section for the screen and each component: stable IDs, compatible roles, labels, descriptions, optional group regions, persistent container indices, search tab order, typed backing bindings and click handlers. Tree opens a native declaration inspector. Export supports Semantic tree JSON. Use `butter_semantics` for the same controls through MCP. See [the semantic contract](../../docs/SEMANTICS.md) for binding types, runtime behavior and E2E verification boundaries.

## Component variants and visual tests

Select a component and use **Component → Variant** and **Visual test** in Properties.
Tanks and gas gauges have Big (18×54), Small (18×18) and Wide (36×54) variants.
Slots, energy, progress, search, buttons, sliders, scrollbars and tabs also expose
presets. The palette includes gas, flame, button, slider, checkbox, toggle, radio,
scrollbar, tab and separator controls.

Each instance has its own fill slider, substance, animation, item/count, text,
checked, enabled, hovered or pressed states as applicable. Dragging a fill slider
creates one undo entry; Escape cancels it. Duplicate/copy and native JSON preserve
the independent state. Simulation values are excluded from `.butter` runtime
bindings; component size and static properties are exported.

```text
butter_properties {"action":"update","id":"w3","section":"components","patch":{"variant":"small","props":{"max":8000}}}
butter_properties {"action":"update","id":"w3","section":"preview","patch":{"substance":"water","level":50}}
```

## Local animated materials

`tools/CaptureMaterials.java` invokes installed Beta 1.7.3 Water/Lava TextureFX
and Retronism GasOverlayFX through reflection. It captures 64 frames after warmup
and writes a local `pack.json`. Compile the helper into an ignored work directory;
run with your mapped Minecraft JAR and compiled Retronism classes on the classpath.
Do not commit the generated textures or distribute the game/mod dependencies.

```text
javac -d .butter/material-capture editors/blockbench/tools/CaptureMaterials.java
java -cp <capture-classes-and-game/mod-classpath> CaptureMaterials <absolute-output-directory>
butter_assets {"action":"materials_load","path":"C:/local/materials/pack.json"}
```

The folder's strips contain vertical 16×16 frames. The manifest records their
absolute paths, frame counts, frame durations and generator class names; loaded
status reports texture hashes. Load it from **Animated game textures** in Properties.
Water/lava use the actual game animation pixels; oxygen/hydrogen/ozone tint the
actual Retronism gas texture. Oil, honey, steam and chlorine remain labeled test
tints. Both tank kinds fill from the bottom, repeating/cropping 16px tiles instead
of stretching. Missing packs retain a flat-color fallback. The short frame loop
is a preview of sampled game animation, not a live game simulation.

All component passes use nearest-neighbor sampling. A 704×664 export was verified
byte-for-byte against 4× duplication of its 176×166 pixels, alongside 0/50/100%
fill boundaries and distinct animated frames.

## One live workspace

Butter reparents Blockbench's existing `main` viewport into Split and returns it
on leaving the mode. It creates no extra camera, scene or render loop for 3D.
Repeated mode switches and plugin reload preserve the model and GUI state.
MCP clients should call `workspace_sync` after connecting/reconnecting and pass
`expected_project_id` with edits. Read the returned `_meta.blockbench` for the
current project, mode, camera and server generation. See Pixel Harness's workspace
contract for tab-change rejection and camera-preserving capture.
