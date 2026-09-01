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
        LayoutNode search = LayoutEngine.layout(ButterCompiler.compileSource("Search.butter",
                "SearchBar(id: \"search\", placeholder: \"Search...\")", null), BoxConstraints.loose(100, 20));
        BufferCanvas query = new BufferCanvas(100, 20);
        new HostRenderer().paint(search, query);
        require(query.sample(2, 2) == butter.core.Theme.standard().color("muted"), "search placeholder");
        LayoutNode caret = LayoutEngine.layout(ButterCompiler.compileSource("Caret.butter",
                "SearchBar(id: \"search\", focused: true)", null), BoxConstraints.loose(100, 20));
        BufferCanvas focused = new BufferCanvas(100, 20);
        new HostRenderer().paint(caret, focused);
        require(focused.sample(2, 2) == HostRenderer.TEXT, "search caret");
        LayoutNode tab = LayoutEngine.layout(ButterCompiler.compileSource("Tab.butter",
                "Tab(\"Name\", selected: true, side: \"left\")", null), BoxConstraints.loose(40, 20));
        BufferCanvas selected = new BufferCanvas(40, 20);
        new HostRenderer().paint(tab, selected);
        require(selected.sample(23, 2) == HostRenderer.PANEL, "tab merges");
        LayoutNode panel = LayoutEngine.layout(ButterCompiler.compileSource("Bevel.butter",
                "Panel(class: \"w-20 h-20 bg-panel border-vanilla\")", null), BoxConstraints.loose(40, 40));
        BufferCanvas bevel = new BufferCanvas(40, 40);
        new HostRenderer().paint(panel, bevel);
        require(bevel.sample(0, 0) == butter.core.Theme.standard().color("highlight"), "raised highlight");
        require(bevel.sample(19, 19) == butter.core.Theme.standard().color("shadow"), "raised shadow");
        LayoutNode muted = LayoutEngine.layout(ButterCompiler.compileSource("Ink.butter",
                "Text(\"A\", class: \"text-muted\")", null), BoxConstraints.loose(40, 20));
        BufferCanvas ink = new BufferCanvas(40, 20);
        new HostRenderer().paint(muted, ink);
        require(ink.sample(2, 2) == butter.core.Theme.standard().color("muted"), "text-muted");
        LayoutNode large = LayoutEngine.layout(ButterCompiler.compileSource("Lg.butter",
                "Text(\"A\", class: \"text-lg\")", null), BoxConstraints.loose(40, 20));
        BufferCanvas tall = new BufferCanvas(40, 20);
        new HostRenderer().paint(large, tall);
        require(tall.sample(2, 11) == HostRenderer.TEXT, "text-lg glyph");
        LayoutNode bold = LayoutEngine.layout(ButterCompiler.compileSource("Bold.butter",
                "Text(\"A\", class: \"font-bold\")", null), BoxConstraints.loose(40, 20));
        BufferCanvas heavy = new BufferCanvas(40, 20);
        new HostRenderer().paint(bold, heavy);
        require(heavy.sample(8, 2) == HostRenderer.TEXT, "font-bold");
        LayoutNode tank = LayoutEngine.layout(ButterCompiler.compileSource("Tank.butter",
                "FluidTank(id: \"tank\", value: 8, max: 8, class: \"w-18 h-18\")", null),
                BoxConstraints.loose(20, 20));
        BufferCanvas fluid = new BufferCanvas(20, 20);
        new HostRenderer().paint(tank, fluid);
        require(fluid.sample(4, 16) == butter.core.Theme.standard().color("accent"), "tank fill");
        LayoutNode flame = LayoutEngine.layout(ButterCompiler.compileSource("Burn.butter",
                "Flame(id: \"burn\", value: 8, max: 8)", null), BoxConstraints.loose(20, 20));
        BufferCanvas fire = new BufferCanvas(20, 20);
        new HostRenderer().paint(flame, fire);
        require(fire.sample(7, 12) == HostRenderer.ENERGY, "flame");
        LayoutNode idle = LayoutEngine.layout(ButterCompiler.compileSource("Hover.butter",
                "Button(\"Go\", id: \"go\", class: \"w-20 h-20 bg-button hover:bg-accent\")", null),
                BoxConstraints.loose(24, 24));
        BufferCanvas rest = new BufferCanvas(24, 24);
        new HostRenderer().paint(idle, rest);
        require(rest.sample(4, 4) == HostRenderer.BUTTON, "hover idle");
        butter.runtime.ButterRuntime hovered = butter.runtime.ButterRuntime.mount(
                ButterCompiler.compileSource("Hover.butter",
                        "Button(\"Go\", id: \"go\", class: \"w-20 h-20 bg-button hover:bg-accent\")", null),
                null);
        hovered.hover("go");
        BufferCanvas hot = new BufferCanvas(24, 24);
        new HostRenderer().paint(hovered.layout(), hot);
        require(hot.sample(4, 4) == HostRenderer.ACCENT, "hover paint");
        System.out.println("  render: host framebuffer");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
