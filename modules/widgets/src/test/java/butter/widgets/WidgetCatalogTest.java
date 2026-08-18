package butter.widgets;

public final class WidgetCatalogTest {
    private WidgetCatalogTest() {}

    public static void main(String[] arguments) {
        WidgetCatalog catalog = new WidgetCatalog();
        require(catalog.known("Slot") && catalog.known("PlayerInventory") && catalog.known("Tooltip"), "vanilla");
        require(catalog.known("EnergyBar") && catalog.known("FluidTank"), "machines");
        require(catalog.known("SearchBar") && catalog.known("TabBar") && catalog.known("Scrollbar"), "chrome");
        catalog.register("ReactorGraph");
        require(catalog.known("ReactorGraph"), "native pack");
        System.out.println("  widgets: core/vanilla/machine catalog");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
