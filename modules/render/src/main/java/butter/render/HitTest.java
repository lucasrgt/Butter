package butter.render;

import butter.layout.LayoutNode;

/** Hit-test a laid-out tree in screen coordinates. Children win over parents. */
public final class HitTest {
    private HitTest() {}

    public static String idAt(LayoutNode node, int x, int y) {
        return idAt(node, x, y, 0, 0);
    }

    private static String idAt(LayoutNode node, int x, int y, int originX, int originY) {
        int left = originX + node.bounds.x;
        int top = originY + node.bounds.y;
        java.util.List<LayoutNode> children = node.children;
        for (int index = children.size() - 1; index >= 0; index--) {
            String id = idAt(children.get(index), x, y, left, top);
            if (id != null) return id;
        }
        if (x < left || y < top || x >= left + node.bounds.width || y >= top + node.bounds.height) return null;
        return node.widget.id();
    }
}
