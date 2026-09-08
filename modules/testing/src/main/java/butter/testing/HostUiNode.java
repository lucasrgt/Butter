package butter.testing;

/** Worldline-shaped UI node. Butter owns the type; Worldline maps it by getters. */
public final class HostUiNode {
    public static final String SCREEN = "screen", SLOT = "slot", INVENTORY = "inventory";
    public static final String PROGRESS = "progress", ENERGY = "energy", TANK = "tank";
    public static final String BUTTON = "button", TEXT = "text", SLIDER = "slider";
    public static final String SEARCH = "search", TAB = "tab", TABLIST = "tablist";
    public static final String SCROLLBAR = "scrollbar", SEPARATOR = "separator";
    public static final String FLAME = "flame", CHECKBOX = "checkbox", TOGGLE = "toggle";
    public static final String RADIO = "radio";
    private final java.util.Map<String, String> attributes;
    private final String role, name, label;
    private final int index, itemId, count;
    private final boolean enabled, focused;

    public HostUiNode(String role, String name, int index, int itemId, int count) {
        this(role, name, index, itemId, count, "", true, false);
    }

    public HostUiNode(String role, String name, int index, int itemId, int count, String label,
            boolean enabled, boolean focused) {
        this(role, name, index, itemId, count, label, enabled, focused,
                java.util.Collections.<String, String>emptyMap());
    }

    public HostUiNode(String role, String name, int index, int itemId, int count, String label,
            boolean enabled, boolean focused, java.util.Map<String, String> attributes) {
        java.util.Map<String, String> copy = new java.util.LinkedHashMap<String, String>(attributes);
        copy.put("id", name);
        copy.put("label", label == null ? "" : label);
        copy.put("enabled", String.valueOf(enabled));
        copy.put("focused", String.valueOf(focused));
        this.attributes = java.util.Collections.unmodifiableMap(copy);
        if (role == null || name == null || role.isEmpty() || name.isEmpty()) {
            throw new IllegalArgumentException("host ui node identity");
        }
        if (itemId < -1 || count < 0) throw new IllegalArgumentException("host ui node item");
        this.role = role;
        this.name = name;
        this.index = index;
        this.itemId = itemId;
        this.count = count;
        this.label = label == null ? "" : label;
        this.enabled = enabled;
        this.focused = focused;
    }

    public String id() { return name; }
    public java.util.Map<String, String> attributes() { return attributes; }
    public HostUiNode withStack(int item, int amount) {
        return new HostUiNode(role, name, index, item, amount, label, enabled, focused, attributes);
    }
    public String role() { return role; }
    public String name() { return name; }
    public int index() { return index; }
    public int itemId() { return itemId; }
    public int count() { return count; }
    public String label() { return label; }
    public boolean enabled() { return enabled; }
    public boolean focused() { return focused; }
}
