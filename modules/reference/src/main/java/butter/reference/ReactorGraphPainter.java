package butter.reference;

import butter.layout.LayoutNode;
import butter.layout.Rect;
import butter.render.HostCanvas;
import butter.render.NativePainter;

/** Native-render widget for reactor history. */
public final class ReactorGraphPainter implements NativePainter {
    public void paint(HostCanvas canvas, Rect bounds, LayoutNode node) {
        canvas.fill(bounds.x, bounds.y, bounds.width, bounds.height, 0xFF101820);
        int mid = bounds.y + bounds.height / 2;
        canvas.fill(bounds.x, mid, bounds.width, 1, 0xFF44CC44);
    }
}
