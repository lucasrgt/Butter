package butter.smoke.hostui;

import butter.compiler.ButterCompiler;
import butter.minecraft.ButterGuiScreen;
import butter.runtime.ButterRuntime;
import butter.signals.Signal;
import worldline.api.GameUi;
import worldline.api.GameUiContract;
import worldline.api.GameUiKey;
import worldline.b173.B173Runtime;

/** Mapped-screen acceptance for the editor's provider-owned semantic contract. */
public final class SemanticUiSmoke {
    private SemanticUiSmoke() {}

    static void verify(B173Runtime client) {
        String source = "Stack(id: \"control\", semantics: (role: screen, label: \"Control\"), children: ["
                + "Slot(id: \"ore\", index: 0, container_index: 42, enabled: enabled,"
                + "semantics: (label: \"Ore input\", description: \"Primary input\")),"
                + "SearchBar(id: \"later\", tabIndex: 2),"
                + "SearchBar(id: \"query\", tabIndex: 0, value: query, readOnly: locked, visible: visible,"
                + "semantics: (role: textbox, label: \"Search\"))])";
        Backing state = new Backing();
        ButterRuntime runtime = ButterRuntime.mount(ButterCompiler.compileSource("Control.butter", source, Backing.class), state);
        client.gui().putMain(0, 4, 8);
        client.gui().open(new ButterGuiScreen("fallback", runtime));
        GameUi ui = client.ui(); GameUiContract.validate(ui);
        require("control".equals(ui.screen()) && ui.nodes().size() == 4, "configured root");
        require(ui.slot(42).itemId() == 4 && ui.slot(42).count() == 8, "container index and real inventory");
        require("Primary input".equals(ui.slot(42).attributes().get("description")), "metadata survives inventory overlay");
        ui.press(GameUiKey.TAB); require(ui.getById("query").single().focused(), "tab order through Worldline");
        ui.getByLabel("Search").type("ore");
        require("ore".equals(ui.getById("query").single().attributes().get("text")), "runtime text through Worldline");
        state.locked.set(true); runtime.type('x'); require("ore".equals(state.query.get()), "read-only input");
        ui.press(GameUiKey.REVERSE_TAB); require(ui.getById("later").single().focused(), "reverse tab");
        state.visible.set(false);
        require("false".equals(ui.getById("query").single().attributes().get("visible")), "runtime visibility");
        state.enabled.set(false);
        try { ui.click(ui.slot(42)); throw new AssertionError("disabled inventory slot accepted input"); }
        catch (IllegalStateException expected) { }
        require(ui.slot(42).count() == 8, "disabled slot preserves real stack");
        GameUiContract.validate(ui); ui.close(); client.tick();
        System.out.println("BUTTER_SEMANTICS=PASS root,id,label,description,slot,stack,text,enabled,visible,readOnly,tab");
    }

    public static final class Backing {
        public final Signal<String> query = Signal.of("");
        public final Signal<Boolean> enabled = Signal.of(true), locked = Signal.of(false), visible = Signal.of(true);
    }
    private static void require(boolean condition, String message) { if (!condition) throw new AssertionError(message); }
}
