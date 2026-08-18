package butter.compiler;

final class LiteralAst implements ExprAst {
    final Object value;

    LiteralAst(Object value) { this.value = value; }
}
