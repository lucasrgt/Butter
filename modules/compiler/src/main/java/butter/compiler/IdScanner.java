package butter.compiler;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import butter.core.WidgetSpec;

final class IdScanner {
    private IdScanner() {}

    static void unique(WidgetSpec spec) {
        List<Diagnostic> errors = new ArrayList<Diagnostic>();
        scan(spec, new LinkedHashSet<String>(), errors);
        indices(spec, new LinkedHashSet<Integer>(), new LinkedHashSet<Integer>(), errors);
        if (!errors.isEmpty()) throw new ButterCompileException(errors);
    }

    private static void indices(WidgetSpec spec, Set<Integer> slots, Set<Integer> tabs, List<Diagnostic> errors) {
        for (String key : new String[] {"container_index", "tabIndex"}) {
            Object value = spec.prop(key);
            if (value instanceof Number && !("tabIndex".equals(key) ? tabs : slots).add(((Number) value).intValue())) {
                SemanticChecks.error(errors, key, "unique index", value);
            }
        }
        for (WidgetSpec child : spec.children()) indices(child, slots, tabs, errors);
    }

    private static void scan(WidgetSpec spec, Set<String> seen, List<Diagnostic> errors) {
        String id = butter.core.SemanticProperties.id(spec);
        if (id != null && !seen.add(id)) {
            errors.add(new Diagnostic("B1501", "Duplicate semantic ID", spec.type(), "id", "unique", id, 0, 0));
        }
        if (spec.id() != null && !spec.id().equals(id) && !seen.add(spec.id())) {
            errors.add(new Diagnostic("B1501", "Ambiguous widget ID alias", spec.type(), "id", "unique", spec.id(), 0, 0));
        }
        List<WidgetSpec> children = spec.children();
        for (int index = 0; index < children.size(); index++) scan(children.get(index), seen, errors);
    }
}
