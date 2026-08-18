# Minecraft adapter

`butter.minecraft.ButterGuiScreen` extends mapped b1.7.3 `GuiScreen`, paints
with `drawRect` / `drawString`, and implements `butter.testing.HostUi`.

`ButterGuiScreen` overlays `Slot(index)` from `thePlayer.inventory.mainInventory`.
Worldline binds `HostUi` by reflection. This adapter may import Minecraft
types. Product modules must not.

Compile it with:

```text
java tools/harness/Verify.java --runtime
```

The mapped client comes from `runtime.workspace` in `harness.properties`.
Real official-JAR framebuffer match remains a later Worldline M10 proof.
