package butter.compiler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import butter.annotations.ButterComponent;
import butter.core.Theme;
import butter.core.WidgetSpec;

/** Compiles `.butter` files into a fail-closed widget tree. */
public final class ButterCompiler {
    private ButterCompiler() {}

    public static WidgetSpec compile(Path file) { return compile(file, null); }

    public static WidgetSpec compile(Path file, Class<?> backing) {
        return compile(file, backing, themeBeside(file));
    }

    public static WidgetSpec compile(Path file, Class<?> backing, Theme theme) {
        if (file == null || !Files.isRegularFile(file)) {
            throw new ButterCompileException(new Diagnostic("B1001", "Missing .butter file",
                    file == null ? "" : file.getFileName().toString(), null, null, null, 0, 0));
        }
        try {
            String source = new String(Files.readAllBytes(file), StandardCharsets.UTF_8);
            return compileSource(file.getFileName().toString(), source, backing, theme);
        } catch (IOException error) {
            throw new ButterCompileException(new Diagnostic("B1001", error.getMessage(),
                    file.getFileName().toString(), null, null, null, 0, 0));
        }
    }

    public static Map<String, WidgetSpec> compileDirectory(Path directory, Class<?> backing) {
        Map<String, FileAst> files = parseAll(directory);
        Map<String, ComponentAst> components = new LinkedHashMap<String, ComponentAst>();
        for (FileAst file : files.values()) {
            for (int index = 0; index < file.components.size(); index++) {
                components.put(file.components.get(index).name, file.components.get(index));
            }
        }
        JavaContracts contracts = JavaContracts.inspect(backing);
        if (backing != null) checkPairing(files, contracts, backing);
        Map<String, WidgetSpec> trees = new LinkedHashMap<String, WidgetSpec>();
        Binder binder = new Binder(components, contracts, themeBeside(directory));
        for (Map.Entry<String, FileAst> entry : files.entrySet()) {
            WidgetSpec spec = binder.bindPublic(entry.getValue());
            IdScanner.unique(spec);
            trees.put(entry.getKey(), spec);
        }
        return trees;
    }

    public static WidgetSpec compileSource(String fileName, String source, Class<?> backing) {
        return compileSource(fileName, source, backing, Theme.standard());
    }

    public static WidgetSpec compileSource(String fileName, String source, Class<?> backing, Theme theme) {
        FileAst ast = new Parser(new Lexer(source).tokenize(), fileName).parse();
        Map<String, ComponentAst> components = new LinkedHashMap<String, ComponentAst>();
        JavaContracts contracts = JavaContracts.inspect(backing);
        WidgetSpec spec = new Binder(components, contracts, theme).bindPublic(ast);
        IdScanner.unique(spec);
        return spec;
    }

    private static void checkPairing(Map<String, FileAst> files, JavaContracts contracts, Class<?> backing) {
        ButterComponent annotation = backing.getAnnotation(ButterComponent.class);
        if (annotation == null) {
            throw new ButterCompileException(new Diagnostic("B1403", "Missing @ButterComponent",
                    backing.getSimpleName(), null, "@ButterComponent", "missing", 0, 0));
        }
        String template = contracts.template;
        if (template.isEmpty()) return;
        String name = publicName(java.nio.file.Paths.get(template));
        if (!files.containsKey(name) && !files.containsKey(backing.getSimpleName())) {
            throw new ButterCompileException(new Diagnostic("B1403", "Missing backing template",
                    backing.getSimpleName(), "template", name, "missing", 0, 0));
        }
    }

    private static Map<String, FileAst> parseAll(Path directory) {
        Map<String, FileAst> files = new LinkedHashMap<String, FileAst>();
        if (directory == null || !Files.isDirectory(directory)) return files;
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(directory, "*.butter")) {
            for (Path path : stream) {
                String source = new String(Files.readAllBytes(path), StandardCharsets.UTF_8);
                FileAst ast = new Parser(new Lexer(source).tokenize(), path.getFileName().toString()).parse();
                files.put(publicName(path), ast);
            }
        } catch (IOException error) {
            throw new ButterCompileException(new Diagnostic("B1001", error.getMessage(), null, null, null, null, 0, 0));
        }
        return files;
    }

    static Theme themeBeside(Path location) {
        if (location == null) return Theme.standard();
        Path directory = Files.isDirectory(location) ? location : location.getParent();
        if (directory == null) return Theme.standard();
        Path file = directory.resolve("theme.toml");
        if (!Files.isRegularFile(file)) return Theme.standard();
        return Theme.standard().extend(ThemeFile.load(file));
    }

    static String publicName(Path file) {
        String name = file.getFileName().toString();
        int dot = name.lastIndexOf('.');
        return dot < 0 ? name : name.substring(0, dot);
    }
}
