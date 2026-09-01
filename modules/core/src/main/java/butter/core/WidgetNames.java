package butter.core;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

/** Builtin widget names and inferred semantic roles. */
public final class WidgetNames {
    private static final Set<String> NAMES = Collections.unmodifiableSet(new LinkedHashSet<String>(Arrays.asList(
            "Row", "Column", "Grid", "Stack", "Panel", "Text", "Button", "Slider", "ProgressBar",
            "EnergyBar", "FluidTank", "Slot", "Inventory", "PlayerInventory", "Tooltip", "Spacer",
            "ItemGrid", "MachinePanel", "RecipeProgress", "UpgradeSlots", "ReactorGraph",
            "FusionInjector", "SearchBar", "Tab", "TabBar", "Scrollbar", "Separator",
            "Flame", "Checkbox", "Toggle", "Radio", "GasTank")));

    private WidgetNames() {}

    public static boolean builtin(String name) { return NAMES.contains(name); }

    public static String role(String name) {
        if ("Button".equals(name)) return "button";
        if ("Text".equals(name)) return "text";
        if ("Slider".equals(name)) return "slider";
        if ("ProgressBar".equals(name) || "RecipeProgress".equals(name)) return "progress";
        if ("EnergyBar".equals(name)) return "energy";
        if ("FluidTank".equals(name) || "GasTank".equals(name)) return "tank";
        if ("Flame".equals(name)) return "flame";
        if ("Checkbox".equals(name)) return "checkbox";
        if ("Toggle".equals(name)) return "toggle";
        if ("Radio".equals(name)) return "radio";
        if ("Slot".equals(name) || "UpgradeSlots".equals(name)) return "slot";
        if ("Inventory".equals(name) || "PlayerInventory".equals(name) || "ItemGrid".equals(name)) return "inventory";
        if ("MachinePanel".equals(name)) return "machine";
        if ("ReactorGraph".equals(name)) return "model";
        if ("Tooltip".equals(name)) return "tooltip";
        if ("SearchBar".equals(name)) return "search";
        if ("Tab".equals(name)) return "tab";
        if ("TabBar".equals(name)) return "tablist";
        if ("Scrollbar".equals(name)) return "scrollbar";
        if ("Separator".equals(name)) return "separator";
        return "generic";
    }

    public static String canonical(String role) {
        if ("item_slot".equals(role)) return "slot";
        if ("fluid_tank".equals(role)) return "tank";
        return role;
    }
}
