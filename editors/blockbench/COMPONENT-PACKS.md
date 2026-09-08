# Declarative component packs

Blockbench Butter 0.9 adds reusable component definitions to the native library.
Open **Components > Packs** to import a folder, JSON file or ZIP, create a starter
pack, install the original Tech Pack, combine packs or manage installed versions.
The same operations are available through `butter_library` and `butter_component`.

## Files and formats

A folder has `pack.json` or `component.json` at its root. A ZIP may contain that
manifest at its root or inside one top-level folder. Components can be inline
in the manifest or stored in separate JSON files:

```text
tech-pack/
  pack.json
  components/
    fluid-port.json
    energy-cell.json
  assets/
    port-mark.png
  schemas/
    pack.schema.json
    component.schema.json
```

```json
{
  "schema": "butter.pack.v1",
  "id": "my-tech",
  "version": "1.0.0",
  "title": "My Tech Pack",
  "author": "Your name",
  "license": "MIT",
  "targets": ["b1.7.3"],
  "categories": [{"id": "ports", "title": "Ports"}],
  "assets": {"port-mark.png": "assets/port-mark.png"},
  "components": ["components/fluid-port.json"]
}
```

A component can declare its own category as `{ "id": "ports", "title": "Ports" }`;
the importer merges matching categories and rejects conflicting titles. A standalone
component can also use a category ID string. It becomes a one-component pack, using
the component ID/title and its version (default `1.0.0`).

Each component can declare an `assets` map. Its file paths are relative to the
component JSON file's directory. Pack assets are relative to `pack.json`. The
importer namespaces component-local asset keys before combining definitions.
Embedded `data:image/png;base64,...` assets work in both formats, including MCP.
Export produces ordinary PNG files, component JSON files and JSON Schemas.
An optional `$schema` field supports editor completion and is never fetched by Butter.

See [the Tech Pack](../../examples/tech-pack/pack.json),
[the standalone Fluid Port](../../examples/fluid-port-component/component.json),
[the component schema](schemas/component.schema.json) and
[the pack schema](schemas/pack.schema.json).

## Definition model

| Field | Behavior |
| --- | --- |
| `schema`, `id`, `title`, `category`, `base`, `variants` | Required identity, grouping, native leaf base and variant definitions |
| `description`, `author`, `license`, `tags`, `icon` | Discoverability and provenance; icons use Material icon names |
| `variants` | 1–24 named variants with integer `w`/`h`, optional `base_bounds`, `base_variant`, layers and defaults |
| `fields` | Additional typed `number`, `text`, `boolean`, `color` or `select` properties; every field needs a default |
| `props`, `preview` | Defaults for component properties and authoring test state |
| `layers`, `draw_base` | Declarative overlay layers and whether to draw the native base |
| `semantics` | Default role, labels, capabilities, namespaced attributes and optional explicit Java bindings/action |
| `binding_hints` | Suggested Java symbols shown in the inspector; suggestions are not emitted as bindings |

A definition wraps one native leaf (`slot`, `tank`, `gas`, `energy`, `progress`,
`flame`, `button`, `search`, `slider`, `scrollbar`, `checkbox`, `toggle`, `radio`,
`tab` or `separator`). It does not define nested interactive child widgets.
`base_bounds: [2, 2, 18, 18]` in a 22×22 variant leaves space outside a native slot
for an outline. Variants determine packing, selection bounds and hit testing.

Component properties and preview values resolve in this order: field defaults,
component defaults, variant defaults, instance overrides. Semantic fields resolve
from the component, then variant, then instance; a provided capabilities array,
attributes map or bindings map replaces the corresponding inherited field.
Resetting a property or semantics override restores the inherited default.
Instance IDs, container slot indices and tab order are allocated by the editor;
pack templates cannot reserve them.

## Visual layers

| Primitive | Fields and behavior |
| --- | --- |
| `rect` | Integer `x`, `y`, `w`, `h` and a solid color |
| `outline` | Inner edge outline with integer `thickness` (default 1) |
| `image` | PNG asset key, optional `[x,y,w,h]` crop, nearest-neighbor drawing |
| `text` | Literal text or `$property`, using the loaded Minecraft bitmap font or fallback |
| `fill` | A numeric `value` property normalized by its field minimum/maximum; `up`, `down`, `left` or `right` |

Colors are `#RRGGBB` or `$color_property`. Layers can have `opacity` from 0 to 1
and a typed `when: { "field": "marked", "equals": true }` condition. Image
animation uses vertically stacked frames with `frames` and `frame_ms`. Without
an explicit crop, the image height is divided by the frame count. APNG is rejected.
Layers are drawn in definition order, then variant order, clipped to the component
bounds. Negative coordinates are allowed inside that clipping contract.

Preview values are local simulations. They are saved with the editor document
and are never emitted as Java runtime state or bindings.

## Versioning and persistence

- Installed identity is `pack-id@major.minor.patch`. Reimporting identical content
  is a no-op. Different content under the same identity is rejected; increment
  the version. Object key ordering does not change content identity.
- Versions can coexist, be disabled, removed, reloaded from their source path or
  exported. Local storage failures leave the in-memory registry unchanged.
- A project embeds one copy of every referenced pack, including PNGs. Each
  instance points to its pinned definition. Removing or updating an installed
  pack does not change saved projects or undo history.
- **Apply version** explicitly upgrades an instance. Its native base, selected
  variant and typed overrides must remain compatible; otherwise the upgrade fails.
  The edit participates in undo. `dry_run` returns the proposed document first.
- **Convert to built-in** removes custom layers/fields, preserves the native base
  position/properties and resolved semantics, and can be undone.
- Duplicate and cross-project copy/paste preserve definitions, allocate fresh
  semantic IDs/slots and reject conflicting pinned content. Deleting the last
  reference removes the unused pack from the document.
- Combining packs creates a new pack and namespaces component/category IDs and
  image paths using their source pack IDs. Collisions fail explicitly.

## Integration with mods

Capabilities such as `fluid.insert` and `energy.store`, and attributes such as
`tech.direction`, are declared contracts. They are exported into `.butter`
semantics, validated by the Java compiler and exposed by Butter's semantic tree.
Custom attributes require a dotted namespace, so they cannot replace runtime
fields such as `enabled`, `focused` or `value`.

The mod must implement its Java backing, transfer logic and container behavior.
The Tech Pack provides binding hints instead of inventing backing members.

**Custom visual layers are currently rendered by the Blockbench editor.** The
plain `.butter` export contains native bases at their resolved base bounds and
the semantic contract. It does not contain a Java interpreter for PNG layers,
conditions, animations or custom properties. **Export > Integration bundle ZIP**
preserves the document, `.butter` source, semantics, `integration.json`, every
referenced definition and all PNGs for a mod renderer to consume. PNG exports
include the custom visuals. No Minecraft assets are included in packs or bundles.

## Tools

| Tool | Main operations |
| --- | --- |
| `butter_library` | `schema`, `list`, paginated `catalog`, `validate`, `import`, `reload`, `enable`, `remove`, `export`, `combine`, `scaffold`, `show` |
| `butter_component` | `add`, `inspect`, explicit `upgrade`, `detach`; mutations support `dry_run` and `expected_revision` |
| `butter_components` / `butter_view` | Built-in/custom catalog, search, category, pack and page filters |
| `butter_properties` | Custom variants, typed fields and visual tests |
| `butter_semantics` | Inherited metadata and explicit capability/attribute overrides |
| `butter_file` | `bundle`, `document`, `butter`, `semantics`, `spec` and `png` exports |

Use `expected_library_revision` for installed-library changes and
`expected_revision` for document edits. Pixel Harness also checks the observed
active workspace; call `workspace_sync` before changing a newly selected project.

## Limits and validation

Packs contain JSON and PNG only; there is no JavaScript, HTML, executable plugin,
network resource loading or dynamic evaluation. Imports reject unknown fields,
unsafe paths, symlinks/junctions within package file paths, missing assets,
incompatible roles/bindings, duplicate IDs, bad variants and malformed PNGs.
PNG chunks, checksums, decoded size and frame/crop bounds are validated.

- 64 components, 64 PNG assets and 24 variants per component; 64 layers per section.
- PNG: at most 512 KiB, 1024×1024 maximum dimensions, 262,144 total pixels.
- Normalized pack: 2 MiB; ZIP: 3 MiB compressed / 4 MiB expanded.
- Installed library: 32 versions / 8 MiB, subject to the host's storage quota.
- Pinned document library: 8 MiB; document import text: 10 MiB.
- Canvas and target remain 176×166 and Minecraft Beta 1.7.3.

The pack tests cover file/ZIP round trips, standalone assets, version conflicts,
storage failure atomicity, upgrades/history, cross-project paste, rendering
conditions and semantic/source/bundle export. Java tests compile and format
namespaced contracts and verify runtime semantic attribute propagation.
