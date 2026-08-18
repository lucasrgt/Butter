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
        System.out.println("  layout: column packing");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
