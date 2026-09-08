package butter.minecraft;

import java.util.ArrayList;
import java.util.List;
import butter.core.WidgetSpec;
import butter.layout.LayoutNode;
import butter.testing.HostUiNode;
import net.minecraft.src.EntityPlayer;
import net.minecraft.src.ItemStack;

/** Live player stacks: overlay HostUi, swap on click, paint counts. */
final class MinecraftInventory {
    private MinecraftInventory() {}

    static List<HostUiNode> bind(EntityPlayer player, WidgetSpec tree, List<HostUiNode> nodes) {
        if (player == null || player.inventory == null || tree == null) return nodes;
        List<HostUiNode> result = new ArrayList<HostUiNode>(nodes.size());
        for (int index = 0; index < nodes.size(); index++) {
            HostUiNode node = nodes.get(index);
            Integer slot = inventoryIndex(tree, node.name());
            result.add(slot == null ? node : stack(node, player.inventory.mainInventory, slot.intValue()));
        }
        return result;
    }

    static boolean click(EntityPlayer player, WidgetSpec tree, String id) {
        return use(player, tree, id, false);
    }

    static boolean rightClick(EntityPlayer player, WidgetSpec tree, String id) {
        return use(player, tree, id, true);
    }

    private static boolean use(EntityPlayer player, WidgetSpec tree, String id, boolean right) {
        if (!inputAllowed(tree, id)) throw new IllegalStateException("widget is disabled or hidden");
        Integer slot = inventoryIndex(tree, id);
        if (player == null || player.inventory == null || slot == null) return false;
        if (right) MinecraftStacks.right(player, slot.intValue());
        else MinecraftStacks.left(player, slot.intValue());
        return true;
    }

    static void paint(ButterGuiScreen screen, LayoutNode layout, EntityPlayer player) {
        if (screen == null || layout == null || player == null || player.inventory == null) return;
        walk(screen, player, layout, 0, 0);
    }

    private static void walk(ButterGuiScreen screen, EntityPlayer player, LayoutNode node, int ox, int oy) {
        if (Boolean.FALSE.equals(node.widget.prop("visible"))) return;
        int x = ox + node.bounds.x;
        int y = oy + node.bounds.y;
        if ("Slot".equals(node.widget.type()) && node.widget.prop("index") instanceof Number) {
            int index = ((Number) node.widget.prop("index")).intValue();
            ItemStack[] main = player.inventory.mainInventory;
            ItemStack stack = index >= 0 && main != null && index < main.length ? main[index] : null;
            if (stack != null && stack.stackSize > 0) {
                screen.text(x + 1, y + 1, Integer.toString(stack.stackSize), 0xFFFFFF);
            }
        }
        List<LayoutNode> children = node.children;
        for (int index = 0; index < children.size(); index++) walk(screen, player, children.get(index), x, y);
    }

    private static HostUiNode stack(HostUiNode node, ItemStack[] main, int index) {
        if (index < 0 || main == null || index >= main.length) {
            throw new IllegalArgumentException("player slot index out of range: " + index);
        }
        ItemStack stack = main[index];
        int itemId = stack == null ? -1 : stack.itemID;
        int count = stack == null ? 0 : stack.stackSize;
        return node.withStack(itemId, count);
    }

    private static boolean inputAllowed(WidgetSpec spec, String id) {
        if (id != null && (id.equals(spec.id()) || id.equals(butter.core.SemanticProperties.id(spec)))) {
            return butter.core.SemanticProperties.interactive(spec);
        }
        for (WidgetSpec child : spec.children()) if (!inputAllowed(child, id)) return false;
        return true;
    }

    private static Integer inventoryIndex(WidgetSpec spec, String id) {
        if (id != null && (id.equals(spec.id()) || id.equals(butter.core.SemanticProperties.id(spec))) && "Slot".equals(spec.type())
                && spec.prop("index") instanceof Number) {
            return Integer.valueOf(((Number) spec.prop("index")).intValue());
        }
        List<WidgetSpec> children = spec.children();
        for (int index = 0; index < children.size(); index++) {
            Integer match = inventoryIndex(children.get(index), id);
            if (match != null) return match;
        }
        return null;
    }
}
