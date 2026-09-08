package butter.compiler;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import butter.annotations.ButterAction;
import butter.annotations.ButterComponent;

final class JavaContracts {
    final Class<?> backing;
    final String template;
    final Map<String, String> symbols;
    final Map<String, Method> actions;

    private JavaContracts(Class<?> backing, String template, Map<String, String> symbols, Map<String, Method> actions) {
        this.backing = backing;
        this.template = template;
        this.symbols = symbols;
        this.actions = actions;
    }

    static JavaContracts inspect(Class<?> type) {
        if (type == null) return new JavaContracts(null, "", Collections.<String, String>emptyMap(),
                Collections.<String, Method>emptyMap());
        ButterComponent annotation = type.getAnnotation(ButterComponent.class);
        String template = annotation == null ? "" : annotation.template();
        Map<String, String> symbols = new LinkedHashMap<String, String>();
        Map<String, Method> actions = new LinkedHashMap<String, Method>();
        Field[] fields = type.getFields();
        for (int index = 0; index < fields.length; index++) {
            symbols.put(fields[index].getName(), fields[index].getType().getSimpleName());
        }
        Method[] methods = type.getMethods();
        for (int index = 0; index < methods.length; index++) {
            Method method = methods[index];
            if (method.getDeclaringClass() == Object.class) continue;
            if (method.getParameterTypes().length == 0) symbols.put(method.getName(), method.getReturnType().getSimpleName());
            if (method.getAnnotation(ButterAction.class) != null) {
                if (method.getParameterTypes().length != 0 || method.getReturnType() != Void.TYPE) {
                    throw new ButterCompileException(new Diagnostic("B1401",
                            "Action must be a void no-argument method", type.getSimpleName(),
                            method.getName(), "void()", method.getReturnType().getSimpleName(), 0, 0));
                }
                actions.put(method.getName(), method);
            }
        }
        return new JavaContracts(type, template, symbols, actions);
    }

    boolean has(String path) {
        int dot = path.indexOf('.');
        String head = dot < 0 ? path : path.substring(0, dot);
        return symbols.containsKey(head) || actions.containsKey(head);
    }

    boolean action(String path) { return actions.containsKey(path); }
}
