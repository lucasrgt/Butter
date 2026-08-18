# Worldline integration

Worldline is the laboratory. It does not own Butter widget metadata.

```text
ButterGuiScreen implements HostUi
  -> B173Gui binds HostUi by reflection
  -> GameUi.screen/nodes/click
```

`worldline-api` has no Butter types. The b1.7.3 adapter looks up
`butter.testing.HostUi` only when that class is on the runtime classpath.

A live inventory screen is still the vanilla `GuiInventory` tree. A Butter
screen is a separate `GuiScreen` opened by the mod (`B173Gui.open` in the
laboratory). Worldline does not treat an unknown vanilla class as Butter.

Mapped live evidence is `smokes/hostui-live/MAP.md`. `Slot(index)` reads
`mainInventory`. Official-JAR pixels remain a non-claim.
