package butter.compiler;

import java.util.List;
import java.util.Map;

/** Deterministic pretty-printer for a parsed `.butter` file. */
final class ButterPrinter {
    private final StringBuilder out = new StringBuilder();

    String print(FileAst file) {
        boolean wrote = false;
        for (int index = 0; index < file.lets.size(); index++) {
            if (wrote) out.append('\n');
            LetAst let = file.lets.get(index);
            out.append("let ").append(let.name).append(" = ");
            expr(let.value, 0);
            out.append('\n');
            wrote = true;
        }
        for (int index = 0; index < file.components.size(); index++) {
            if (wrote) out.append('\n');
            component(file.components.get(index), 0);
            out.append('\n');
            wrote = true;
        }
        if (file.body != null) {
            if (wrote) out.append('\n');
            expr(file.body, 0);
            out.append('\n');
        }
        return out.toString();
    }

    private void component(ComponentAst component, int indent) {
        pad(indent);
        out.append(component.priv ? "private " : "public ");
        out.append("component ").append(component.name).append('(');
        for (int index = 0; index < component.params.size(); index++) {
            if (index > 0) out.append(", ");
            ParamAst param = component.params.get(index);
            out.append(param.name).append(": ").append(param.type);
            if (param.defaultValue != null) {
                out.append(" = ");
                expr(param.defaultValue, indent);
            }
        }
        out.append(") {\n");
        pad(indent + 1);
        expr(component.body, indent + 1);
        out.append('\n');
        pad(indent);
        out.append('}');
    }

    private void expr(ExprAst ast, int indent) {
        if (ast instanceof LiteralAst) literal(((LiteralAst) ast).value);
        else if (ast instanceof NameAst) out.append(((NameAst) ast).path);
        else if (ast instanceof ListAst) list((ListAst) ast, indent);
        else if (ast instanceof RecordAst) record((RecordAst) ast, indent);
        else if (ast instanceof CallAst) call((CallAst) ast, indent);
        else throw new IllegalStateException("unknown expression");
    }

    private void call(CallAst call, int indent) {
        out.append(call.name).append('(');
        args(call.positional, call.named, indent, heavy(call));
        out.append(')');
    }

    private void list(ListAst list, int indent) {
        out.append('[');
        args(list.items, null, indent, heavy(list));
        out.append(']');
    }

    private void record(RecordAst record, int indent) {
        out.append('(');
        args(null, record.fields, indent, heavy(record));
        out.append(')');
    }

    private void args(List<ExprAst> positional, Map<String, ExprAst> named, int indent, boolean block) {
        boolean first = true;
        if (positional != null) {
            for (int index = 0; index < positional.size(); index++) {
                first = sep(first, block, indent);
                expr(positional.get(index), indent + 1);
            }
        }
        if (named != null) {
            for (Map.Entry<String, ExprAst> entry : named.entrySet()) {
                first = sep(first, block, indent);
                out.append(entry.getKey()).append(": ");
                expr(entry.getValue(), indent + 1);
            }
        }
        if (block && !first) {
            out.append('\n');
            pad(indent);
        }
    }

    private boolean sep(boolean first, boolean block, int indent) {
        if (!first) out.append(block ? ",\n" : ", ");
        else if (block) out.append('\n');
        if (block) pad(indent + 1);
        return false;
    }

    private void literal(Object value) {
        if (value == null) out.append("null");
        else if (value instanceof String) quote((String) value);
        else if (value instanceof Boolean) out.append(((Boolean) value).booleanValue() ? "true" : "false");
        else out.append(String.valueOf(value));
    }

    private void quote(String text) {
        out.append('"');
        for (int index = 0; index < text.length(); index++) {
            char current = text.charAt(index);
            if (current == '"' || current == '\\') out.append('\\').append(current);
            else if (current == '\n') out.append("\\n");
            else out.append(current);
        }
        out.append('"');
    }

    private void pad(int indent) {
        for (int index = 0; index < indent; index++) out.append("  ");
    }

    static boolean heavy(ExprAst ast) {
        if (ast instanceof ListAst) {
            List<ExprAst> items = ((ListAst) ast).items;
            for (int index = 0; index < items.size(); index++) {
                if (nested(items.get(index))) return true;
            }
            return false;
        }
        if (ast instanceof CallAst) {
            CallAst call = (CallAst) ast;
            for (int index = 0; index < call.positional.size(); index++) {
                if (nested(call.positional.get(index))) return true;
            }
            for (ExprAst value : call.named.values()) {
                if (nested(value)) return true;
            }
            return call.positional.isEmpty() && call.named.size() >= 4;
        }
        if (ast instanceof RecordAst) {
            for (ExprAst value : ((RecordAst) ast).fields.values()) {
                if (nested(value)) return true;
            }
        }
        return false;
    }

    private static boolean nested(ExprAst ast) {
        return ast instanceof CallAst || ast instanceof ListAst || heavy(ast);
    }
}
