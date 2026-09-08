package butter.testing;

import butter.annotations.ButterAction;
import butter.compiler.ButterCompiler;
import butter.compiler.ButterCompileException;
import butter.core.WidgetSpec;
import butter.runtime.ButterRuntime;
import butter.signals.Signal;

public final class SemanticContractTest {
    private SemanticContractTest() {}

    public static void main(String[] arguments) {
        String source = "Stack(id: \"screen\", semantics: (role: screen, label: \"Control\"), children: ["
                + "Slot(id: \"visual\", container_index: 42, semantics: (id: \"input\", label: \"Ore\"),"
                + "enabled: enabled, item: item, count: count, action: activate),"
                + "SearchBar(id: \"later\", tabIndex: 9),"
                + "Stack(visible: visible, children: [SearchBar(id: \"query\", tabIndex: 1, value: query, readOnly: locked)])])";
        Backing backing = new Backing();
        ButterRuntime runtime = ButterRuntime.mount(ButterCompiler.compileSource("Contract.butter", source, Backing.class), backing);
        ButterUi ui = ButterUi.of(runtime);
        require("screen".equals(ui.screen()) && ui.nodes().size() == 4, "one configured screen root");
        require(find(ui, "input").index() == 42 && find(ui, "input").itemId() == 4, "persistent slot binding");
        ui.click("input"); require(backing.calls == 1, "semantic alias dispatch");
        backing.enabled.set(false);
        expectFailure(() -> ui.click("input")); require(backing.calls == 1, "disabled action rejected");
        require(!find(ui, "input").enabled(), "observed state");
        ui.press("TAB"); require(find(ui, "query").focused(), "explicit tab order");
        ui.type('x'); require("x".equals(backing.query.get()), "writable signal");
        require("x".equals(find(ui, "query").attributes().get("text")), "observed text");
        backing.locked.set(true); ui.type('y'); require("x".equals(backing.query.get()), "read-only stops edits");
        ui.press("SHIFT_TAB"); require(find(ui, "later").focused(), "reverse tab order");
        backing.visible.set(false);
        require("false".equals(find(ui, "query").attributes().get("visible")), "inherited visibility");
        expectFailure(() -> ui.click("query"));
        ui.press("TAB"); require(find(ui, "later").focused(), "hidden field skipped");
        for (String invalid : new String[] {
                "Slot(semantics: (role: button))", "Slot(container_index: -1)", "Slot(tabIndex: 0)",
                "Stack(children: [Slot(container_index: 3), Slot(container_index: 3)])",
                "Stack(children: [Slot(id: \"x\"), Slot(semantics: (id: \"x\"))])",
                "SearchBar(value: count)", "Slot(enabled: query)", "Slot(item: missing)",
                "Slot(action: missing)", "Slot(semantics: (enabled: true))" }) {
            try { ButterCompiler.compileSource("Invalid.butter", invalid, Backing.class); throw new AssertionError(invalid); }
            catch (ButterCompileException expected) { }
        }
        WidgetSpec unresolved = ButterCompiler.compileSource("Unbound.butter", "Slot(count: missing)", null);
        expectFailure(() -> ButterRuntime.mount(unresolved, null));
        System.out.println("  semantics contract: stable indices, alias dispatch, states, tab navigation, typed backing");
    }

    private static HostUiNode find(ButterUi ui, String id) {
        for (HostUiNode node : ui.nodes()) if (id.equals(node.id())) return node;
        throw new AssertionError(id);
    }
    private static void require(boolean condition, String message) { if (!condition) throw new AssertionError(message); }
    private static void expectFailure(Runnable action) {
        try { action.run(); throw new AssertionError("expected rejection"); } catch (IllegalStateException expected) { }
    }
    public static final class Backing {
        public final Signal<Boolean> enabled = Signal.of(true), visible = Signal.of(true), locked = Signal.of(false);
        public final Signal<String> query = Signal.of("");
        public int item = 4, count = 8, calls;
        @ButterAction public void activate() { calls++; }
    }
}
