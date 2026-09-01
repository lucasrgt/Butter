package butter.core;

import java.util.Collections;
import java.util.List;

public final class WidgetSpecTest {
    private WidgetSpecTest() {}

    public static void main(String[] arguments) {
        WidgetSpec text = new WidgetSpec("Text", null, Collections.<Object>singletonList("Craft"),
                Collections.singletonMap("class", (Object) "text-lg"), Collections.<WidgetSpec>emptyList());
        require(text.type().equals("Text") && "Craft".equals(text.arguments().get(0)), "text");
        require(Utilities.unknownTokens("p-8 gap-4 hover:bg-accent compact:h-20").isEmpty(), "utilities");
        require(!Utilities.unknownTokens("p-8 banana").isEmpty(), "unknown utility");
        require(WidgetNames.builtin("Button") && WidgetNames.role("Button").equals("button"), "role");
        require(WidgetNames.role("EnergyBar").equals("energy"), "energy role");
        require(WidgetNames.role("Slot").equals("slot") && WidgetNames.canonical("item_slot").equals("slot"), "slot");
        require(WidgetNames.role("FluidTank").equals("tank") && WidgetNames.canonical("fluid_tank").equals("tank"), "tank");
        require("0.1.0".equals(ButterVersion.VERSION), "version");
        WidgetSpec inventory = WidgetExpander.expand(new WidgetSpec("PlayerInventory", null,
                Collections.emptyList(), Collections.<String, Object>emptyMap(),
                Collections.<WidgetSpec>emptyList()));
        require(inventory.children().size() == 36 && "player-0".equals(inventory.children().get(0).id()),
                "player inventory");
        java.util.Map<String, Object> gridProps = new java.util.LinkedHashMap<String, Object>();
        gridProps.put("slots", Integer.valueOf(3));
        WidgetSpec grid = WidgetExpander.expand(new WidgetSpec("ItemGrid", null, Collections.emptyList(),
                gridProps, Collections.<WidgetSpec>emptyList()));
        require(grid.children().size() == 3 && "grid-2".equals(grid.children().get(2).id()), "item grid");
        require("tooltip".equals(WidgetNames.role("Tooltip")), "tooltip");
        require(WidgetNames.builtin("SearchBar") && "search".equals(WidgetNames.role("SearchBar")), "search");
        require("tab".equals(WidgetNames.role("Tab")) && "tablist".equals(WidgetNames.role("TabBar")), "tabs");
        require("scrollbar".equals(WidgetNames.role("Scrollbar"))
                && "separator".equals(WidgetNames.role("Separator")), "chrome");
        require(Utilities.unknownTokens("border-vanilla").isEmpty(), "bevel utility");
        require(Utilities.unknownTokens("text-muted font-bold").isEmpty(), "ink");
        require(Utilities.unknownTokens("font-title wrap slot-lg items-center grow").isEmpty(), "flex");
        require(!Utilities.unknownTokens("text-nope").isEmpty(), "bad ink");
        require(WidgetNames.builtin("Flame") && "flame".equals(WidgetNames.role("Flame")), "flame");
        require("checkbox".equals(WidgetNames.role("Checkbox")) && "tank".equals(WidgetNames.role("GasTank")),
                "controls");
        WidgetSpec chest = WidgetExpander.expand(new WidgetSpec("Inventory", null, Collections.emptyList(),
                Collections.<String, Object>emptyMap(), Collections.<WidgetSpec>emptyList()));
        require(chest.children().size() == 27 && "inv-0".equals(chest.children().get(0).id()), "inventory");
        java.util.Map<String, Integer> extra = new java.util.LinkedHashMap<String, Integer>();
        extra.put("vis", Integer.valueOf(0xFF2E8B57));
        Theme thaum = Theme.standard().extend(new Theme("thaumcraft", extra,
                java.util.Collections.<String, String>emptyMap(),
                java.util.Collections.<String, String>emptyMap()));
        require(Utilities.unknownTokens("bg-vis", thaum).isEmpty(), "theme color");
        require(!Utilities.unknownTokens("bg-vis").isEmpty(), "vis unknown on vanilla");
        Binding binding = new Binding("canCraft");
        require(binding.equals(new Binding("canCraft")) && binding.path().equals("canCraft"), "binding");
        List<String> unknown = Utilities.unknownTokens("not-a-utility");
        require(unknown.size() == 1, "one unknown");
        System.out.println("  core: spec, utilities, widget names");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
