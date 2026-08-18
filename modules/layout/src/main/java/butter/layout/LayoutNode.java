package butter.layout;

import java.util.Collections;
import java.util.List;
import butter.core.WidgetSpec;

/** Laid-out widget with pixel bounds. */
public final class LayoutNode {
    public final WidgetSpec widget;
    public final Rect bounds;
    public final List<LayoutNode> children;

    public LayoutNode(WidgetSpec widget, Rect bounds, List<LayoutNode> children) {
        this.widget = widget;
        this.bounds = bounds;
        this.children = children == null ? Collections.<LayoutNode>emptyList()
                : Collections.unmodifiableList(children);
    }
}
