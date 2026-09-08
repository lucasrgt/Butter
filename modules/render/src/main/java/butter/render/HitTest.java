package butter.render;

import butter.layout.LayoutNode;

/** Hit-test a laid-out tree in screen coordinates. Children win over parents. */
public final class HitTest {
    private HitTest() {}

    public static final class Hit {
        public final String id;
        public final int localX;
        public final int localY;
        public final int width;
        public final int height;

        Hit(String id, int localX, int localY, int width, int height) {
            this.id = id;
            this.localX = localX;
            this.localY = localY;
            this.width = width;
            this.height = height;
        }
    }

    public static String idAt(LayoutNode node, int x, int y) {
        Hit hit = at(node, x, y);
        return hit == null ? null : hit.id;
    }

    public static Hit at(LayoutNode node, int x, int y) { return at(node, x, y, 0, 0); }

    private static Hit at(LayoutNode node, int x, int y, int originX, int originY) {
        if (!butter.core.SemanticProperties.interactive(node.widget)) return null;
        int left = originX + node.bounds.x;
        int top = originY + node.bounds.y;
        java.util.List<LayoutNode> children = node.children;
        for (int index = children.size() - 1; index >= 0; index--) {
            Hit hit = at(children.get(index), x, y, left, top);
            if (hit != null) return hit;
        }
        if (x < left || y < top || x >= left + node.bounds.width || y >= top + node.bounds.height) return null;
        if (!butter.core.SemanticProperties.acceptsPointer(node.widget)) return null;
        String id = node.widget.id();
        if (id == null || id.isEmpty()) return null;
        return new Hit(id, x - left, y - top, node.bounds.width, node.bounds.height);
    }
}
