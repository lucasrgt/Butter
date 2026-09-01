# Butter themes

Themes are a fail-closed TOML subset, not a plugin system. Unknown tables,
unquoted values, and unknown `bg-*` / `border-*` / `text-*` ink / `slot-*`
tokens are compile errors. Vanilla is the base catalog; a screen theme extends it.

Place `theme.toml` next to a `.butter` file or directory. The compiler
merges that file over `Theme.standard()`. Colors named `vis` unlock
`bg-vis`, `border-vis`, and `text-vis`. Slot names unlock `slot-research`.

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

The host painter looks up `bg-*` and `text-*` ink names in the active theme.
`border-vanilla` enables the 1px raised bevel using `highlight`, `shadow`,
and `border`. `text-xs` / `text-sm` / `text-base` / `text-lg` change host
glyph size; `font-bold` and `text-shadow` offset the same cells. Mapped
`drawString` still uses the default b1.7.3 font. Slot texture paths are
catalogued for later Minecraft painting; they do not replace the
official-JAR pixel oracle.

Vanilla also catalogs `highlight`, `shadow`, `border`, `muted`, `search`, and
`search-light` for chrome atoms. `[fonts]` aliases such as `title = "text-lg"`
unlock `font-title`. See `docs/LIBRARY.md`, `themes/vanilla.toml`,
`themes/thaum.toml`, and `examples/thaum/`.
