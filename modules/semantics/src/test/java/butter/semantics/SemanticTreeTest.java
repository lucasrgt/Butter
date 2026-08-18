package butter.semantics;

import butter.compiler.ButterCompiler;
import butter.core.WidgetSpec;

public final class SemanticTreeTest {
    private SemanticTreeTest() {}

    public static void main(String[] arguments) {
        WidgetSpec spec = ButterCompiler.compileSource("Hello.butter",
                "Button(\"Craft\", id: \"craft\")", null);
        SemanticTree tree = SemanticTree.of(spec);
        SemanticNode node = tree.byId("craft");
        require(node != null && "button".equals(node.role), "inferred button");
        require("Craft".equals(node.label) && node.actions.contains("click"), "label/action");
        WidgetSpec bar = ButterCompiler.compileSource("Bar.butter",
                "Column(children: [Slot(id: \"input\"), FluidTank(id: \"tank\")])", null);
        SemanticTree widgets = SemanticTree.of(bar);
        require("slot".equals(widgets.byId("input").role), "slot role");
        WidgetSpec stack = ButterCompiler.compileSource("Stack.butter",
                "Slot(id: \"input\", item: 4, count: 8)", null);
        require(SemanticTree.of(stack).byId("input").itemId == 4
                && Integer.valueOf(8).equals(SemanticTree.of(stack).byId("input").value), "stack");
        require("tank".equals(widgets.byId("tank").role), "tank role");
        WidgetSpec alias = ButterCompiler.compileSource("Alias.butter",
                "FluidTank(id: \"old\", semantics: (id: \"old\", role: fluid_tank, label: \"Tank\"))", null);
        require("tank".equals(SemanticTree.of(alias).byId("old").role), "alias");
        SemanticTree chrome = SemanticTree.of(ButterCompiler.compileSource("Chrome.butter",
                "Column(children: [SearchBar(id: \"search\", placeholder: \"Search...\"),"
                        + " Tab(\"Name\", id: \"sort-name\"), Scrollbar(id: \"scroll\", value: 3, max: 10)])",
                null));
        require("search".equals(chrome.byId("search").role)
                && chrome.byId("search").actions.contains("click"), "search");
        require("Search...".equals(chrome.byId("search").label), "placeholder label");
        require("tab".equals(chrome.byId("sort-name").role)
                && chrome.byId("sort-name").actions.contains("click"), "tab");
        require("scrollbar".equals(chrome.byId("scroll").role)
                && chrome.byId("scroll").actions.contains("set_value"), "scrollbar");
        System.out.println("  semantics: inferred and declared roles");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
