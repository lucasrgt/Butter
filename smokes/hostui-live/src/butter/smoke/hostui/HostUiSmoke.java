package butter.smoke.hostui;

import java.nio.file.Paths;
import butter.annotations.ButterAction;
import butter.annotations.ButterComponent;
import butter.compiler.ButterCompiler;
import butter.core.WidgetSpec;
import butter.minecraft.ButterGuiScreen;
import butter.runtime.ButterRuntime;
import butter.signals.Signal;
import worldline.api.GameUi;
import worldline.api.WorldSource;
import worldline.b173.B173Runtime;
import worldline.b173.B173Runtimes;

/** Mapped-client HostUi bind: GameUi against a live ButterGuiScreen. */
public final class HostUiSmoke {
    private static final long SEED = 17320110707L;
    private static final String TEMPLATE = "Column(children: ["
            + "EnergyBar(id: \"energy-output\", value: energyOutput, max: 200000),"
            + "Slot(id: \"hotbar-0\", index: 0),"
            + "Button(\"IGNITE\", id: \"ignite\", action: ignite),"
            + "Button(\"SCRAM\", id: \"scram\", action: scram)])";

    private HostUiSmoke() {}

    public static void main(String[] arguments) {
        B173Runtime runtime = B173Runtimes.create(SEED);
        runtime.bootHeadless();
        try {
            runtime.loadWorld(WorldSource.at(Paths.get("memory", "hostui")));
            GameUi ui = runtime.ui();
            StringBuilder trace = new StringBuilder();
            require(ui.screen().isEmpty() && ui.nodes().isEmpty(), "UI tree was not empty");
            record(trace, "closed", ui);
            WidgetSpec spec = ButterCompiler.compileSource("Reactor.butter", TEMPLATE, Reactor.class);
            runtime.gui().putMain(0, 4, 8);
            ButterGuiScreen screen = new ButterGuiScreen("reactor", ButterRuntime.mount(spec, new Reactor()));
            runtime.gui().open(screen);
            require("reactor".equals(ui.screen()), "Butter screen id");
            ui.node("button", "ignite");
            ui.node("button", "scram");
            require(ui.nodes().size() == 5, "tree size");
            require(ui.slot(0).itemId() == 4 && ui.slot(0).count() == 8, "live cobble");
            require(ui.node("slot", "hotbar-0").equals(ui.slot(0)), "slot selector");
            record(trace, "open", ui);
            ui.click(ui.node("slot", "hotbar-0"));
            require(ui.slot(0).empty(), "picked up cobble");
            record(trace, "pick", ui);
            ui.click(ui.node("slot", "hotbar-0"));
            require(ui.slot(0).itemId() == 4 && ui.slot(0).count() == 8, "placed cobble");
            record(trace, "place", ui);
            ui.click(ui.node("button", "ignite"));
            require(ui.node("energy", "energy-output").count() == 180000, "ignite energy");
            record(trace, "ignite", ui);
            ui.click(ui.node("button", "scram"));
            require(ui.node("energy", "energy-output").count() == 0, "scram energy");
            record(trace, "scram", ui);
            ui.close();
            runtime.tick();
            require(ui.screen().isEmpty() && ui.nodes().isEmpty(), "semantic close failed");
            record(trace, "closed", ui);
            System.out.println("BUTTER_HOSTUI_SOURCE=" + minecraftClassSource());
            System.out.println("BUTTER_HOSTUI_TRACE=" + trace);
        } finally { runtime.close(); }
    }

    private static void record(StringBuilder trace, String label, GameUi ui) {
        if (trace.length() > 0) trace.append(';');
        String screen = ui.screen();
        int energy = 0;
        String stack = "-";
        if (!screen.isEmpty()) {
            energy = ui.node("energy", "energy-output").count();
            stack = ui.slot(0).itemId() + "x" + ui.slot(0).count();
        }
        trace.append(label).append('=').append(screen.isEmpty() ? "-" : screen)
                .append('/').append(ui.nodes().size()).append('/').append(energy)
                .append('/').append(stack);
    }

    private static String minecraftClassSource() {
        try {
            return Class.forName("net.minecraft.client.Minecraft").getProtectionDomain()
                    .getCodeSource().getLocation().toString();
        } catch (ClassNotFoundException error) { throw new IllegalStateException(error); }
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }

    @ButterComponent(template = "Reactor.butter")
    public static final class Reactor {
        public final Signal<Integer> energyOutput = Signal.of(Integer.valueOf(0));
        @ButterAction public void ignite() { energyOutput.set(Integer.valueOf(180000)); }
        @ButterAction public void scram() { energyOutput.set(Integer.valueOf(0)); }
    }
}
