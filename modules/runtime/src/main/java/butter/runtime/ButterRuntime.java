package butter.runtime;

import butter.core.Binding;
import butter.core.WidgetExpander;
import butter.core.WidgetSpec;
import butter.layout.BoxConstraints;
import butter.layout.LayoutEngine;
import butter.layout.LayoutNode;
import butter.semantics.SemanticNode;
import butter.semantics.SemanticTree;
import butter.signals.Computed;
import butter.signals.Signal;

/** Mounted widget tree with layout, semantics, and action dispatch. */
public final class ButterRuntime {
    private final WidgetSpec template;
    private final Object backing;
    private final Resolver resolver;
    private final ChromeHost chrome = new ChromeHost();
    private final ControlHost controls = new ControlHost();
    private WidgetSpec resolved;
    private LayoutNode layout;
    private SemanticTree semantics;
    private int generation;

    public ButterRuntime(WidgetSpec template, Object backing) {
        this.template = template;
        this.backing = backing;
        this.resolver = new Resolver(backing);
    }

    public static ButterRuntime mount(WidgetSpec template, Object backing) {
        ButterRuntime runtime = new ButterRuntime(template, backing);
        runtime.rebuild();
        runtime.listen(backing);
        return runtime;
    }

    public WidgetSpec tree() { return resolved; }
    public LayoutNode layout() { return layout; }
    public SemanticTree semantics() { return semantics; }
    public Object backing() { return backing; }
    public int generation() { return generation; }

    public SemanticNode node(String id) {
        SemanticNode node = semantics.byId(id);
        if (node == null) throw new IllegalStateException("no semantic node " + id);
        return node;
    }

    public void click(String id) {
        WidgetSpec spec = find(resolved, id);
        if (spec == null) throw new IllegalStateException("no widget " + id);
        boolean handled = chrome.click(resolved, spec) || controls.click(template, spec, resolver);
        Object action = spec.prop("action");
        if (action != null && !"null".equals(String.valueOf(action))) {
            String name = action instanceof Binding ? ((Binding) action).path() : String.valueOf(action);
            resolver.invokeAction(name);
            rebuild();
            return;
        }
        if (handled) rebuild();
        else if (!"Slot".equals(spec.type())) throw new IllegalStateException("no action on " + id);
    }

    public boolean type(char ch) {
        if (ch < 32 || ch == 127) return false;
        if (!chrome.type(ch, template, resolved, resolver)) return false;
        rebuild();
        return true;
    }

    public boolean backspace() {
        if (!chrome.backspace(template, resolved, resolver)) return false;
        rebuild();
        return true;
    }

    public void pointer(String id, int localY, int height) {
        pointer(id, 0, localY, 1, height);
    }

    public void pointer(String id, int localX, int localY, int width, int height) {
        WidgetSpec spec = find(resolved, id);
        if (spec == null) throw new IllegalStateException("no widget " + id);
        if (chrome.pointer(template, spec, localY, height, resolver)
                || controls.pointer(template, spec, localX, width, resolver)) rebuild();
        else click(id);
    }

    public void hover(String id) {
        if (controls.hover(id)) rebuild();
    }

    public void setValue(String id, int value) {
        WidgetSpec spec = find(resolved, id);
        if (spec == null) throw new IllegalStateException("no widget " + id);
        if (chrome.setValue(template, spec, value, resolver) || controls.setValue(template, spec, value, resolver)) {
            rebuild();
        }
    }

    public void rightClick(String id) {
        WidgetSpec spec = find(resolved, id);
        if (spec == null) throw new IllegalStateException("no widget " + id);
        if ("Slot".equals(spec.type())) return;
        click(id);
    }

    public void rebuild() {
        resolved = GridFilter.apply(controls.apply(chrome.apply(WidgetExpander.expand(resolver.resolve(template)))));
        layout = LayoutEngine.layout(resolved, BoxConstraints.loose(427, 240));
        semantics = SemanticTree.of(resolved);
        generation++;
    }

    static WidgetSpec find(WidgetSpec spec, String id) {
        if (id != null && id.equals(spec.id())) return spec;
        java.util.List<WidgetSpec> children = spec.children();
        for (int index = 0; index < children.size(); index++) {
            WidgetSpec match = find(children.get(index), id);
            if (match != null) return match;
        }
        return null;
    }

    private void listen(Object target) {
        if (target == null) return;
        java.lang.reflect.Field[] fields = target.getClass().getFields();
        Runnable invalidate = new Runnable() {
            public void run() { rebuild(); }
        };
        for (int index = 0; index < fields.length; index++) {
            try {
                Object value = fields[index].get(target);
                if (value instanceof Signal) ((Signal<?>) value).add(invalidate);
                else if (value instanceof Computed) ((Computed<?>) value).add(invalidate);
            } catch (IllegalAccessException ignored) { }
        }
    }
}
