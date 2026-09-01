package butter.semantics;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import butter.core.WidgetSpec;

/** One semantic node. Butter owns this metadata; Worldline only consumes it. */
public final class SemanticNode {
    public final String id;
    public final String role;
    public final String label;
    public final String type;
    public final Object value;
    public final int itemId;
    public final boolean enabled;
    public final boolean focused;
    public final List<String> actions;
    public final List<SemanticNode> children;

    public SemanticNode(String id, String role, String label, String type, Object value, int itemId,
            boolean enabled, List<String> actions, List<SemanticNode> children) {
        this(id, role, label, type, value, itemId, enabled, false, actions, children);
    }

    public SemanticNode(String id, String role, String label, String type, Object value, int itemId,
            boolean enabled, boolean focused, List<String> actions, List<SemanticNode> children) {
        this.id = id;
        this.role = role;
        this.label = label;
        this.type = type;
        this.value = value;
        this.itemId = itemId < -1 ? -1 : itemId;
        this.enabled = enabled;
        this.focused = focused;
        this.actions = actions == null ? Collections.<String>emptyList()
                : Collections.unmodifiableList(actions);
        this.children = children == null ? Collections.<SemanticNode>emptyList()
                : Collections.unmodifiableList(children);
    }

    @SuppressWarnings("unchecked")
    static SemanticNode from(WidgetSpec spec, List<SemanticNode> children) {
        Map<String, Object> declared = spec.prop("semantics") instanceof Map
                ? (Map<String, Object>) spec.prop("semantics") : Collections.<String, Object>emptyMap();
        String id = string(declared.get("id"));
        if (id == null) id = spec.id();
        String role = string(declared.get("role"));
        if (role == null) role = butter.core.WidgetNames.role(spec.type());
        role = butter.core.WidgetNames.canonical(role);
        String label = string(declared.get("label"));
        if (label == null && !spec.arguments().isEmpty()) label = String.valueOf(spec.arguments().get(0));
        if (label == null && spec.prop("placeholder") != null) label = String.valueOf(spec.prop("placeholder"));
        boolean enabled = !(spec.prop("enabled") instanceof Boolean) || ((Boolean) spec.prop("enabled")).booleanValue();
        boolean focused = Boolean.TRUE.equals(spec.prop("focused"));
        List<String> actions = new java.util.ArrayList<String>();
        if (spec.prop("action") != null || "Button".equals(spec.type()) || "SearchBar".equals(spec.type())
                || "Tab".equals(spec.type()) || "Checkbox".equals(spec.type()) || "Toggle".equals(spec.type())
                || "Radio".equals(spec.type())) actions.add("click");
        if ("Slider".equals(spec.type()) || "Scrollbar".equals(spec.type()) || "Flame".equals(spec.type())) {
            actions.add("set_value");
        }
        if ("Slot".equals(spec.type())) { actions.add("click"); actions.add("right_click"); }
        Object value = spec.prop("value");
        if ("slot".equals(role) && spec.prop("count") != null) value = spec.prop("count");
        return new SemanticNode(id, role, label, spec.type(), value, number(spec.prop("item"), -1),
                enabled, focused, actions, children);
    }

    private static int number(Object value, int fallback) {
        if (!(value instanceof Number)) return fallback;
        return ((Number) value).intValue();
    }

    private static String string(Object value) { return value == null ? null : String.valueOf(value); }
}
