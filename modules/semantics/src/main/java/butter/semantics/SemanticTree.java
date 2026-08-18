package butter.semantics;

import java.util.ArrayList;
import java.util.List;
import butter.core.WidgetSpec;

/** Parallel semantic tree emitted beside layout and render. */
public final class SemanticTree {
    public final SemanticNode root;

    public SemanticTree(SemanticNode root) { this.root = root; }

    public static SemanticTree of(WidgetSpec spec) { return new SemanticTree(walk(spec)); }

    public SemanticNode byId(String id) { return find(root, id); }

    private static SemanticNode walk(WidgetSpec spec) {
        List<SemanticNode> children = new ArrayList<SemanticNode>();
        List<WidgetSpec> specs = spec.children();
        for (int index = 0; index < specs.size(); index++) children.add(walk(specs.get(index)));
        return SemanticNode.from(spec, children);
    }

    private static SemanticNode find(SemanticNode node, String id) {
        if (id != null && id.equals(node.id)) return node;
        for (int index = 0; index < node.children.size(); index++) {
            SemanticNode match = find(node.children.get(index), id);
            if (match != null) return match;
        }
        return null;
    }
}
