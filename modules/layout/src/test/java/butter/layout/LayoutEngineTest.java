package butter.layout;

import butter.core.WidgetSpec;
import java.util.Collections;

public final class LayoutEngineTest {
    private LayoutEngineTest() {}

    public static void main(String[] arguments) {
        WidgetSpec text = new WidgetSpec("Text", null, Collections.<Object>singletonList("Hi"),
                Collections.singletonMap("class", (Object) "h-8"), Collections.<WidgetSpec>emptyList());
        WidgetSpec button = new WidgetSpec("Button", null, Collections.<Object>singletonList("Craft"),
                Collections.singletonMap("class", (Object) "px-8 h-20"), Collections.<WidgetSpec>emptyList());
        java.util.List<WidgetSpec> children = new java.util.ArrayList<WidgetSpec>();
        children.add(text);
        children.add(button);
        WidgetSpec column = new WidgetSpec("Column", null, Collections.emptyList(),
                Collections.singletonMap("class", (Object) "p-8 gap-4"), children);
        LayoutNode node = LayoutEngine.layout(column, BoxConstraints.loose(400, 300));
        require(node.bounds.width > 0 && node.bounds.height > 0, "sized");
        require(node.children.size() == 2, "children");
        require(node.children.get(1).bounds.y > node.children.get(0).bounds.y, "vertical");
        require(StyleMetrics.parse("p-8 gap-4").gap == 4, "gap");
        require(StyleMetrics.parse("px-8 h-20").height == 20, "button height");
        LayoutNode search = LayoutEngine.layout(new WidgetSpec("SearchBar", null, Collections.emptyList(),
                Collections.<String, Object>emptyMap(), Collections.<WidgetSpec>emptyList()),
                BoxConstraints.loose(200, 80));
        require(search.bounds.width == 88 && search.bounds.height == 12, "search bar");
        java.util.List<WidgetSpec> tabs = new java.util.ArrayList<WidgetSpec>();
        tabs.add(new WidgetSpec("Tab", null, Collections.<Object>singletonList("Name"),
                Collections.<String, Object>emptyMap(), Collections.<WidgetSpec>emptyList()));
        tabs.add(new WidgetSpec("Tab", null, Collections.<Object>singletonList("Size"),
                Collections.<String, Object>emptyMap(), Collections.<WidgetSpec>emptyList()));
        LayoutNode bar = LayoutEngine.layout(new WidgetSpec("TabBar", null, Collections.emptyList(),
                Collections.<String, Object>singletonMap("side", "left"), tabs),
                BoxConstraints.loose(200, 80));
        require(bar.children.get(1).bounds.y > bar.children.get(0).bounds.y, "tab side");
        require("vanilla".equals(StyleMetrics.parse("border-vanilla").border), "bevel class");
        java.util.List<WidgetSpec> seamKids = new java.util.ArrayList<WidgetSpec>();
        seamKids.add(new WidgetSpec("TabBar", null, Collections.emptyList(),
                Collections.<String, Object>singletonMap("side", "left"), tabs.subList(0, 1)));
        seamKids.add(new WidgetSpec("Panel", null, Collections.emptyList(),
                Collections.<String, Object>singletonMap("class", "w-40 h-40"),
                Collections.<WidgetSpec>emptyList()));
        LayoutNode seam = LayoutEngine.layout(new WidgetSpec("Row", null, Collections.emptyList(),
                Collections.<String, Object>singletonMap("class", "gap-0"), seamKids),
                BoxConstraints.loose(200, 80));
        require(seam.children.get(1).bounds.x == seam.children.get(0).bounds.width - 1, "tab seam");
        System.out.println("  layout: column packing");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
