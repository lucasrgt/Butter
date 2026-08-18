package butter.core;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Immutable compiled widget node. Bindings remain symbolic until mount. */
public final class WidgetSpec {
    private final String type;
    private final String key;
    private final List<Object> arguments;
    private final Map<String, Object> props;
    private final List<WidgetSpec> children;

    public WidgetSpec(String type, String key, List<Object> arguments,
            Map<String, Object> props, List<WidgetSpec> children) {
        if (type == null || type.isEmpty()) throw new IllegalArgumentException("type");
        this.type = type;
        this.key = key;
        this.arguments = freezeValues(arguments);
        this.props = freezeMap(props);
        this.children = freezeChildren(children);
    }

    public String type() { return type; }
    public String key() { return key; }
    public List<Object> arguments() { return arguments; }
    public Map<String, Object> props() { return props; }
    public List<WidgetSpec> children() { return children; }
    public Object prop(String name) { return props.get(name); }

    public String id() {
        Object value = props.get("id");
        if (value instanceof Binding) return null;
        return value == null ? null : String.valueOf(value);
    }

    public String className() {
        Object value = props.get("class");
        return value instanceof String ? (String) value : "";
    }

    public WidgetSpec withChildren(List<WidgetSpec> next) {
        return new WidgetSpec(type, key, arguments, props, next);
    }

    public WidgetSpec withProp(String name, Object value) {
        Map<String, Object> next = new LinkedHashMap<String, Object>(props);
        next.put(name, value);
        return new WidgetSpec(type, key, arguments, next, children);
    }

    private static List<Object> freezeValues(List<Object> values) {
        if (values == null || values.isEmpty()) return Collections.emptyList();
        return Collections.unmodifiableList(new java.util.ArrayList<Object>(values));
    }

    private static List<WidgetSpec> freezeChildren(List<WidgetSpec> values) {
        if (values == null || values.isEmpty()) return Collections.emptyList();
        return Collections.unmodifiableList(new java.util.ArrayList<WidgetSpec>(values));
    }

    private static Map<String, Object> freezeMap(Map<String, Object> values) {
        if (values == null || values.isEmpty()) return Collections.emptyMap();
        return Collections.unmodifiableMap(new LinkedHashMap<String, Object>(values));
    }
}
