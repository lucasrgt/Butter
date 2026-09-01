package butter.runtime;

import butter.annotations.ButterAction;
import butter.annotations.ButterComponent;
import butter.compiler.ButterCompiler;
import butter.core.WidgetSpec;
import butter.signals.Computed;
import butter.signals.Signal;

public final class ButterRuntimeTest {
    private ButterRuntimeTest() {}

    public static void main(String[] arguments) {
        WidgetSpec spec = ButterCompiler.compileSource("Panel.butter",
                "Column(children: [\n"
                        + "  Text(\"n\", id: \"label\"),\n"
                        + "  Button(\"Go\", id: \"go\", enabled: canCraft, action: craft)\n"
                        + "])", Host.class);
        Host host = new Host();
        ButterRuntime runtime = ButterRuntime.mount(spec, host);
        require(!runtime.node("go").enabled, "disabled");
        host.energy.set(Integer.valueOf(150));
        require(runtime.node("go").enabled, "enabled after signal");
        runtime.click("go");
        require(host.crafted == 1, "action");
        WidgetSpec chrome = ButterCompiler.compile(java.nio.file.Paths.get("examples/vanilla/Chrome.butter"));
        ButterRuntime screen = ButterRuntime.mount(chrome, null);
        screen.click("search");
        require(screen.type('a') && screen.type('b'), "type");
        require("ab".equals(screen.node("search").value), "query");
        require(screen.backspace() && "a".equals(screen.node("search").value), "backspace");
        screen.click("sort-size");
        require(Boolean.TRUE.equals(screen.tree().children().get(0).children().get(1).prop("selected")), "tab");
        screen.pointer("scroll", 27, 54);
        require(((Number) screen.node("scroll").value).intValue() == 5, "scroll");
        Query query = new Query();
        ButterRuntime bound = ButterRuntime.mount(ButterCompiler.compileSource("Query.butter",
                "SearchBar(id: \"search\", value: query, placeholder: \"Search...\")", Query.class), query);
        bound.click("search");
        bound.type('z');
        require("z".equals(query.query.get()), "bound query");
        ButterRuntime chromeUi = ButterRuntime.mount(chrome, null);
        chromeUi.click("craftable");
        require(Boolean.TRUE.equals(chromeUi.node("craftable").value), "checkbox");
        chromeUi.pointer("zoom", 32, 0, 64, 8);
        require(((Number) chromeUi.node("zoom").value).intValue() == 4, "slider");
        chromeUi.setValue("scroll", 7);
        require(((Number) chromeUi.node("scroll").value).intValue() == 7, "set_value");
        FilterHost filterHost = new FilterHost();
        ButterRuntime filtered = ButterRuntime.mount(ButterCompiler.compileSource("Grid.butter",
                "ItemGrid(id: \"grid\", filter: query, children: ["
                        + "Slot(id: \"coal\", item: 4), Slot(id: \"dirt\", item: 3)])",
                FilterHost.class), filterHost);
        require(filtered.tree().children().size() == 2, "unfiltered");
        filterHost.query.set("4");
        require(filtered.tree().children().size() == 1
                && "coal".equals(filtered.tree().children().get(0).id()), "filter");
        System.out.println("  runtime: signals, actions, invalidation");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }

    @ButterComponent(template = "Panel.butter")
    public static final class Host {
        public final Signal<Integer> energy = Signal.of(Integer.valueOf(0));
        public final Computed<Boolean> canCraft = Computed.of(new Computed.Source<Boolean>() {
            public Boolean get() { return Boolean.valueOf(energy.get().intValue() >= 100); }
        });
        int crafted;
        @ButterAction public void craft() { crafted++; }
    }

    @ButterComponent(template = "Query.butter")
    public static final class Query {
        public final Signal<String> query = Signal.of("");
    }

    @ButterComponent(template = "Grid.butter")
    public static final class FilterHost {
        public final Signal<String> query = Signal.of("");
    }
}
