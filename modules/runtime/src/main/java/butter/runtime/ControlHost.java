package butter.runtime;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import butter.core.Binding;
import butter.core.WidgetSpec;

/** Checkbox, toggle, radio, slider, hover, and numeric set_value. */
final class ControlHost {
    private String hoverId;
    private final Map<String, Boolean> checks = new LinkedHashMap<String, Boolean>();
    private final Map<String, String> radios = new LinkedHashMap<String, String>();
    private final Map<String, Integer> values = new LinkedHashMap<String, Integer>();

    boolean hover(String id) {
        if (id == null ? hoverId == null : id.equals(hoverId)) return false;
        hoverId = id;
        return true;
    }

    boolean click(WidgetSpec template, WidgetSpec spec, Resolver resolver) {
        String id = spec.id();
        String type = spec.type();
        if (("Checkbox".equals(type) || "Toggle".equals(type)) && id != null) {
            boolean next = !truth(spec.prop("value"));
            write(template, id, "value", Boolean.valueOf(next), resolver, null);
            checks.put(id, Boolean.valueOf(next));
            return true;
        }
        if ("Radio".equals(type) && id != null) {
            radios.put(group(spec), id);
            write(template, id, "value", Boolean.TRUE, resolver, null);
            return true;
        }
        return false;
    }

    boolean pointer(WidgetSpec template, WidgetSpec spec, int localX, int width, Resolver resolver) {
        if (!"Slider".equals(spec.type()) || spec.id() == null) return false;
        int max = Math.max(0, number(spec.prop("max")));
        int value = 0;
        if (max > 0 && width > 1) value = Math.min(max, Math.max(0, localX * max / (width - 1)));
        write(template, spec.id(), "value", Integer.valueOf(value), resolver, values);
        return true;
    }

    boolean setValue(WidgetSpec template, WidgetSpec spec, int value, Resolver resolver) {
        String type = spec.type();
        if (!"Slider".equals(type) && !"Flame".equals(type) && !"RecipeProgress".equals(type)
                && !"EnergyBar".equals(type) && !"ProgressBar".equals(type) && !"FluidTank".equals(type)) {
            return false;
        }
        if (spec.id() == null) return false;
        write(template, spec.id(), "value", Integer.valueOf(value), resolver, values);
        return true;
    }

    WidgetSpec apply(WidgetSpec spec) { return apply(spec, null); }

    private WidgetSpec apply(WidgetSpec spec, String radioGroup) {
        if ("Radio".equals(spec.type()) && spec.prop("group") != null) radioGroup = String.valueOf(spec.prop("group"));
        List<WidgetSpec> source = spec.children();
        List<WidgetSpec> children = source;
        if (!source.isEmpty()) {
            children = new ArrayList<WidgetSpec>();
            for (int index = 0; index < source.size(); index++) {
                children.add(apply(source.get(index), radioGroup));
            }
        }
        WidgetSpec next = spec.withChildren(children);
        String id = next.id();
        if (id != null && id.equals(hoverId)) next = next.withProp("hover", Boolean.TRUE);
        if (("Checkbox".equals(next.type()) || "Toggle".equals(next.type())) && id != null && checks.containsKey(id)) {
            next = next.withProp("value", checks.get(id));
        }
        if ("Radio".equals(next.type()) && id != null) {
            String group = next.prop("group") != null ? String.valueOf(next.prop("group")) : radioGroup;
            if (group != null && radios.containsKey(group)) {
                next = next.withProp("selected", Boolean.valueOf(id.equals(radios.get(group))));
                next = next.withProp("value", Boolean.valueOf(id.equals(radios.get(group))));
            }
        }
        if (id != null && values.containsKey(id)) next = next.withProp("value", values.get(id));
        return next;
    }

    private static void write(WidgetSpec template, String id, String prop, Object value, Resolver resolver,
            Map<String, Integer> store) {
        WidgetSpec raw = ButterRuntime.find(template, id);
        Object binding = raw == null ? null : raw.prop(prop);
        if (binding instanceof Binding) {
            resolver.write(((Binding) binding).path(), value);
            return;
        }
        if (store != null && value instanceof Integer) store.put(id, (Integer) value);
    }

    private static String group(WidgetSpec spec) {
        Object group = spec.prop("group");
        return group == null ? "radio" : String.valueOf(group);
    }

    private static boolean truth(Object value) {
        return Boolean.TRUE.equals(value) || "true".equals(String.valueOf(value));
    }

    private static int number(Object value) {
        return value instanceof Number ? ((Number) value).intValue() : 0;
    }
}
