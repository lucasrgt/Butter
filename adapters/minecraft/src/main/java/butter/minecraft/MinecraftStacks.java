package butter.minecraft;

import net.minecraft.src.EntityPlayer;
import net.minecraft.src.ItemStack;
import org.lwjgl.input.Keyboard;

/** Cursor merge, right-click split/place, and shift-move on player mainInventory. */
final class MinecraftStacks {
    private static final int LIMIT = 64;

    private MinecraftStacks() {}

    static void left(EntityPlayer player, int index) {
        bounds(player, index);
        if (shift()) shiftMove(player, index);
        else mergeOrSwap(player, index);
    }

    static void right(EntityPlayer player, int index) {
        bounds(player, index);
        ItemStack[] main = player.inventory.mainInventory;
        ItemStack slot = main[index];
        ItemStack held = player.inventory.getItemStack();
        if (held == null && slot != null) {
            int take = (slot.stackSize + 1) / 2;
            ItemStack split = slot.copy();
            split.stackSize = take;
            slot.stackSize -= take;
            if (slot.stackSize <= 0) main[index] = null;
            player.inventory.setItemStack(split);
        } else if (held != null && slot == null) {
            placeOne(player, main, index, held);
        } else if (same(slot, held) && slot.stackSize < LIMIT) {
            placeOne(player, main, index, held);
        } else {
            swap(player, main, index, held);
        }
        player.inventory.onInventoryChanged();
    }

    static void mergeOrSwap(EntityPlayer player, int index) {
        ItemStack[] main = player.inventory.mainInventory;
        ItemStack slot = main[index];
        ItemStack held = player.inventory.getItemStack();
        if (same(slot, held)) {
            int move = Math.min(LIMIT - slot.stackSize, held.stackSize);
            if (move > 0) {
                slot.stackSize += move;
                held.stackSize -= move;
                if (held.stackSize <= 0) player.inventory.setItemStack(null);
                player.inventory.onInventoryChanged();
                return;
            }
        }
        swap(player, main, index, held);
        player.inventory.onInventoryChanged();
    }

    static void shiftMove(EntityPlayer player, int index) {
        ItemStack[] main = player.inventory.mainInventory;
        ItemStack stack = main[index];
        if (stack == null) return;
        int start = index < 9 ? 9 : 0;
        int end = index < 9 ? 36 : 9;
        for (int slot = start; slot < end && stack.stackSize > 0; slot++) {
            if (!same(main[slot], stack)) continue;
            int move = Math.min(LIMIT - main[slot].stackSize, stack.stackSize);
            main[slot].stackSize += move;
            stack.stackSize -= move;
        }
        for (int slot = start; slot < end && stack.stackSize > 0; slot++) {
            if (main[slot] != null) continue;
            main[slot] = stack;
            main[index] = null;
            stack = null;
            break;
        }
        if (stack != null && stack.stackSize <= 0) main[index] = null;
        player.inventory.onInventoryChanged();
    }

    private static void placeOne(EntityPlayer player, ItemStack[] main, int index, ItemStack held) {
        if (main[index] == null) {
            ItemStack one = held.copy();
            one.stackSize = 1;
            main[index] = one;
        } else {
            main[index].stackSize++;
        }
        held.stackSize--;
        if (held.stackSize <= 0) player.inventory.setItemStack(null);
    }

    private static void swap(EntityPlayer player, ItemStack[] main, int index, ItemStack held) {
        player.inventory.setItemStack(main[index]);
        main[index] = held;
    }

    private static boolean same(ItemStack left, ItemStack right) {
        return left != null && right != null && left.itemID == right.itemID
                && left.getItemDamage() == right.getItemDamage();
    }

    private static void bounds(EntityPlayer player, int index) {
        ItemStack[] main = player.inventory.mainInventory;
        if (index < 0 || main == null || index >= main.length) {
            throw new IllegalArgumentException("player slot index out of range: " + index);
        }
    }

    private static boolean shift() {
        return Keyboard.isKeyDown(42) || Keyboard.isKeyDown(54);
    }
}
