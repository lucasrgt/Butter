import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Stream;

/** Fails closed when release metadata or the public artifact boundary drifts. */
public final class ReleaseCheck {
    private final Path root = Paths.get("").toAbsolutePath().normalize();

    public static void main(String[] arguments) {
        if (arguments.length != 0) {
            System.err.println("usage: java tools/harness/ReleaseCheck.java");
            System.exit(2);
        }
        try {
            new ReleaseCheck().execute();
        } catch (Exception error) {
            System.err.println("release check failed: " + error.getMessage());
            System.exit(1);
        }
    }

    private void execute() throws Exception {
        Properties release = load("release/butter.properties");
        Properties harness = load("harness.properties");
        match(release, "id", "butter");
        match(release, "version", "0.1.0");
        match(release, "milestone", "host-runtime");
        match(release, "status", "go");
        match(release, "canonical.command", "java tools/harness/Verify.java");
        same(release, "java.release", harness, "java.release");
        String version = value(release, "version");
        requireText("modules/core/src/main/java/butter/core/ButterVersion.java",
                "public static final String VERSION = \"" + version + "\";");
        for (String file : Arrays.asList("README.md", "CHANGELOG.md", "AGENTS.md",
                "docs/VISION.md", "docs/ARCHITECTURE.md", "docs/ROADMAP.md", "docs/SYNTAX.md",
                "docs/SEMANTICS.md", "docs/WORLDLINE.md", "docs/THEME.md", "docs/LIBRARY.md",
                "themes/vanilla.toml", "themes/thaum.toml", "smokes/hostui-live/MAP.md",
                "editors/README.md", "editors/vscode/package.json",
                "editors/vscode/syntaxes/butter.tmLanguage.json", ".vscode/settings.json")) {
            if (!Files.isRegularFile(root.resolve(file))) throw new IllegalStateException("missing " + file);
        }
        sameFile("editors/Butter.tmbundle/Syntaxes/Butter.tmLanguage.json",
                "editors/vscode/syntaxes/butter.tmLanguage.json");
        verifyPublicTree();
        System.out.println("  release: Butter v" + version + " host runtime GO");
    }

    private void verifyPublicTree() throws IOException {
        Set<String> excluded = new HashSet<String>(Arrays.asList(".git", ".butter", "local"));
        try (Stream<Path> paths = Files.walk(root)) {
            paths.filter(Files::isRegularFile).forEach(path -> {
                Path relative = root.relativize(path);
                if (relative.getNameCount() > 0 && excluded.contains(relative.getName(0).toString())) return;
                String name = path.getFileName().toString().toLowerCase();
                String normalized = relative.toString().replace('\\', '/').toLowerCase();
                if (normalized.startsWith("tests/worldline/.gradle/")
                        || normalized.startsWith("tests/worldline/build/")
                        || normalized.equals("tests/worldline/gradle/wrapper/gradle-wrapper.jar")) return;
                if (name.endsWith(".jar") || name.endsWith(".class")
                        || normalized.contains("minecraft/src/net/")
                        || normalized.contains("minecraft/bin/")) {
                    throw new IllegalStateException("prohibited public artifact: " + relative);
                }
            });
        }
    }

    private Properties load(String relative) throws IOException {
        Properties result = new Properties();
        try (java.io.Reader reader = Files.newBufferedReader(root.resolve(relative), StandardCharsets.UTF_8)) {
            result.load(reader);
        }
        return result;
    }

    private void same(Properties left, String leftKey, Properties right, String rightKey) {
        match(left, leftKey, value(right, rightKey));
    }

    private void match(Properties source, String key, String expected) {
        String actual = value(source, key);
        if (!actual.equals(expected)) {
            throw new IllegalStateException(key + " is " + actual + "; expected " + expected);
        }
    }

    private String value(Properties source, String key) {
        String result = source.getProperty(key);
        if (result == null || result.trim().isEmpty()) throw new IllegalStateException("missing " + key);
        return result.trim();
    }

    private void sameFile(String left, String right) throws IOException {
        String first = new String(Files.readAllBytes(root.resolve(left)), StandardCharsets.UTF_8)
                .replace("\r\n", "\n");
        String second = new String(Files.readAllBytes(root.resolve(right)), StandardCharsets.UTF_8)
                .replace("\r\n", "\n");
        if (!first.equals(second)) throw new IllegalStateException(left + " must match " + right);
    }

    private void requireText(String relative, String expected) throws IOException {
        String text = new String(Files.readAllBytes(root.resolve(relative)), StandardCharsets.UTF_8);
        if (!text.contains(expected)) throw new IllegalStateException(relative + " does not declare release version");
    }
}
