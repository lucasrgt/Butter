package butter.reference;

import java.nio.file.Path;
import java.nio.file.Paths;
import butter.compiler.ButterCompiler;
import butter.core.WidgetSpec;
import butter.layout.BoxConstraints;
import butter.layout.LayoutEngine;
import butter.render.BufferCanvas;
import butter.render.HostRenderer;
import butter.runtime.ButterRuntime;
import butter.testing.ButterUi;
import butter.testing.Expect;

public final class FusionReactorTest {
    private FusionReactorTest() {}

    public static void main(String[] arguments) {
        Path dir = Paths.get("modules/reference/src/main/butter");
        WidgetSpec spec = ButterCompiler.compileDirectory(dir, FusionReactorPanel.class).get("FusionReactorPanel");
        require(spec != null && "Column".equals(spec.type()) && spec.children().size() >= 6, "architecture");
        FusionReactorPanel panel = new FusionReactorPanel();
        ButterRuntime runtime = ButterRuntime.mount(spec, panel);
        ButterUi ui = ButterUi.of(runtime);
        require(runtime.node("player-0") != null && "slot".equals(runtime.node("player-0").role), "player inv");
        require("button".equals(ui.getById("ignite").role()), "ignite role");
        require(ui.getById("ignite").enabled(), "can ignite");
        ui.getById("ignite").click();
        Expect.toBeGreaterThan(ui.getById("energy-output").number(), 100000);
        require(!ui.getById("ignite").enabled(), "running");
        require(ui.getById("scram").enabled(), "can scram");
        ui.getById("scram").click();
        Expect.toEqual(Integer.valueOf(0), Integer.valueOf((int) ui.getById("energy-output").number()));
        HostRenderer renderer = new HostRenderer();
        renderer.register("ReactorGraph", new ReactorGraphPainter());
        BufferCanvas canvas = new BufferCanvas(427, 240);
        renderer.paint(LayoutEngine.layout(runtime.tree(), BoxConstraints.loose(427, 240)), canvas);
        require(canvas.sample(20, 20) != 0, "host pixels");
        System.out.println("  reference: fusion reactor E2E");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
