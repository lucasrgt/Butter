package butter.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Expands catalog containers into Slot children at mount. */
public final class WidgetExpander {
    private WidgetExpander() {}

    public static WidgetSpec expand(WidgetSpec spec) {
        if (spec == null) return spec;
        List<WidgetSpec> children = spec.children();
        if (children.isEmpty()) {
            WidgetSpec leaf = expandLeaf(spec);
            if (leaf != spec) return leaf;
        }
        List<WidgetSpec> next = new ArrayList<WidgetSpec>(children.size());
        boolean changed = false;
        for (int index = 0; index < children.size(); index++) {
            WidgetSpec child = expand(children.get(index));
            next.add(child);
            if (child != children.get(index)) changed = true;
        }
        return changed ? spec.withChildren(next) : spec;
    }

    private static WidgetSpec expandLeaf(WidgetSpec spec) {
        if ("PlayerInventory".equals(spec.type())) return spec.withChildren(slots("player", 36, true));
        if ("UpgradeSlots".equals(spec.type())) return spec.withChildren(slots("upgrade", 4, false));
        if ("ItemGrid".equals(spec.type())) {
            int count = spec.prop("slots") instanceof Number ? ((Number) spec.prop("slots")).intValue() : 9;
            if (count < 0) count = 0;
            return spec.withChildren(slots("grid", count, false));
        }
        return spec;
    }

    private static List<WidgetSpec> slots(String prefix, int count, boolean indexed) {
        List<WidgetSpec> slots = new ArrayList<WidgetSpec>(count);
        for (int index = 0; index < count; index++) {
            Map<String, Object> props = new LinkedHashMap<String, Object>();
            props.put("id", prefix + "-" + index);
            if (indexed) props.put("index", Integer.valueOf(index));
            slots.add(new WidgetSpec("Slot", null, Collections.emptyList(), props,
                    Collections.<WidgetSpec>emptyList()));
        }
        return slots;
    }
}
