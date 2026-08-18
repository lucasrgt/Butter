package butter.compiler;

import java.util.List;
import java.util.Map;

final class CallAst implements ExprAst {
    final String name;
    final List<ExprAst> positional;
    final Map<String, ExprAst> named;

    CallAst(String name, List<ExprAst> positional, Map<String, ExprAst> named) {
        this.name = name;
        this.positional = positional;
        this.named = named;
    }
}
