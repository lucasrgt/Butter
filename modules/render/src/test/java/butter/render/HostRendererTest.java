package butter.render;

import butter.compiler.ButterCompiler;
import butter.core.WidgetSpec;
import butter.layout.BoxConstraints;
import butter.layout.LayoutEngine;
import butter.layout.LayoutNode;

public final class HostRendererTest {
    private HostRendererTest() {}

    public static void main(String[] arguments) {
        WidgetSpec spec = ButterCompiler.compileSource("Hello.butter",
                "Column(class: \"p-8 gap-4 bg-panel\", children: [\n"
                        + "  Text(\"ME Terminal\", class: \"text-lg\"),\n"
                        + "  Button(\"Craft\", id: \"craft\", class: \"px-8 h-20 bg-accent\")\n"
                        + "])", null);
        LayoutNode layout = LayoutEngine.layout(spec, BoxConstraints.loose(200, 80));
        BufferCanvas canvas = new BufferCanvas(200, 80);
        new HostRenderer().paint(layout, canvas);
        require(canvas.sample(10, 10) != 0, "panel pixels");
        LayoutNode button = layout.children.get(1);
        require("craft".equals(HitTest.idAt(layout, button.bounds.x + 1, button.bounds.y + 1)), "hit test");
        LayoutNode slot = LayoutEngine.layout(ButterCompiler.compileSource("Slot.butter",
                "Slot(id: \"in\", item: 4, count: 8)", null), BoxConstraints.loose(40, 40));
        BufferCanvas glyph = new BufferCanvas(40, 40);
        new HostRenderer().paint(slot, glyph);
        require(glyph.sample(2, 2) == HostRenderer.TEXT, "slot glyph");
        butter.core.Theme thaum = butter.core.Theme.standard().extend(
                butter.compiler.ThemeFile.load(java.nio.file.Paths.get("themes/thaum.toml")));
        LayoutNode vis = LayoutEngine.layout(ButterCompiler.compileSource("Vis.butter",
                "Panel(class: \"w-20 h-20 bg-vis\")", null, thaum), BoxConstraints.loose(40, 40));
        BufferCanvas tint = new BufferCanvas(40, 40);
        new HostRenderer(thaum).paint(vis, tint);
        require(tint.sample(2, 2) == thaum.color("vis"), "theme fill");
        System.out.println("  render: host framebuffer");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
