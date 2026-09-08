package butter.testing;

import java.util.ArrayList;
import java.util.List;
import butter.semantics.SemanticNode;
import butter.semantics.SemanticTree;

/** Flattens a Butter semantic tree into Worldline GameUi node shape. */
public final class HostUiExport {
    private HostUiExport() {}

    public static List<HostUiNode> flatten(String screen, SemanticTree tree) {
        if (screen == null || screen.isEmpty()) throw new IllegalArgumentException("screen");
        if (tree == null || tree.root == null) throw new IllegalArgumentException("tree");
        List<HostUiNode> nodes = new ArrayList<HostUiNode>();
        if (!"screen".equals(tree.root.role)) nodes.add(new HostUiNode(HostUiNode.SCREEN, screen, -1, -1, 0));
        java.util.Set<Integer> used = new java.util.LinkedHashSet<Integer>();
        reserve(tree.root, used);
        walk(tree.root, nodes, new int[] {0}, used);
        return nodes;
    }

    public static String screen(String fallback, SemanticTree tree) {
        return "screen".equals(tree.root.role) && tree.root.id != null ? tree.root.id : fallback;
    }

    private static void reserve(SemanticNode node, java.util.Set<Integer> used) {
        if ("slot".equals(node.role) && node.index >= 0 && !used.add(node.index)) {
            throw new IllegalStateException("duplicate container index " + node.index);
        }
        for (SemanticNode child : node.children) reserve(child, used);
    }

    private static void walk(SemanticNode node, List<HostUiNode> nodes, int[] slots, java.util.Set<Integer> used) {
        if (node.id != null && !node.id.isEmpty()) {
            String role = node.role == null ? "generic" : node.role;
            int index = -1;
            if (HostUiNode.SLOT.equals(role)) {
                while (used.contains(slots[0])) slots[0]++;
                index = node.index >= 0 ? node.index : slots[0]++;
            }
            nodes.add(new HostUiNode(role, node.id, index, node.itemId, count(node),
                    node.label == null ? "" : node.label, node.enabled, node.focused, node.attributes));
        }
        for (int index = 0; index < node.children.size(); index++) walk(node.children.get(index), nodes, slots, used);
    }

    private static int count(SemanticNode node) {
        if (!(node.value instanceof Number)) return 0;
        int value = ((Number) node.value).intValue();
        return value < 0 ? 0 : value;
    }
}
