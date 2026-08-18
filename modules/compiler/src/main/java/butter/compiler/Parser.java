package butter.compiler;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class Parser {
    private final List<Token> tokens;
    private final String fileName;
    private int index;

    Parser(List<Token> tokens, String fileName) {
        this.tokens = tokens;
        this.fileName = fileName;
    }

    FileAst parse() {
        List<LetAst> lets = new ArrayList<LetAst>();
        List<ComponentAst> components = new ArrayList<ComponentAst>();
        ExprAst body = null;
        while (!at(TokenKind.EOF)) {
            if (at(TokenKind.LET)) lets.add(parseLet());
            else if (at(TokenKind.PUBLIC) || at(TokenKind.PRIVATE) || at(TokenKind.COMPONENT)) {
                components.add(parseComponent());
            }
            else if (body == null) body = parseExpr();
            else throw error("B1101", "Multiple public components in one .butter file");
        }
        return new FileAst(lets, components, body, fileName);
    }

    private LetAst parseLet() {
        consume(TokenKind.LET);
        String name = consume(TokenKind.IDENT).text;
        consume(TokenKind.EQUAL);
        return new LetAst(name, parseExpr());
    }

    private ComponentAst parseComponent() {
        boolean priv = match(TokenKind.PRIVATE);
        if (!priv && !match(TokenKind.PUBLIC)) {
            throw error("B1103", "A component must be public or private");
        }
        consume(TokenKind.COMPONENT);
        String name = consume(TokenKind.IDENT).text;
        consume(TokenKind.LPAREN);
        List<ParamAst> params = parseParams();
        consume(TokenKind.RPAREN);
        consume(TokenKind.LBRACE);
        ExprAst body = parseExpr();
        consume(TokenKind.RBRACE);
        return new ComponentAst(priv, name, params, body);
    }

    private List<ParamAst> parseParams() {
        if (at(TokenKind.RPAREN)) return Collections.emptyList();
        List<ParamAst> params = new ArrayList<ParamAst>();
        do {
            if (at(TokenKind.RPAREN)) break;
            String name = consume(TokenKind.IDENT).text;
            consume(TokenKind.COLON);
            String type = parseType();
            ExprAst defaultValue = match(TokenKind.EQUAL) ? parseExpr() : null;
            params.add(new ParamAst(name, type, defaultValue));
        } while (match(TokenKind.COMMA));
        return params;
    }

    private String parseType() {
        StringBuilder type = new StringBuilder(consume(TokenKind.IDENT).text);
        if (match(TokenKind.LT)) {
            type.append('<').append(parseType()).append('>');
            consume(TokenKind.GT);
        }
        if (match(TokenKind.QMARK)) type.append('?');
        return type.toString();
    }

    private ExprAst parseExpr() {
        if (at(TokenKind.STRING)) return new LiteralAst(consume(TokenKind.STRING).text);
        if (at(TokenKind.TRUE)) { consume(TokenKind.TRUE); return new LiteralAst(Boolean.TRUE); }
        if (at(TokenKind.FALSE)) { consume(TokenKind.FALSE); return new LiteralAst(Boolean.FALSE); }
        if (at(TokenKind.NULL)) { consume(TokenKind.NULL); return new LiteralAst(null); }
        if (at(TokenKind.NUMBER)) return new LiteralAst(number(consume(TokenKind.NUMBER).text));
        if (at(TokenKind.LBRACK)) return parseList();
        if (at(TokenKind.LPAREN)) return parseRecord();
        if (at(TokenKind.IDENT)) {
            String path = parsePath();
            if (at(TokenKind.LPAREN)) return parseCall(path);
            return new NameAst(path);
        }
        throw error("B1001", "Expected expression");
    }

    private String parsePath() {
        StringBuilder path = new StringBuilder(consume(TokenKind.IDENT).text);
        while (match(TokenKind.DOT)) path.append('.').append(consume(TokenKind.IDENT).text);
        return path.toString();
    }

    private CallAst parseCall(String name) {
        consume(TokenKind.LPAREN);
        List<ExprAst> positional = new ArrayList<ExprAst>();
        Map<String, ExprAst> named = new LinkedHashMap<String, ExprAst>();
        while (!at(TokenKind.RPAREN) && !at(TokenKind.EOF)) {
            if (at(TokenKind.IDENT) && peek(TokenKind.COLON)) {
                String key = consume(TokenKind.IDENT).text;
                consume(TokenKind.COLON);
                named.put(key, parseExpr());
            } else {
                positional.add(parseExpr());
            }
            if (!match(TokenKind.COMMA)) break;
        }
        consume(TokenKind.RPAREN);
        return new CallAst(name, positional, named);
    }

    private ListAst parseList() {
        consume(TokenKind.LBRACK);
        List<ExprAst> items = new ArrayList<ExprAst>();
        while (!at(TokenKind.RBRACK) && !at(TokenKind.EOF)) {
            items.add(parseExpr());
            if (!match(TokenKind.COMMA)) break;
        }
        consume(TokenKind.RBRACK);
        return new ListAst(items);
    }

    private RecordAst parseRecord() {
        consume(TokenKind.LPAREN);
        Map<String, ExprAst> fields = new LinkedHashMap<String, ExprAst>();
        while (!at(TokenKind.RPAREN) && !at(TokenKind.EOF)) {
            String key = consume(TokenKind.IDENT).text;
            consume(TokenKind.COLON);
            fields.put(key, parseExpr());
            if (!match(TokenKind.COMMA)) break;
        }
        consume(TokenKind.RPAREN);
        return new RecordAst(fields);
    }

    private boolean at(TokenKind kind) { return tokens.get(index).kind == kind; }
    private boolean peek(TokenKind kind) { return tokens.get(index + 1).kind == kind; }
    private boolean match(TokenKind kind) {
        if (!at(kind)) return false;
        index++;
        return true;
    }

    private Token consume(TokenKind kind) {
        if (!at(kind)) throw error("B1001", "Expected " + kind + " but found " + tokens.get(index).kind);
        return tokens.get(index++);
    }

    private ButterCompileException error(String code, String message) {
        Token token = tokens.get(index);
        return new ButterCompileException(new Diagnostic(code, message, fileName, null, null, token.text,
                token.line, token.column));
    }

    private static Object number(String text) {
        if (text.indexOf('.') >= 0) return Double.valueOf(text);
        return Integer.valueOf(text);
    }
}
