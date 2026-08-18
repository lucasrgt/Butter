package butter.compiler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/** Parses a `.butter` file and reprints it in the canonical layout. */
public final class ButterFormatter {
    private ButterFormatter() {}

    public static String format(String fileName, String source) {
        FileAst ast = new Parser(new Lexer(source).tokenize(), fileName == null ? "" : fileName).parse();
        return new ButterPrinter().print(ast);
    }

    public static String format(Path file) {
        if (file == null || !Files.isRegularFile(file)) {
            throw new ButterCompileException(new Diagnostic("B1001", "Missing .butter file",
                    file == null ? "" : file.getFileName().toString(), null, null, null, 0, 0));
        }
        try {
            String source = new String(Files.readAllBytes(file), StandardCharsets.UTF_8);
            return format(file.getFileName().toString(), source);
        } catch (IOException error) {
            throw new ButterCompileException(new Diagnostic("B1001", error.getMessage(),
                    file.getFileName().toString(), null, null, null, 0, 0));
        }
    }
}
