package butter.compiler;

import java.util.List;

final class FileAst {
    final List<LetAst> lets;
    final List<ComponentAst> components;
    final ExprAst body;
    final String fileName;

    FileAst(List<LetAst> lets, List<ComponentAst> components, ExprAst body, String fileName) {
        this.lets = lets;
        this.components = components;
        this.body = body;
        this.fileName = fileName;
    }
}
