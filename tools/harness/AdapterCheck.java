import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Properties;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Compiles the Minecraft adapter against a mapped b1.7.3 client. */
public final class AdapterCheck {
    private final Path root = Paths.get("").toAbsolutePath().normalize();
    private final Path build = root.resolve(".butter/build");

    public static void main(String[] arguments) {
        if (arguments.length != 0) {
            System.err.println("usage: java tools/harness/AdapterCheck.java");
            System.exit(2);
        }
        try {
            new AdapterCheck().execute();
        } catch (Exception error) {
            System.err.println("adapter check failed: " + error.getMessage());
            System.exit(1);
        }
    }

    private void execute() throws Exception {
        Properties config = load("harness.properties");
        Path workspace = root.resolve(required(config, "runtime.workspace")).normalize();
        Path mapped = workspace.resolve("minecraft/bin");
        require(Files.isRegularFile(mapped.resolve("net/minecraft/src/GuiScreen.class")),
                "mapped GuiScreen.class missing under " + workspace);
        Path output = build.resolve("adapter-classes");
        recreate(output);
        List<Path> classpath = new ArrayList<Path>();
        classpath.add(mapped);
        for (String module : required(config, "modules").split(",")) {
            Path classes = build.resolve("classes").resolve(module.trim());
            if (Files.isDirectory(classes)) classpath.add(classes);
        }
        classpath.addAll(jars(workspace.resolve("libraries")));
        List<Path> sources = javaFiles(root.resolve("adapters/minecraft/src/main/java"));
        require(!sources.isEmpty(), "no Minecraft adapter sources");
        List<String> command = new ArrayList<String>(Arrays.asList(
                "javac", "-encoding", "UTF-8", "--release", required(config, "java.release"),
                "-Xlint:all,-options", "-Werror", "-classpath", join(classpath), "-d", output.toString()));
        for (Path path : sources) command.add(path.toString());
        run(command);
        System.out.println("  minecraft adapter: compiled against mapped GuiScreen");
    }

    private void recreate(Path output) throws IOException {
        if (Files.exists(output)) {
            require(output.startsWith(build), "unsafe adapter output");
            try (Stream<Path> paths = Files.walk(output)) {
                for (Path path : paths.sorted(Comparator.reverseOrder()).collect(Collectors.toList())) {
                    Files.delete(path);
                }
            }
        }
        Files.createDirectories(output);
    }

    private List<Path> javaFiles(Path directory) throws IOException {
        try (Stream<Path> paths = Files.walk(directory)) {
            return paths.filter(path -> path.toString().endsWith(".java")).sorted().collect(Collectors.toList());
        }
    }

    private List<Path> jars(Path directory) throws IOException {
        if (!Files.isDirectory(directory)) return java.util.Collections.emptyList();
        try (Stream<Path> paths = Files.walk(directory)) {
            return paths.filter(path -> path.toString().endsWith(".jar")).sorted().collect(Collectors.toList());
        }
    }

    private Properties load(String relative) throws IOException {
        Properties properties = new Properties();
        try (java.io.Reader reader = Files.newBufferedReader(root.resolve(relative), StandardCharsets.UTF_8)) {
            properties.load(reader);
        }
        return properties;
    }

    private String required(Properties properties, String key) {
        String value = properties.getProperty(key);
        if (value == null || value.trim().isEmpty()) throw new IllegalStateException("missing " + key);
        return value.trim();
    }

    private String join(List<Path> paths) {
        return paths.stream().map(Path::toString).collect(Collectors.joining(System.getProperty("path.separator")));
    }

    private void run(List<String> command) throws Exception {
        Process process = new ProcessBuilder(command).directory(root.toFile()).redirectErrorStream(true).start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (process.waitFor() != 0) throw new IllegalStateException("javac failed\n" + output);
        if (!output.trim().isEmpty()) System.out.print(output);
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
