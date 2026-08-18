package butter.compiler;

import butter.annotations.ButterAction;
import butter.annotations.ButterComponent;
import butter.core.WidgetSpec;

public final class ButterCompilerTest {
    private ButterCompilerTest() {}

    public static void main(String[] arguments) {
        WidgetSpec tree = ButterCompiler.compileSource("Hello.butter",
                "Column(\n  class: \"p-8 gap-4\",\n  children: [\n"
                        + "    Text(\"ME Terminal\", class: \"text-lg font-bold\"),\n"
                        + "    Button(\"Craft\", id: \"craft\", class: \"px-8 h-20 bg-accent\")\n"
                        + "  ]\n)", null);
        require(tree.type().equals("Column") && tree.children().size() == 2, "column children");
        require(tree.children().get(0).type().equals("Text"), "text");
        require("craft".equals(tree.children().get(1).id()), "button id");
        try {
            ButterCompiler.compileSource("Bad.butter", "Text(\"x\", class: \"nope\")", null);
            throw new IllegalStateException("unknown utility must fail");
        } catch (ButterCompileException error) {
            require(error.getMessage().contains("B1301"), "utility diagnostic");
        }
        try {
            ButterCompiler.compileSource("Dup.butter",
                    "Column(children: [Button(\"A\", id: \"x\"), Button(\"B\", id: \"x\")])", null);
            throw new IllegalStateException("duplicate id must fail");
        } catch (ButterCompileException error) {
            require(error.getMessage().contains("B1501"), "duplicate id");
        }
        WidgetSpec typed = ButterCompiler.compileSource("Card.butter",
                "public component Card(title: String, show: boolean = true) {\n"
                        + "  Text(title, class: \"text-lg\")\n}\n"
                        + "Card(title: \"Reactor\", show: true)\n", null);
        require("Reactor".equals(typed.arguments().get(0)), "prop");
        try {
            ButterCompiler.compileSource("Mismatch.butter",
                    "public component ReactorHeader(title: String) { Text(title) }\nReactorHeader(title: 1)\n",
                    null);
            throw new IllegalStateException("type mismatch must fail");
        } catch (ButterCompileException error) {
            require(error.getMessage().contains("B1204") && error.getMessage().contains("title"), "B1204");
        }
        try {
            ButterCompiler.compileSource("Bare.butter", "component Bare() { Text(\"x\") }", null);
            throw new IllegalStateException("bare component must fail");
        } catch (ButterCompileException error) {
            require(error.getMessage().contains("B1103"), "visibility");
        }
        WidgetSpec paired = ButterCompiler.compileSource("Panel.butter",
                "Button(\"Craft\", id: \"craft\", enabled: canCraft, action: craft)", Panel.class);
        require(paired.prop("action") != null, "action binding");
        WidgetSpec chrome = ButterCompiler.compile(java.nio.file.Paths.get("examples/vanilla/Chrome.butter"));
        require("Row".equals(chrome.type()) && chrome.children().size() == 3, "chrome row");
        require("SearchBar".equals(chrome.children().get(1).children().get(0).type()), "search");
        try {
            ButterCompiler.compileSource("Panel.butter",
                    "Button(\"Craft\", action: missing)", Panel.class);
            throw new IllegalStateException("missing action must fail");
        } catch (ButterCompileException error) {
            require(error.getMessage().contains("B1401"), "missing action");
        }
        System.out.println("  compiler: parse, utilities, props, contracts");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }

    @ButterComponent(template = "Panel.butter")
    public static final class Panel {
        public boolean canCraft() { return true; }
        @ButterAction public void craft() {}
    }
}
