package butter.render;

import butter.layout.LayoutNode;
import butter.layout.Rect;

/** Escape hatch for graphs, models, and custom drawing inside Butter layout. */
public interface NativePainter {
    void paint(HostCanvas canvas, Rect bounds, LayoutNode node);
}
