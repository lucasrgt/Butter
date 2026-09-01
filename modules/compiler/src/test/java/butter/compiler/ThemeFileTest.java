package butter.compiler;

import java.nio.file.Paths;
import butter.core.Theme;
import butter.core.WidgetSpec;

public final class ThemeFileTest {
    private ThemeFileTest() {}

    public static void main(String[] arguments) {
        Theme vanilla = Theme.standard().extend(ThemeFile.load(Paths.get("themes/vanilla.toml")));
        require("vanilla".equals(vanilla.id()), "vanilla id");
        require(vanilla.color("panel") == Theme.standard().color("panel"), "panel");
        require(vanilla.color("accent") == Theme.standard().color("accent"), "accent");
        require(vanilla.color("highlight") == Theme.standard().color("highlight"), "highlight");
        require(vanilla.hasColor("shadow") && vanilla.hasColor("muted"), "bevel colors");
        require(vanilla.hasColor("search") && vanilla.hasFont("title"), "search font");
        Theme thaum = Theme.standard().extend(ThemeFile.load(Paths.get("themes/thaum.toml")));
        require("thaumcraft".equals(thaum.id()) && thaum.hasColor("vis"), "thaum vis");
        require(thaum.color("vis") == 0xFF2E8B57, "vis hex");
        require(thaum.hasSlot("research") && thaum.hasSlot("vanilla"), "slot merge");
        require(thaum.slot("research").contains("thaum"), "slot path");
        Theme fonts = ThemeFile.parse("fonts.toml", "id = \"x\"\n[fonts]\ntitle = \"text-lg\"\n");
        require(fonts.hasFont("title"), "fonts table");
        WidgetSpec spec = ButterCompiler.compileSource("Vis.butter",
                "Panel(class: \"w-20 h-20 bg-vis\")", null, thaum);
        require(spec.className().contains("bg-vis"), "compile vis");
        try {
            ButterCompiler.compileSource("Vis.butter", "Panel(class: \"bg-vis\")", null);
            throw new IllegalStateException("vis must fail on vanilla");
        } catch (ButterCompileException error) {
            require(error.getMessage().contains("B1301"), "unknown vis");
        }
        WidgetSpec research = ButterCompiler.compile(Paths.get("examples/thaum/Research.butter"));
        require("scribe".equals(research.children().get(2).id()), "example theme.toml");
        try {
            ThemeFile.parse("bad.toml", "id = \"x\"\n[widgets]\n");
            throw new IllegalStateException("unknown table must fail");
        } catch (ButterCompileException error) {
            require(error.getMessage().contains("B1701"), "unknown table");
        }
        try {
            ThemeFile.parse("bad.toml", "id = \"x\"\n[colors]\npanel = \"red\"\n");
            throw new IllegalStateException("bad hex must fail");
        } catch (ButterCompileException error) {
            require(error.getMessage().contains("B1704"), "hex");
        }
        System.out.println("  compiler: theme.toml catalog");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
