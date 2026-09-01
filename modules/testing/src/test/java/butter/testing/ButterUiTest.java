package butter.testing;

import butter.annotations.ButterAction;
import butter.annotations.ButterComponent;
import butter.compiler.ButterCompiler;
import butter.core.WidgetSpec;
import butter.runtime.ButterRuntime;
import butter.signals.Signal;

public final class ButterUiTest {
    private ButterUiTest() {}

    public static void main(String[] arguments) {
        WidgetSpec spec = ButterCompiler.compileSource("Scram.butter",
                "Column(children: [\n"
                        + "  EnergyBar(id: \"energy-output\", value: energyOutput, max: 200000),\n"
                        + "  Button(\"SCRAM\", id: \"scram\", action: scram)\n"
                        + "])", Reactor.class);
        Reactor reactor = new Reactor();
        ButterUi ui = ButterUi.of(ButterRuntime.mount(spec, reactor));
        ui.getById("scram").click();
        Expect.toBeGreaterThan(ui.getById("energy-output").number(), 100000);
        Expect.toEqual(ui.getById("scram").role(), "button");
        require(HostUiNode.SCREEN.equals(ui.nodes().get(0).role()) && "butter".equals(ui.screen()), "screen node");
        ButterUi named = ButterUi.of("scram", ButterRuntime.mount(spec, new Reactor()));
        named.click("scram");
        HostUiNode energy = named.nodes().get(1);
        require(HostUiNode.ENERGY.equals(energy.role()) && "energy-output".equals(energy.name()), "energy export");
        require(energy.count() == 180000, "energy count");
        HostUiNode scram = null;
        java.util.List<HostUiNode> exported = named.nodes();
        for (int index = 0; index < exported.size(); index++) {
            if ("scram".equals(exported.get(index).name())) scram = exported.get(index);
        }
        require(scram != null && HostUiNode.BUTTON.equals(scram.role()), "button export");
        HostUiNode slot = ButterUi.of(ButterRuntime.mount(ButterCompiler.compileSource("Slot.butter",
                "Slot(id: \"input\", item: 4, count: 8)", null), null)).nodes().get(1);
        require(HostUiNode.SLOT.equals(slot.role()) && slot.itemId() == 4 && slot.count() == 8, "slot stack");
        ButterUi search = ButterUi.of(ButterRuntime.mount(ButterCompiler.compileSource("Search.butter",
                "SearchBar(id: \"search\", placeholder: \"Search...\")", null), null));
        search.click("search");
        search.type('q');
        require("q".equals(search.getById("search").value()), "hostui type");
        require(search.getById("search").enabled() && search.nodes().get(1).focused(), "focused export");
        ButterUi bar = ButterUi.of(ButterRuntime.mount(ButterCompiler.compileSource("Slide.butter",
                "Slider(id: \"zoom\", value: 0, max: 8)", null), null));
        bar.setValue("zoom", 3);
        require(bar.getById("zoom").number() == 3, "hostui setValue");
        System.out.println("  testing: getById click/assert");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }

    @ButterComponent(template = "Scram.butter")
    public static final class Reactor {
        public final Signal<Integer> energyOutput = Signal.of(Integer.valueOf(0));
        @ButterAction public void scram() { energyOutput.set(Integer.valueOf(180000)); }
    }
}
