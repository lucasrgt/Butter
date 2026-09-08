package butter.minecraft;

import java.util.List;
import butter.layout.BoxConstraints;
import butter.layout.LayoutEngine;
import butter.layout.LayoutNode;
import butter.render.HitTest;
import butter.render.HostRenderer;
import butter.runtime.ButterRuntime;
import butter.testing.HostUi;
import butter.testing.HostUiExport;
import butter.testing.HostUiNode;
import net.minecraft.src.GuiScreen;

/** b1.7.3 GuiScreen that paints a Butter tree and exports HostUi for Worldline. */
public final class ButterGuiScreen extends GuiScreen implements HostUi {
    private final String screenId;
    private final ButterRuntime runtime;
    private final HostRenderer renderer = new HostRenderer();
    private LayoutNode layout;

    public ButterGuiScreen(String screenId, ButterRuntime runtime) {
        if (screenId == null || screenId.isEmpty()) throw new IllegalArgumentException("screen");
        if (runtime == null) throw new IllegalArgumentException("runtime");
        this.screenId = screenId;
        this.runtime = runtime;
    }

    public void initGui() { relayout(); }

    public void drawScreen(int mouseX, int mouseY, float tick) {
        relayout();
        HitTest.Hit hover = layout == null ? null : HitTest.at(layout, mouseX, mouseY);
        runtime.hover(hover == null ? null : hover.id);
        relayout();
        renderer.paint(layout, new MinecraftCanvas(this));
        MinecraftInventory.paint(this, layout, this.mc == null ? null : this.mc.thePlayer);
        super.drawScreen(mouseX, mouseY, tick);
    }

    protected void mouseClicked(int x, int y, int button) {
        HitTest.Hit hit = layout == null ? null : HitTest.at(layout, x, y);
        if (hit != null) {
            if (button == 1) {
                if (MinecraftInventory.rightClick(this.mc == null ? null : this.mc.thePlayer, runtime.tree(), hit.id)) {
                    return;
                }
                runtime.rightClick(hit.id);
                return;
            }
            if (MinecraftInventory.click(this.mc == null ? null : this.mc.thePlayer, runtime.tree(), hit.id)) return;
            runtime.pointer(hit.id, hit.localX, hit.localY, hit.width, hit.height);
            return;
        }
        super.mouseClicked(x, y, button);
    }

    protected void keyTyped(char typed, int key) {
        if (key == 1) {
            super.keyTyped(typed, key);
            return;
        }
        if (key == 15 && runtime.focusNext(org.lwjgl.input.Keyboard.isKeyDown(42)
                || org.lwjgl.input.Keyboard.isKeyDown(54))) return;
        if (key == 14 && runtime.backspace()) return;
        if (typed >= 32 && typed < 127 && runtime.type(typed)) return;
        super.keyTyped(typed, key);
    }

    public boolean doesGuiPauseGame() { return false; }

    public String screen() { return HostUiExport.screen(screenId, runtime.semantics()); }

    public List<HostUiNode> nodes() {
        List<HostUiNode> nodes = HostUiExport.flatten(screen(), runtime.semantics());
        return MinecraftInventory.bind(this.mc == null ? null : this.mc.thePlayer, runtime.tree(), nodes);
    }

    public void click(String name) {
        if (MinecraftInventory.click(this.mc == null ? null : this.mc.thePlayer, runtime.tree(), name)) return;
        runtime.click(name);
    }

    public void type(char ch) { runtime.type(ch); }

    public void backspace() { runtime.backspace(); }

    public void press(String key) {
        if ("TAB".equals(key) || "SHIFT_TAB".equals(key)) runtime.focusNext("SHIFT_TAB".equals(key));
        else if ("BACKSPACE".equals(key)) runtime.backspace();
        else throw new IllegalArgumentException("unsupported key " + key);
    }

    public void setValue(String name, int value) { runtime.setValue(name, value); }

    public void rightClick(String name) {
        if (MinecraftInventory.rightClick(this.mc == null ? null : this.mc.thePlayer, runtime.tree(), name)) return;
        runtime.rightClick(name);
    }

    void fill(int x, int y, int width, int height, int argb) {
        this.drawRect(x, y, x + width, y + height, argb);
    }

    void text(int x, int y, String value, int argb) {
        if (this.fontRenderer != null && value != null) this.drawString(this.fontRenderer, value, x, y, argb);
    }

    private void relayout() {
        int width = this.width > 0 ? this.width : 427;
        int height = this.height > 0 ? this.height : 240;
        layout = LayoutEngine.layout(runtime.tree(), BoxConstraints.loose(width, height));
    }
}
