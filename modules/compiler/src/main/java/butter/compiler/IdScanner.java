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
        if (!errors.isEmpty()) throw new ButterCompileException(errors);
    }

    private static void scan(WidgetSpec spec, Set<String> seen, List<Diagnostic> errors) {
        String id = spec.id();
        if (id != null && !seen.add(id)) {
            errors.add(new Diagnostic("B1501", "Duplicate semantic ID", spec.type(), "id", "unique", id, 0, 0));
        }
        List<WidgetSpec> children = spec.children();
        for (int index = 0; index < children.size(); index++) scan(children.get(index), seen, errors);
    }
}
