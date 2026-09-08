package butter.core;

import java.util.Collections;
import java.util.Map;

/** Shared identity and state rules for exporters and input dispatch. */
public final class SemanticProperties {
    private SemanticProperties() {}

    @SuppressWarnings("unchecked")
    public static Map<String, Object> declared(WidgetSpec spec) {
        return spec.prop("semantics") instanceof Map ? (Map<String, Object>) spec.prop("semantics")
                : Collections.<String, Object>emptyMap();
    }

    public static String id(WidgetSpec spec) {
        Object id = declared(spec).get("id");
        return id instanceof String ? (String) id : spec.id();
    }

    public static String role(WidgetSpec spec) {
        Object role = declared(spec).get("role");
        return WidgetNames.canonical(role == null ? WidgetNames.role(spec.type()) : String.valueOf(role));
    }

    public static boolean interactive(WidgetSpec spec) {
        return !Boolean.FALSE.equals(spec.prop("enabled")) && !Boolean.FALSE.equals(spec.prop("visible"));
    }

    public static boolean acceptsPointer(WidgetSpec spec) {
        if (spec.prop("action") != null) return true;
        String type = spec.type();
        return "Slot".equals(type) || "Button".equals(type) || "SearchBar".equals(type)
                || "Slider".equals(type) || "Scrollbar".equals(type) || "Tab".equals(type)
                || "Checkbox".equals(type) || "Toggle".equals(type) || "Radio".equals(type);
    }

    public static boolean compatible(String type, String role) {
        if (WidgetNames.role(type).equals(role)) return true;
        if ("SearchBar".equals(type)) return "textbox".equals(role);
        if ("Stack".equals(type) || "Row".equals(type) || "Column".equals(type) || "Panel".equals(type)) {
            return "screen".equals(role) || "group".equals(role) || "region".equals(role)
                    || "panel".equals(role) || "inventory".equals(role) || "generic".equals(role);
        }
        return false;
    }
}
