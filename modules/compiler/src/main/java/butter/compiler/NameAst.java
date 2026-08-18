package butter.compiler;

final class NameAst implements ExprAst {
    final String path;

    NameAst(String path) { this.path = path; }
}
