package butter.runtime;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import butter.core.Binding;
import butter.core.WidgetSpec;

/** Host chrome: SearchBar typing, exclusive Tab selection, Scrollbar value. */
final class ChromeHost {
    private String focused;
    private final Map<String, String> queries = new LinkedHashMap<String, String>();
    private final Map<String, String> tabs = new LinkedHashMap<String, String>();
    private final Map<String, Integer> scrolls = new LinkedHashMap<String, Integer>();

    WidgetSpec apply(WidgetSpec spec) { return apply(spec, null); }

    boolean click(WidgetSpec tree, WidgetSpec spec) {
        String id = spec.id();
        if ("SearchBar".equals(spec.type()) && id != null) {
            focused = id;
            return true;
        }
        focused = null;
        if ("Tab".equals(spec.type()) && id != null) {
            tabs.put(barKey(parentBar(tree, id)), id);
            return true;
        }
        return "Scrollbar".equals(spec.type());
    }

    boolean focusNext(WidgetSpec tree, boolean reverse) {
        List<WidgetSpec> order = WidgetState.focusOrder(tree);
        if (order.isEmpty()) return false;
        int current = -1;
        for (int i = 0; i < order.size(); i++) if (order.get(i).id().equals(focused)) current = i;
        int next = current < 0 ? (reverse ? order.size() - 1 : 0)
                : (current + (reverse ? -1 : 1) + order.size()) % order.size();
        focused = order.get(next).id();
        return true;
    }

    boolean type(char ch, WidgetSpec template, WidgetSpec resolved, Resolver resolver) {
        return edit(false, ch, template, resolved, resolver);
    }

    boolean backspace(WidgetSpec template, WidgetSpec resolved, Resolver resolver) {
        return edit(true, '\0', template, resolved, resolver);
    }

    boolean pointer(WidgetSpec template, WidgetSpec spec, int localY, int height, Resolver resolver) {
        if (!"Scrollbar".equals(spec.type()) || spec.id() == null) return false;
        focused = null;
        int max = Math.max(0, number(spec.prop("max")));
        int value = 0;
        if (max > 0 && height > 1) value = Math.min(max, Math.max(0, localY * max / (height - 1)));
        write(template, spec.id(), "value", Integer.valueOf(value), resolver, false);
        return true;
    }

    boolean setValue(WidgetSpec template, WidgetSpec spec, int value, Resolver resolver) {
        if (!"Scrollbar".equals(spec.type()) || spec.id() == null) return false;
        write(template, spec.id(), "value", Integer.valueOf(Math.max(0, value)), resolver, false);
        return true;
    }

    private boolean edit(boolean delete, char ch, WidgetSpec template, WidgetSpec resolved, Resolver resolver) {
        if (focused == null) return false;
        WidgetSpec spec = ButterRuntime.find(resolved, focused);
        if (spec == null || !"SearchBar".equals(spec.type()) || !butter.core.SemanticProperties.interactive(spec)
                || Boolean.TRUE.equals(spec.prop("readOnly"))) return false;
        String current = queries.containsKey(focused) ? queries.get(focused) : text(spec.prop("value"));
        String next = delete ? (current.isEmpty() ? "" : current.substring(0, current.length() - 1))
                : current + ch;
        int limit = number(spec.prop("maxLength"));
        if (!delete && limit > 0 && next.length() > limit) next = next.substring(0, limit);
        write(template, focused, "value", next, resolver, true);
        return true;
    }

    private void write(WidgetSpec template, String id, String prop, Object value, Resolver resolver,
            boolean query) {
        WidgetSpec raw = ButterRuntime.find(template, id);
        Object binding = raw == null ? null : raw.prop(prop);
        if (binding instanceof Binding) {
            resolver.write(((Binding) binding).path(), value);
            return;
        }
        if (query) queries.put(id, String.valueOf(value));
        else scrolls.put(id, (Integer) value);
    }

    private WidgetSpec apply(WidgetSpec spec, String bar) {
        if ("TabBar".equals(spec.type())) bar = barKey(spec);
        List<WidgetSpec> source = spec.children();
        List<WidgetSpec> children = source;
        if (!source.isEmpty()) {
            children = new ArrayList<WidgetSpec>();
            for (int index = 0; index < source.size(); index++) children.add(apply(source.get(index), bar));
        }
        WidgetSpec next = spec.withChildren(children);
        String id = next.id();
        if ("SearchBar".equals(next.type()) && id != null) {
            next = next.withProp("focused", Boolean.valueOf(id.equals(focused)));
            if (queries.containsKey(id)) next = next.withProp("value", queries.get(id));
        }
        if ("Tab".equals(next.type()) && id != null && bar != null && tabs.containsKey(bar)) {
            next = next.withProp("selected", Boolean.valueOf(id.equals(tabs.get(bar))));
        }
        if ("Scrollbar".equals(next.type()) && id != null && scrolls.containsKey(id)) {
            next = next.withProp("value", scrolls.get(id));
        }
        return next;
    }

    private static WidgetSpec parentBar(WidgetSpec spec, String tabId) {
        if ("TabBar".equals(spec.type()) && ButterRuntime.find(spec, tabId) != null) return spec;
        List<WidgetSpec> children = spec.children();
        for (int index = 0; index < children.size(); index++) {
            WidgetSpec found = parentBar(children.get(index), tabId);
            if (found != null) return found;
        }
        return null;
    }

    private static String barKey(WidgetSpec bar) {
        if (bar == null) return "tabbar";
        if (bar.id() != null) return bar.id();
        List<WidgetSpec> children = bar.children();
        for (int index = 0; index < children.size(); index++) {
            String id = children.get(index).id();
            if (id != null) return "bar:" + id;
        }
        return "tabbar";
    }

    private static String text(Object value) { return value == null ? "" : String.valueOf(value); }

    private static int number(Object value) {
        return value instanceof Number ? ((Number) value).intValue() : 0;
    }
}
