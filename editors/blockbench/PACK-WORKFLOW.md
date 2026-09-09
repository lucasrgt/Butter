# One component library per mod

Before creating a mod component, call `butter_library` with
`{"action":"resolve","mod_id":"example-mod"}`. Reuse the returned primary
pack. If only unassociated legacy packs exist, inspect their definitions and
adopt the appropriate existing pack through `revise` with `mod` metadata.
Do not assume legacy packs belong to a mod based only on similar titles.

A mod has one primary pack ID. All versions share that identity:

```json
{"mod":{"id":"example-mod","role":"primary"}}
```

Only scaffold a new primary pack when none exists. An optional independent
compatibility or content addon may use `role: "addon"`, with a nonempty `reason`.
Disabled primary packs still reserve their mod association. Shared, mod-neutral
packs may omit `mod`; existing files remain compatible.

## Add or update in place, publish a new version

```json
{
  "action": "revise",
  "pack": "example-components@1.0.0",
  "mod": {"id":"example-mod","role":"primary"},
  "categories": [
    {"id":"machine","title":"Machine"},
    {"id":"ports","title":"Ports","parent":"machine"}
  ],
  "components": [],
  "dry_run": true
}
```

Populate `components` with complete definitions from `action: "schema"`.
Each submitted component or category replaces the matching ID or appends a new
one. Untouched components, categories, images, metadata and machine types stay
in the pack. `assets` optionally adds or replaces embedded PNGs by path.
Omitting `version` increments the patch number. An explicit version must exceed
the latest installed version. A stale base is rejected, preventing accidental
loss of someone else's newer components. An unchanged update creates no version.
`expected_library_revision` guards against concurrent library changes.

Dry runs return the complete proposed pack. Run again without `dry_run` to
install it, then export that exact new version to persist the source ZIP.
Revisions do not rewrite the original imported file. Saved projects retain
their embedded definitions until explicitly upgraded.

## Categories and manager

Category `parent` references another category ID within the same pack. Cycles,
missing parents and hierarchies deeper than eight levels are rejected. Selecting
a parent category includes every descendant. Search includes the category path.
The palette displays nested, collapsible groups with local titles and descendant
counts. The tree scrolls beneath fixed filters, and a single button alternates
between expanding and collapsing all groups. Categories with more than ten direct
components paginate independently, so paging never hides another category.
Pack limits remain 64 components, 32 categories, 64 images and 2 MB; use variants
for cosmetic alternatives, and justified addons for independently maintained content.

The manager displays one row per pack, with an installed-version selector.
Enable, export, reload, remove and combine target the selected exact version.
**Add / update components** always starts from the latest installed version.
The default catalog displays only the latest enabled version of each pack;
an explicit `pack` key still accesses an older enabled version.

Existing fragmented packs are not merged automatically. Inspect and combine
them deliberately, assign the consolidated pack to its mod, and migrate project
instances only when requested. Combining namespaces component IDs and category
parents and preserves image references.
