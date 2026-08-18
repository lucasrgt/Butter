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
}
