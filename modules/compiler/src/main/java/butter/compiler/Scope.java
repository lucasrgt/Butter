package butter.compiler;

import java.util.LinkedHashMap;
import java.util.Map;

final class Scope {
    private final Scope parent;
    private final Map<String, Object> values = new LinkedHashMap<String, Object>();

    private Scope(Scope parent) { this.parent = parent; }

    static Scope root() { return new Scope(null); }

    Scope child() { return new Scope(this); }

    void define(String name, Object value) { values.put(name, value); }

    Object lookup(String path) {
        int dot = path.indexOf('.');
        String head = dot < 0 ? path : path.substring(0, dot);
        if (values.containsKey(head)) {
            Object value = values.get(head);
            if (dot < 0) return value;
            return value;
        }
        return parent == null ? null : parent.lookup(path);
    }
}
