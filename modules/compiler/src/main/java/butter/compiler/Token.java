package butter.compiler;

final class Token {
    final TokenKind kind;
    final String text;
    final int line;
    final int column;

    Token(TokenKind kind, String text, int line, int column) {
        this.kind = kind;
        this.text = text;
        this.line = line;
        this.column = column;
    }
}
