package butter.runtime;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import butter.core.SemanticProperties;
import butter.core.WidgetSpec;

final class WidgetState {
    private WidgetState() {}

    static WidgetSpec apply(WidgetSpec spec) { return apply(spec, true, true); }

    private static WidgetSpec apply(WidgetSpec spec, boolean enabled, boolean visible) {
        enabled &= !Boolean.FALSE.equals(spec.prop("enabled"));
        visible &= !Boolean.FALSE.equals(spec.prop("visible"));
        List<WidgetSpec> children = new ArrayList<WidgetSpec>();
        for (WidgetSpec child : spec.children()) children.add(apply(child, enabled, visible));
        WidgetSpec result = spec.withChildren(children).withProp("enabled", enabled).withProp("visible", visible);
        return enabled && visible ? result : result.withProp("focused", false);
    }

    static void requireInput(WidgetSpec spec) {
        if (!SemanticProperties.interactive(spec)) throw new IllegalStateException("widget is disabled or hidden");
    }

    static List<WidgetSpec> focusOrder(WidgetSpec tree) {
        List<WidgetSpec> result = new ArrayList<WidgetSpec>();
        collect(tree, result);
        Collections.sort(result, new Comparator<WidgetSpec>() {
            public int compare(WidgetSpec a, WidgetSpec b) { return Integer.compare(order(a), order(b)); }
        });
        return result;
    }

    private static int order(WidgetSpec spec) {
        return spec.prop("tabIndex") instanceof Number ? ((Number) spec.prop("tabIndex")).intValue() : 512;
    }

    private static void collect(WidgetSpec spec, List<WidgetSpec> result) {
        if ("SearchBar".equals(spec.type()) && spec.id() != null && SemanticProperties.interactive(spec)) result.add(spec);
        for (WidgetSpec child : spec.children()) collect(child, result);
    }
}
