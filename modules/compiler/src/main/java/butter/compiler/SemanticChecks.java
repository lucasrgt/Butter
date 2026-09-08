package butter.compiler;

import java.util.List;
import java.util.Map;
import butter.core.SemanticProperties;
import butter.core.WidgetNames;

final class SemanticChecks {
    private SemanticChecks() {}

    static void check(String type, Map<String, Object> props, List<Diagnostic> errors) {
        Object metadata = props.get("semantics");
        if (metadata != null && !(metadata instanceof Map)) error(errors, "semantics", "record", metadata);
        if (metadata instanceof Map) {
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) metadata).entrySet()) {
                String key = String.valueOf(entry.getKey());
                Object value = entry.getValue();
                if (!"id".equals(key) && !"role".equals(key) && !"label".equals(key) && !"description".equals(key)) {
                    error(errors, key, "id, role, label or description", value);
                } else if (!(value instanceof String) || (("id".equals(key) || "role".equals(key)) && ((String) value).trim().isEmpty())) {
                    error(errors, key, "nonempty string", value);
                } else if ("role".equals(key) && !SemanticProperties.compatible(type, WidgetNames.canonical((String) value))) {
                    error(errors, key, "role compatible with " + type, value);
                }
            }
        }
        integer(props, "container_index", "Slot".equals(type), 4095, errors);
        integer(props, "tabIndex", "SearchBar".equals(type), 511, errors);
    }

    private static void integer(Map<String, Object> props, String key, boolean allowed, int max,
            List<Diagnostic> errors) {
        if (!props.containsKey(key)) return;
        Object value = props.get(key);
        if (!allowed || !(value instanceof Number) || ((Number) value).doubleValue() < 0
                || ((Number) value).doubleValue() > max
                || ((Number) value).doubleValue() != ((Number) value).intValue()) {
            error(errors, key, "integer in [0, " + max + "] on supported widget", value);
        }
    }

    static void error(List<Diagnostic> errors, String key, String expected, Object value) {
        errors.add(new Diagnostic("B1502", "Invalid semantic contract", null, key, expected,
                String.valueOf(value), 0, 0));
    }
}
