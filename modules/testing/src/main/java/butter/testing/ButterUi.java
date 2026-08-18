package butter.testing;

import java.util.List;
import butter.runtime.ButterRuntime;
import butter.semantics.SemanticNode;

/** Worldline-facing selector surface. Worldline consumes this; it does not own it. */
public final class ButterUi implements HostUi {
    private final String screen;
    private final ButterRuntime runtime;

    public ButterUi(ButterRuntime runtime) { this("butter", runtime); }

    public ButterUi(String screen, ButterRuntime runtime) {
        if (screen == null || screen.isEmpty()) throw new IllegalArgumentException("screen");
        if (runtime == null) throw new IllegalArgumentException("runtime");
        this.screen = screen;
        this.runtime = runtime;
    }

    public static ButterUi of(ButterRuntime runtime) { return new ButterUi(runtime); }

    public static ButterUi of(String screen, ButterRuntime runtime) { return new ButterUi(screen, runtime); }

    public Handle getById(String id) { return new Handle(runtime, runtime.node(id), id); }

    public String screen() { return screen; }

    public List<HostUiNode> nodes() { return HostUiExport.flatten(screen, runtime.semantics()); }

    public void click(String name) { runtime.click(name); }

    public static final class Handle {
        private final ButterRuntime runtime;
        private final SemanticNode node;
        private final String id;

        Handle(ButterRuntime runtime, SemanticNode node, String id) {
            this.runtime = runtime;
            this.node = node;
            this.id = id;
        }

        public void click() { runtime.click(id); }
        public String role() { return node.role; }
        public String label() { return node.label; }
        public boolean enabled() { return runtime.node(id).enabled; }
        public Object value() { return runtime.node(id).value; }

        public double number() {
            Object value = value();
            if (value instanceof Number) return ((Number) value).doubleValue();
            throw new IllegalStateException(id + " is not numeric");
        }
    }
}
