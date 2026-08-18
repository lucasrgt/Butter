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
        renderer.paint(layout, new MinecraftCanvas(this));
        MinecraftInventory.paint(this, layout, this.mc == null ? null : this.mc.thePlayer);
        super.drawScreen(mouseX, mouseY, tick);
    }

    protected void mouseClicked(int x, int y, int button) {
        String id = layout == null ? null : HitTest.idAt(layout, x, y);
        if (id != null) click(id);
        else super.mouseClicked(x, y, button);
    }

    public boolean doesGuiPauseGame() { return false; }

    public String screen() { return screenId; }

    public List<HostUiNode> nodes() {
        List<HostUiNode> nodes = HostUiExport.flatten(screenId, runtime.semantics());
        return MinecraftInventory.bind(this.mc == null ? null : this.mc.thePlayer, runtime.tree(), nodes);
    }

    public void click(String name) {
        if (MinecraftInventory.click(this.mc == null ? null : this.mc.thePlayer, runtime.tree(), name)) return;
        runtime.click(name);
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
