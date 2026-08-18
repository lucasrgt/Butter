package butter.compiler;

import java.util.List;

final class ListAst implements ExprAst {
    final List<ExprAst> items;

    ListAst(List<ExprAst> items) { this.items = items; }
}
