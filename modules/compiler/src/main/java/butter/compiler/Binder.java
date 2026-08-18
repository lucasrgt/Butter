package butter.compiler;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import butter.core.Binding;
import butter.core.Theme;
import butter.core.Utilities;
import butter.core.WidgetNames;
import butter.core.WidgetSpec;

final class Binder {
    private final Map<String, ComponentAst> components;
    private final JavaContracts contracts;
    private final Theme theme;
    private final List<Diagnostic> errors = new ArrayList<Diagnostic>();

    Binder(Map<String, ComponentAst> components, JavaContracts contracts, Theme theme) {
        this.components = components;
        this.contracts = contracts;
        this.theme = theme == null ? Theme.standard() : theme;
    }

    WidgetSpec bindPublic(FileAst file) {
        errors.clear();
        ComponentAst pub = publicComponent(file);
        Scope scope = Scope.root();
        for (int index = 0; index < file.lets.size(); index++) {
            LetAst let = file.lets.get(index);
            scope.define(let.name, expr(let.value, scope, pub.name));
        }
        for (int index = 0; index < pub.params.size(); index++) {
            ParamAst param = pub.params.get(index);
            if (param.defaultValue != null) scope.define(param.name, expr(param.defaultValue, scope, pub.name));
        }
        ExprAst root = file.body != null ? file.body : pub.body;
        WidgetSpec spec = (WidgetSpec) expr(root, scope, pub.name);
        if (!errors.isEmpty()) throw new ButterCompileException(errors);
        return spec;
    }

    private ComponentAst publicComponent(FileAst file) {
        ComponentAst pub = null;
        int count = 0;
        for (int index = 0; index < file.components.size(); index++) {
            ComponentAst component = file.components.get(index);
            components.put(component.name, component);
            if (!component.priv) { pub = component; count++; }
        }
        if (count > 1) {
            throw new ButterCompileException(new Diagnostic("B1101",
                    "Multiple public components in one .butter file", file.fileName, null, null, null, 1, 1));
        }
        if (count == 0 && file.body == null) {
            throw new ButterCompileException(new Diagnostic("B1102", "No public component",
                    file.fileName, null, null, null, 1, 1));
        }
        if (pub != null) return pub;
        String name = file.fileName;
        int dot = name.lastIndexOf('.');
        if (dot > 0) name = name.substring(0, dot);
        return new ComponentAst(false, name, java.util.Collections.<ParamAst>emptyList(), file.body);
    }

    private Object expr(ExprAst ast, Scope scope, String component) {
        if (ast instanceof LiteralAst) return ((LiteralAst) ast).value;
        if (ast instanceof NameAst) return name(((NameAst) ast).path, scope);
        if (ast instanceof ListAst) return list((ListAst) ast, scope, component);
        if (ast instanceof RecordAst) return record((RecordAst) ast, scope, component);
        if (ast instanceof CallAst) return call((CallAst) ast, scope, component);
        throw new ButterCompileException(new Diagnostic("B1001", "Unknown expression", component, null, null, null, 0, 0));
    }

    private Object name(String path, Scope scope) {
        Object local = scope.lookup(path);
        if (local != null) return local;
        return new Binding(path);
    }

    private List<Object> list(ListAst ast, Scope scope, String component) {
        List<Object> items = new ArrayList<Object>();
        for (int index = 0; index < ast.items.size(); index++) items.add(expr(ast.items.get(index), scope, component));
        return items;
    }

    private Map<String, Object> record(RecordAst ast, Scope scope, String component) {
        Map<String, Object> fields = new LinkedHashMap<String, Object>();
        for (Map.Entry<String, ExprAst> entry : ast.fields.entrySet()) {
            fields.put(entry.getKey(), expr(entry.getValue(), scope, component));
        }
        return fields;
    }

    private Object call(CallAst ast, Scope scope, String component) {
        ComponentAst custom = components.get(ast.name);
        if (custom != null) return expand(custom, ast, scope, component);
        if (!WidgetNames.builtin(ast.name)) {
            errors.add(new Diagnostic("B1601", "Unknown component", ast.name, null, null, ast.name, 0, 0));
            return new WidgetSpec(ast.name, null, java.util.Collections.emptyList(),
                    java.util.Collections.<String, Object>emptyMap(), java.util.Collections.<WidgetSpec>emptyList());
        }
        return widget(ast, scope, component);
    }

    private WidgetSpec expand(ComponentAst custom, CallAst ast, Scope caller, String component) {
        Scope child = caller.child();
        Map<String, ExprAst> named = ast.named;
        for (int index = 0; index < custom.params.size(); index++) {
            ParamAst param = custom.params.get(index);
            ExprAst value = named.get(param.name);
            if (value == null) value = param.defaultValue;
            if (value == null) {
                errors.add(new Diagnostic("B1206", "Missing required prop", custom.name, param.name,
                        param.type, "missing", 0, 0));
                continue;
            }
            Object resolved = expr(value, caller, custom.name);
            checkType(custom.name, param, resolved);
            child.define(param.name, resolved);
        }
        for (String key : named.keySet()) {
            if (!custom.hasParam(key)) {
                errors.add(new Diagnostic("B1205", "Unknown property", custom.name, key, null, key, 0, 0));
            }
        }
        return (WidgetSpec) expr(custom.body, child, custom.name);
    }

    private WidgetSpec widget(CallAst ast, Scope scope, String component) {
        List<Object> arguments = list(new ListAst(ast.positional), scope, component);
        Map<String, Object> props = record(new RecordAst(ast.named), scope, component);
        List<WidgetSpec> children = children(props.remove("children"));
        Object child = props.remove("child");
        if (child instanceof WidgetSpec) {
            List<WidgetSpec> next = new ArrayList<WidgetSpec>(children);
            next.add((WidgetSpec) child);
            children = next;
        }
        Object className = props.get("class");
        if (className instanceof String) {
            List<String> unknown = Utilities.unknownTokens((String) className, theme);
            for (int index = 0; index < unknown.size(); index++) {
                errors.add(new Diagnostic("B1301", "Unknown utility", component, "class", null, unknown.get(index), 0, 0));
            }
        }
        SemanticsProps.literals(props);
        checkBindings(component, props);
        String key = props.get("key") instanceof String ? (String) props.get("key") : null;
        return new WidgetSpec(ast.name, key, arguments, props, children);
    }

    @SuppressWarnings("unchecked")
    private List<WidgetSpec> children(Object value) {
        if (!(value instanceof List)) return java.util.Collections.emptyList();
        List<WidgetSpec> children = new ArrayList<WidgetSpec>();
        List<Object> items = (List<Object>) value;
        for (int index = 0; index < items.size(); index++) {
            if (items.get(index) instanceof WidgetSpec) children.add((WidgetSpec) items.get(index));
        }
        return children;
    }

    private void checkBindings(String component, Map<String, Object> props) {
        Object action = props.get("action");
        if (action instanceof Binding) {
            Binding binding = (Binding) action;
            if (contracts.template != null && !contracts.template.isEmpty() && !contracts.action(binding.path())) {
                errors.add(new Diagnostic("B1401", "Missing action", component, "action", "@ButterAction",
                        binding.path(), 0, 0));
            }
        }
        Object enabled = props.get("enabled");
        if (enabled instanceof Binding && !contracts.has(((Binding) enabled).path()) && !contracts.template.isEmpty()) {
            errors.add(new Diagnostic("B1402", "Missing backing symbol", component, "enabled", "boolean",
                    ((Binding) enabled).path(), 0, 0));
        }
    }

    private void checkType(String component, ParamAst param, Object value) {
        String received = value == null ? "null" : value.getClass().getSimpleName();
        if (value instanceof Binding) return;
        if (param.type.startsWith("List") && value instanceof List) return;
        if ("Widget".equals(param.type.replace("?", "")) && value instanceof WidgetSpec) return;
        if ("String".equals(param.type) && value instanceof String) return;
        if (("int".equals(param.type) || "float".equals(param.type)) && value instanceof Number) return;
        if ("boolean".equals(param.type) && value instanceof Boolean) return;
        if (param.type.endsWith("?") && value == null) return;
        if (!param.type.contains(".") && !"Widget".equals(param.type.replace("?", ""))
                && !param.type.startsWith("List") && !isPrimitive(param.type)) return;
        if (!matches(param.type, value)) {
            errors.add(new Diagnostic("B1204", "Property type mismatch", component, param.name, param.type, received, 0, 0));
        }
    }

    private static boolean isPrimitive(String type) {
        return "String".equals(type) || "int".equals(type) || "float".equals(type) || "boolean".equals(type);
    }

    private static boolean matches(String type, Object value) {
        String clean = type.replace("?", "");
        if ("String".equals(clean)) return value instanceof String;
        if ("int".equals(clean)) return value instanceof Integer;
        if ("float".equals(clean)) return value instanceof Number;
        if ("boolean".equals(clean)) return value instanceof Boolean;
        if ("Widget".equals(clean)) return value instanceof WidgetSpec;
        return true;
    }
}
