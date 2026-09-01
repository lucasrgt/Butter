package butter.runtime;

import java.util.ArrayList;
import java.util.List;
import butter.core.WidgetSpec;

/** Hides ItemGrid slots whose item id does not contain the filter string. */
final class GridFilter {
    private GridFilter() {}

    static WidgetSpec apply(WidgetSpec spec) {
        if (spec == null) return spec;
        List<WidgetSpec> source = spec.children();
        List<WidgetSpec> children = source;
        if (!source.isEmpty()) {
            children = new ArrayList<WidgetSpec>();
            for (int index = 0; index < source.size(); index++) children.add(apply(source.get(index)));
        }
        WidgetSpec next = spec.withChildren(children);
        if (!"ItemGrid".equals(next.type())) return next;
        Object filter = next.prop("filter");
        if (filter == null) return next;
        String query = String.valueOf(filter).trim();
        if (query.isEmpty()) return next;
        List<WidgetSpec> kept = new ArrayList<WidgetSpec>();
        List<WidgetSpec> slots = next.children();
        for (int index = 0; index < slots.size(); index++) {
            WidgetSpec slot = slots.get(index);
            Object item = slot.prop("item");
            if (item != null && String.valueOf(item).contains(query)) kept.add(slot);
        }
        return next.withChildren(kept);
    }
}
