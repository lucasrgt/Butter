package butter.testing;

/** Worldline-shaped UI node. Butter owns the type; Worldline maps it by getters. */
public final class HostUiNode {
    public static final String SCREEN = "screen", SLOT = "slot", INVENTORY = "inventory";
    public static final String PROGRESS = "progress", ENERGY = "energy", TANK = "tank";
    public static final String BUTTON = "button", TEXT = "text", SLIDER = "slider";
    private final String role, name;
    private final int index, itemId, count;

    public HostUiNode(String role, String name, int index, int itemId, int count) {
        if (role == null || name == null || role.isEmpty() || name.isEmpty()) {
            throw new IllegalArgumentException("host ui node identity");
        }
        if (itemId < -1 || count < 0) throw new IllegalArgumentException("host ui node item");
        this.role = role;
        this.name = name;
        this.index = index;
        this.itemId = itemId;
        this.count = count;
    }

    public String role() { return role; }
    public String name() { return name; }
    public int index() { return index; }
    public int itemId() { return itemId; }
    public int count() { return count; }
}
