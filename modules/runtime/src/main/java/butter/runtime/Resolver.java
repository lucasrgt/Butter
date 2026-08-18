package butter.runtime;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import butter.core.Binding;
import butter.core.WidgetSpec;
import butter.signals.ReadonlySignal;
import butter.signals.Signal;

final class Resolver {
    private final Object backing;

    Resolver(Object backing) { this.backing = backing; }

    WidgetSpec resolve(WidgetSpec spec) {
        List<Object> arguments = new ArrayList<Object>();
        List<Object> sourceArgs = spec.arguments();
        for (int index = 0; index < sourceArgs.size(); index++) arguments.add(value(sourceArgs.get(index)));
        Map<String, Object> props = new LinkedHashMap<String, Object>();
        for (Map.Entry<String, Object> entry : spec.props().entrySet()) {
            String key = entry.getKey();
            Object resolved = "action".equals(key) ? entry.getValue() : value(entry.getValue());
            props.put(key, resolved);
        }
        List<WidgetSpec> children = new ArrayList<WidgetSpec>();
        List<WidgetSpec> source = spec.children();
        for (int index = 0; index < source.size(); index++) children.add(resolve(source.get(index)));
        return new WidgetSpec(spec.type(), spec.key(), arguments, props, children);
    }

    Object value(Object raw) {
        if (raw instanceof Binding) return read(((Binding) raw).path());
        if (raw instanceof List) return list((List<?>) raw);
        if (raw instanceof Map) return map((Map<?, ?>) raw);
        return unwrap(raw);
    }

    Object invokeAction(String path) {
        if (backing == null) throw new IllegalStateException("no backing class for action " + path);
        try {
            Method method = backing.getClass().getMethod(path);
            method.setAccessible(true);
            return method.invoke(backing);
        } catch (Exception error) {
            throw new IllegalStateException("action failed: " + path, error);
        }
    }

    @SuppressWarnings({ "rawtypes", "unchecked" })
    void write(String path, Object value) {
        if (backing == null) throw new IllegalStateException("no backing class for write " + path);
        try {
            Object current = backing;
            String[] parts = path.split("\\.");
            for (int index = 0; index < parts.length - 1; index++) {
                current = unwrap(member(current, parts[index]));
            }
            String leaf = parts[parts.length - 1];
            Field field = current.getClass().getField(leaf);
            Object cell = field.get(current);
            if (cell instanceof Signal) ((Signal) cell).set(value);
            else field.set(current, value);
        } catch (Exception error) {
            throw new IllegalStateException("write failed: " + path, error);
        }
    }

    private List<Object> list(List<?> raw) {
        List<Object> values = new ArrayList<Object>();
        for (int index = 0; index < raw.size(); index++) values.add(value(raw.get(index)));
        return values;
    }

    private Map<String, Object> map(Map<?, ?> raw) {
        Map<String, Object> values = new LinkedHashMap<String, Object>();
        for (Map.Entry<?, ?> entry : raw.entrySet()) {
            values.put(String.valueOf(entry.getKey()), value(entry.getValue()));
        }
        return values;
    }

    private Object read(String path) {
        if (backing == null) return new Binding(path);
        Object current = backing;
        String[] parts = path.split("\\.");
        for (int index = 0; index < parts.length; index++) {
            current = member(current, parts[index]);
            if (current == null) return null;
            current = unwrap(current);
        }
        return current;
    }

    private Object member(Object target, String name) {
        try {
            Field field = target.getClass().getField(name);
            return field.get(target);
        } catch (Exception ignored) {
            try {
                Method method = target.getClass().getMethod(name);
                return method.invoke(target);
            } catch (Exception error) {
                throw new IllegalStateException("missing backing symbol: " + name);
            }
        }
    }

    private static Object unwrap(Object value) {
        if (value instanceof ReadonlySignal) return ((ReadonlySignal<?>) value).get();
        return value;
    }
}
