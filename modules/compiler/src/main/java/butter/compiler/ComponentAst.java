package butter.compiler;

import java.util.List;

final class ComponentAst {
    final boolean priv;
    final String name;
    final List<ParamAst> params;
    final ExprAst body;

    ComponentAst(boolean priv, String name, List<ParamAst> params, ExprAst body) {
        this.priv = priv;
        this.name = name;
        this.params = params;
        this.body = body;
    }

    boolean hasParam(String name) {
        for (int index = 0; index < params.size(); index++) {
            if (params.get(index).name.equals(name)) return true;
        }
        return false;
    }
}
