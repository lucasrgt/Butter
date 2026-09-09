# Optional machine contract integration

Butter describes portable GUI endpoints with `machine.gui.v1`. Export it from
**Export → Machine GUI contract JSON**; integration bundles include
`machine.gui.json` automatically. The descriptor includes stable semantic IDs,
typed fields, resource capabilities, GUI events and pinned resource type packs.
Butter remains independently usable without Pixel Harness.

With Pixel Harness installed in the same Blockbench project, **Semantics → Machine
contract** offers a source dropdown for each GUI field and a command dropdown for
each event. The inverse dropdown is available beside highlighted cells in Pixel
Harness. Both controls update the single `machine.contract.v1` saved in
`pixel_harness.machine`; Butter does not mirror the links in its document.
Native Undo/Redo restores those relationships, and stale project/revision edits reject.

## Custom resources

Component packs optionally include `machine_types`, an array of versioned
`machine.types.v1` catalogs. Each catalog has a namespaced ID, version, title, and
one or more resource types. Types declare namespaced IDs, capability strings and
typed properties (`number`, `integer`, `boolean`, `string`), units, numeric ranges
and access. This is metadata, without scripts or a new game runtime.

See [the complete plasma component pack](../examples/machine-plasma.pack.json).
Import it through the component library, add its plasma gauge, and create or
refresh the machine contract in Pixel Harness. Its `example:plasma` type then
appears in the resource dropdown. Component semantic attributes constrain binding:

```json
{"machine.accepts":"storage.plasma","machine.unit.value":"mB","machine.unit.max":"mB"}
```

`machine.accepts` is a comma-separated list of required resource capabilities.
When omitted, native tanks/gas/energy/slots use their standard storage or inventory
capability. `tech.resource` also supplies that default for custom components.
For example, use `storage.plasma` for plasma and expose arbitrary pressure or
temperature properties in the resource catalog. Enabled/visible/readOnly fields
accept matching boolean signals independently of the resource capability.

Pack definitions survive document, native `.bbmodel`, library ZIP and integration
bundle round-trips. Conflicting pinned definitions reject. Updating a library
version does not replace definitions already pinned in a machine contract.

## Input commands

Read bindings deliver machine properties to GUI fields. Commands deliver GUI
events to declared machine actions, including typed payloads. Sliders and
scrollbars expose `set_value.value`; search exposes `type.text`. The dropdown
offers actions whose typed inputs have an unambiguous compatible payload mapping.
Explicit constant arguments and custom adapter work are represented in the machine
JSON. The mod must validate incoming requests, invoke the declared implementation
and publish updated state; the authoring editor does not execute these operations.

The optional provider is `globalThis.BlockbenchMachine` with `version:1` and
`call(command,args)`. Butter's independent descriptor is also available from
`BlockbenchButter.call('machine',{action:'describe'})` or MCP `butter_machine`.
The machine contract is ordinary JSON and can be implemented without either editor.
