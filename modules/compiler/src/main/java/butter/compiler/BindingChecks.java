package butter.compiler;

import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;
import butter.core.Binding;

/** Checks the observable state against actual Java members without a signals dependency. */
final class BindingChecks {
    private BindingChecks() {}

    static void check(String widget, Map<String, Object> props, JavaContracts contracts, List<Diagnostic> errors) {
        Object action = props.get("action");
        if (action != null && contracts.backing != null && !contracts.action(String.valueOf(action))) {
            errors.add(new Diagnostic("B1401", "Missing action", widget, "action", "@ButterAction",
                    String.valueOf(action), 0, 0));
        }
        for (String key : new String[] {"enabled", "visible", "readOnly", "value", "max", "item", "count"}) {
            Object value = props.get(key);
            if (value == null) continue;
            String expected = "enabled".equals(key) || "visible".equals(key) || "readOnly".equals(key)
                    ? "boolean" : "value".equals(key) && "SearchBar".equals(widget) ? "String" : "number";
            if ("item".equals(key) || "count".equals(key)) expected = "integer";
            if ("value".equals(key) && ("Checkbox".equals(widget) || "Toggle".equals(widget)
                    || "Radio".equals(widget))) expected = "boolean";
            Class<?> received = value.getClass();
            if (value instanceof Binding) {
                if (contracts.backing == null) continue;
                received = memberType(contracts.backing, ((Binding) value).path());
                if ("SearchBar".equals(widget) && "value".equals(key) && !Boolean.TRUE.equals(props.get("readOnly"))
                        && !writable(contracts.backing, ((Binding) value).path())) {
                    errors.add(new Diagnostic("B1402", "Search value must be writable", widget, key,
                            "non-final String field or Signal<String>", String.valueOf(value), 0, 0));
                }
            }
            if (!matches(expected, received)) {
                errors.add(new Diagnostic("B1402", "Backing state type mismatch or missing symbol", widget,
                        key, expected, String.valueOf(value), 0, 0));
            }
        }
    }

    private static boolean writable(Class<?> root, String path) {
        try {
            int dot = path.lastIndexOf('.');
            Class<?> owner = dot < 0 ? root : memberType(root, path.substring(0, dot));
            if (owner == null) return false;
            Field field = owner.getField(path.substring(dot + 1));
            return "butter.signals.Signal".equals(field.getType().getName())
                    || field.getType() == String.class && !java.lang.reflect.Modifier.isFinal(field.getModifiers());
        } catch (NoSuchFieldException error) { return false; }
    }

    private static Class<?> memberType(Class<?> root, String path) {
        try {
            Class<?> current = root;
            for (String part : path.split("\\.")) {
                Type type;
                try { Field field = current.getField(part); type = field.getGenericType(); }
                catch (NoSuchFieldException error) { type = current.getMethod(part).getGenericReturnType(); }
                current = unwrap(type);
                if (current == null) return null;
            }
            return current;
        } catch (ReflectiveOperationException error) { return null; }
    }

    private static Class<?> unwrap(Type type) {
        if (type instanceof Class) return (Class<?>) type;
        if (!(type instanceof ParameterizedType)) return null;
        ParameterizedType generic = (ParameterizedType) type;
        String name = ((Class<?>) generic.getRawType()).getName();
        if (name.startsWith("butter.signals.")) return unwrap(generic.getActualTypeArguments()[0]);
        return (Class<?>) generic.getRawType();
    }

    private static boolean matches(String expected, Class<?> type) {
        if (type == null) return false;
        if ("boolean".equals(expected)) return type == Boolean.class || type == Boolean.TYPE;
        if ("String".equals(expected)) return type == String.class;
        boolean integer = type == Integer.class || type == Integer.TYPE || type == Long.class || type == Long.TYPE
                || type == Short.class || type == Short.TYPE || type == Byte.class || type == Byte.TYPE;
        return integer || !"integer".equals(expected) && (Number.class.isAssignableFrom(type)
                || type == Double.TYPE || type == Float.TYPE);
    }
}
