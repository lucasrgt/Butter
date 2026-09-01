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
        nodes.add(new HostUiNode(HostUiNode.SCREEN, screen, -1, -1, 0));
        walk(tree.root, nodes, new int[] {0});
        return nodes;
    }

    private static void walk(SemanticNode node, List<HostUiNode> nodes, int[] slots) {
        if (node.id != null && !node.id.isEmpty()) {
            String role = node.role == null ? "generic" : node.role;
            int index = HostUiNode.SLOT.equals(role) ? slots[0]++ : -1;
            nodes.add(new HostUiNode(role, node.id, index, node.itemId, count(node),
                    node.label == null ? "" : node.label, node.enabled, node.focused));
        }
        for (int index = 0; index < node.children.size(); index++) walk(node.children.get(index), nodes, slots);
    }

    private static int count(SemanticNode node) {
        if (!(node.value instanceof Number)) return 0;
        int value = ((Number) node.value).intValue();
        return value < 0 ? 0 : value;
    }
}
