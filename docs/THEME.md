# Butter themes

Themes are a fail-closed TOML subset, not a plugin system. Unknown tables,
unquoted values, and unknown `bg-*` / `border-*` / `slot-*` tokens are
compile errors. Vanilla is the base catalog; a screen theme extends it.

Place `theme.toml` next to a `.butter` file or directory. The compiler
merges that file over `Theme.standard()`. Colors named `vis` unlock
`bg-vis` and `border-vis`. Slot names unlock `slot-research`.

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

Allowed top-level key: `id`. Allowed tables: `[colors]`, `[slots]`,
`[fonts]`. Values are quoted strings. Color strings are `#RRGGBB` or
`#AARRGGBB`. Comments start with `#` outside strings.

The host painter looks up `bg-*` names in the active theme. Slot texture
paths are catalogued for later Minecraft painting; they do not replace
the official-JAR pixel oracle.

See `themes/vanilla.toml`, `themes/thaum.toml`, and `examples/thaum/`.
