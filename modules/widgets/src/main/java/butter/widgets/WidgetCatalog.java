package butter.widgets;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import butter.core.WidgetNames;

/** Catalog of builtin widgets. Custom packs register additional names later. */
public final class WidgetCatalog {
    private final Set<String> names = new LinkedHashSet<String>();

    public WidgetCatalog() {
        names.addAll(Arrays.asList(
                "Row", "Column", "Grid", "Stack", "Panel", "Text", "Button", "Slider", "ProgressBar",
                "EnergyBar", "FluidTank", "Slot", "Inventory", "PlayerInventory", "Tooltip", "Spacer",
                "ItemGrid", "MachinePanel", "RecipeProgress", "UpgradeSlots",
                "SearchBar", "Tab", "TabBar", "Scrollbar", "Separator",
                "Flame", "Checkbox", "Toggle", "Radio", "GasTank"));
    }

    public boolean known(String name) { return names.contains(name) || WidgetNames.builtin(name); }

    public void register(String name) {
        if (name == null || name.isEmpty()) throw new IllegalArgumentException("name");
        names.add(name);
    }

    public Set<String> names() { return Collections.unmodifiableSet(names); }
}
