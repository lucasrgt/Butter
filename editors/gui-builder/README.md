# Butter GUI Builder

Visual authoring for Butter screens targeting Minecraft Beta 1.7.3. The
builder creates a Flutter-inspired widget tree, previews a vanilla-sized
176×166 panel, and exports a native `.butter` component.

It also exports `GameUiSpec` JSON as an interoperability artifact for
Worldline tests. Butter owns the widget model and editor; Worldline only
consumes the neutral semantic tree.

```text
tree  →  .butter component
      →  GameUiSpec JSON for Worldline verification
      →  176×166 pixel preview
```

## Run

```text
npm install
npm test
npm run build
npm run dev
```

## Current scope

- Author `Row`, `Column`, `Slot`, `ProgressBar`, `EnergyBar`, `FluidTank`,
  `SearchBar`, and `PlayerInventory` trees.
- Preview the vanilla panel and player-inventory footprint.
- Export a native public Butter component plus the equivalent neutral
  `GameUiSpec` structure.
- Provide crusher, tank, and empty-screen presets.

The builder does not generate containers, Java backing classes, runtime hooks,
tiles, ports, or multiblock structure. Runtime compilation remains owned by
Butter's compiler and canonical repository gate.
