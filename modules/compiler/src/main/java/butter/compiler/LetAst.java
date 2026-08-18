package butter.compiler;

final class LetAst {
    final String name;
    final ExprAst value;

    LetAst(String name, ExprAst value) {
        this.name = name;
        this.value = value;
    }
}
