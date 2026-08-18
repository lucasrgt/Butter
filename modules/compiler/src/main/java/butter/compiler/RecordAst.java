package butter.compiler;

import java.util.Map;

final class RecordAst implements ExprAst {
    final Map<String, ExprAst> fields;

    RecordAst(Map<String, ExprAst> fields) { this.fields = fields; }
}
