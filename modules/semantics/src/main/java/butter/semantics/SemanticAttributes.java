package butter.semantics;

import java.util.LinkedHashMap;
import java.util.Map;
import butter.core.SemanticProperties;
import butter.core.WidgetSpec;

final class SemanticAttributes {
    private SemanticAttributes() {}

    static Map<String, String> from(WidgetSpec spec, String id, String label) {
        Map<String, String> result = new LinkedHashMap<String, String>();
        put(result, "id", id);
        put(result, "label", label);
        put(result, "description", SemanticProperties.declared(spec).get("description"));
        put(result, "capabilities", SemanticProperties.declared(spec).get("capabilities"));
        Object custom = SemanticProperties.declared(spec).get("attributes");
        if (custom instanceof Map) {
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) custom).entrySet()) {
                String key = String.valueOf(entry.getKey());
                if (key.matches("[a-z][a-z0-9_-]*(\\.[a-z][a-z0-9_-]*)+")) put(result, key, entry.getValue());
            }
        }
        for (String key : new String[] {"value", "max", "checked", "selected", "expanded", "tabIndex"}) {
            put(result, key, spec.prop(key));
        }
        for (String key : new String[] {"enabled", "visible"}) {
            result.put(key, String.valueOf(!Boolean.FALSE.equals(spec.prop(key))));
        }
        result.put("focused", String.valueOf(Boolean.TRUE.equals(spec.prop("focused"))));
        if ("SearchBar".equals(spec.type())) {
            result.put("readOnly", String.valueOf(Boolean.TRUE.equals(spec.prop("readOnly"))));
            result.put("text", spec.prop("value") == null ? "" : String.valueOf(spec.prop("value")));
        }
        return result;
    }

    private static void put(Map<String, String> result, String key, Object value) {
        if (value != null) result.put(key, String.valueOf(value));
    }
}
