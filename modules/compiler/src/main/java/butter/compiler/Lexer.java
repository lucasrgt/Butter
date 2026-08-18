package butter.compiler;

import java.util.ArrayList;
import java.util.List;

final class Lexer {
    private final String source;
    private int index;
    private int line = 1;
    private int column = 1;

    Lexer(String source) { this.source = source == null ? "" : source; }

    List<Token> tokenize() {
        List<Token> tokens = new ArrayList<Token>();
        while (true) {
            skipTrivia();
            if (index >= source.length()) {
                tokens.add(new Token(TokenKind.EOF, "", line, column));
                return tokens;
            }
            tokens.add(next());
        }
    }

    private Token next() {
        char current = source.charAt(index);
        int startLine = line;
        int startColumn = column;
        if (current == '"') return string(startLine, startColumn);
        if (digit(current) || (current == '-' && peekDigit())) return number(startLine, startColumn);
        if (identStart(current)) return ident(startLine, startColumn);
        index++;
        column++;
        TokenKind kind = punctuation(current);
        if (kind == null) throw parse("B1001", "Unexpected character '" + current + "'", startLine, startColumn);
        return new Token(kind, String.valueOf(current), startLine, startColumn);
    }

    private Token string(int startLine, int startColumn) {
        index++;
        column++;
        StringBuilder text = new StringBuilder();
        while (index < source.length()) {
            char current = source.charAt(index);
            if (current == '"') { index++; column++; return new Token(TokenKind.STRING, text.toString(), startLine, startColumn); }
            if (current == '\\' && index + 1 < source.length()) {
                index++;
                column++;
                char escaped = source.charAt(index);
                text.append(escaped == 'n' ? '\n' : escaped);
            } else {
                if (current == '\n') throw parse("B1001", "Unterminated string", startLine, startColumn);
                text.append(current);
            }
            index++;
            column++;
        }
        throw parse("B1001", "Unterminated string", startLine, startColumn);
    }

    private Token number(int startLine, int startColumn) {
        int start = index;
        if (source.charAt(index) == '-') { index++; column++; }
        while (index < source.length() && digit(source.charAt(index))) { index++; column++; }
        if (index < source.length() && source.charAt(index) == '.') {
            index++;
            column++;
            while (index < source.length() && digit(source.charAt(index))) { index++; column++; }
        }
        return new Token(TokenKind.NUMBER, source.substring(start, index), startLine, startColumn);
    }

    private Token ident(int startLine, int startColumn) {
        int start = index;
        while (index < source.length() && identPart(source.charAt(index))) { index++; column++; }
        String text = source.substring(start, index);
        return new Token(keyword(text), text, startLine, startColumn);
    }

    private void skipTrivia() {
        while (index < source.length()) {
            char current = source.charAt(index);
            if (current == ' ' || current == '\t' || current == '\r') { index++; column++; continue; }
            if (current == '\n') { index++; line++; column = 1; continue; }
            if (current == '/' && index + 1 < source.length() && source.charAt(index + 1) == '/') {
                while (index < source.length() && source.charAt(index) != '\n') { index++; column++; }
                continue;
            }
            if (current == '/' && index + 1 < source.length() && source.charAt(index + 1) == '*') {
                index += 2;
                column += 2;
                while (index + 1 < source.length() && !(source.charAt(index) == '*' && source.charAt(index + 1) == '/')) {
                    if (source.charAt(index) == '\n') { line++; column = 1; } else column++;
                    index++;
                }
                if (index + 1 >= source.length()) throw parse("B1001", "Unterminated comment", line, column);
                index += 2;
                column += 2;
                continue;
            }
            return;
        }
    }

    private TokenKind keyword(String text) {
        if ("component".equals(text)) return TokenKind.COMPONENT;
        if ("private".equals(text)) return TokenKind.PRIVATE;
        if ("let".equals(text)) return TokenKind.LET;
        if ("true".equals(text)) return TokenKind.TRUE;
        if ("false".equals(text)) return TokenKind.FALSE;
        if ("null".equals(text)) return TokenKind.NULL;
        return TokenKind.IDENT;
    }

    private TokenKind punctuation(char current) {
        if (current == '(') return TokenKind.LPAREN;
        if (current == ')') return TokenKind.RPAREN;
        if (current == '[') return TokenKind.LBRACK;
        if (current == ']') return TokenKind.RBRACK;
        if (current == '{') return TokenKind.LBRACE;
        if (current == '}') return TokenKind.RBRACE;
        if (current == ':') return TokenKind.COLON;
        if (current == ',') return TokenKind.COMMA;
        if (current == '.') return TokenKind.DOT;
        if (current == '=') return TokenKind.EQUAL;
        if (current == '<') return TokenKind.LT;
        if (current == '>') return TokenKind.GT;
        if (current == '?') return TokenKind.QMARK;
        return null;
    }

    private boolean peekDigit() { return index + 1 < source.length() && digit(source.charAt(index + 1)); }
    private static boolean digit(char current) { return current >= '0' && current <= '9'; }
    private static boolean identStart(char current) {
        return current == '_' || (current >= 'A' && current <= 'Z') || (current >= 'a' && current <= 'z');
    }
    private static boolean identPart(char current) { return identStart(current) || digit(current); }

    private static ButterCompileException parse(String code, String message, int line, int column) {
        return new ButterCompileException(new Diagnostic(code, message, null, null, null, null, line, column));
    }
}
