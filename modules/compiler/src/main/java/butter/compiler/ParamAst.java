package butter.compiler;

final class ParamAst {
    final String name;
    final String type;
    final ExprAst defaultValue;

    ParamAst(String name, String type, ExprAst defaultValue) {
        this.name = name;
        this.type = type;
        this.defaultValue = defaultValue;
    }
}
