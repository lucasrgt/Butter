import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Properties;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Zero-dependency repository gate. Run with: java tools/harness/Verify.java */
public final class Verify {
    private final Path root = Paths.get("").toAbsolutePath().normalize();
    private final Path build = root.resolve(".butter/build");
    private final Properties config = new Properties();

    private final boolean runtime;

    private Verify(boolean runtime) { this.runtime = runtime; }

    public static void main(String[] arguments) {
        boolean runtime = Arrays.equals(arguments, new String[] {"--runtime"});
        if (arguments.length > 0 && !runtime) {
            System.err.println("usage: java tools/harness/Verify.java [--runtime]");
            System.exit(2);
        }
        try {
            new Verify(runtime).execute();
        } catch (Exception error) {
            System.err.println("verify failed: " + error.getMessage());
            System.exit(1);
        }
    }

    private void execute() throws Exception {
        System.out.println("Butter repository verification");
        try (java.io.Reader reader = Files.newBufferedReader(root.resolve("harness.properties"),
                StandardCharsets.UTF_8)) {
            config.load(reader);
        }
        run(Arrays.asList("java", "tools/harness/ReleaseCheck.java"));
        List<String> modules = values("modules");
        validateModuleOrder(modules);
        enforce("product", productionRoots(modules), integer("product.max.file"));
        enforce("harness", Collections.singletonList(root.resolve("tools")), integer("harness.max.file"));
        enforce("smoke", Collections.singletonList(root.resolve("smokes")), integer("smoke.max.file"));
        enforce("adapter", Collections.singletonList(root.resolve("adapters")), integer("adapter.max.file"));
        recreateBuild();
        List<Path> outputs = compileModules(modules);
        Path tests = compileTests(modules, outputs);
        runTests(outputs, tests);
        if (runtime) {
            run(Arrays.asList("java", "tools/harness/AdapterCheck.java"));
            run(Arrays.asList("java", "tools/harness/HostUiCycle.java"));
        }
        System.out.println("verify passed");
    }

    private void validateModuleOrder(List<String> modules) {
        if (modules.isEmpty()) throw new IllegalStateException("at least one module is required");
        List<String> seen = new ArrayList<String>();
        for (String module : modules) {
            Path main = moduleRoot(module).resolve("src/main/java");
            if (!Files.isDirectory(main)) {
                throw new IllegalStateException("missing production source root: " + relative(main));
            }
            for (String dependency : values("module." + module + ".dependencies")) {
                if (!seen.contains(dependency)) {
                    throw new IllegalStateException(
                            "module " + module + " depends on undeclared, unknown, or later module " + dependency);
                }
            }
            seen.add(module);
        }
        System.out.println("  module order: " + String.join(" -> ", modules));
    }

    private List<Path> productionRoots(List<String> modules) {
        List<Path> roots = new ArrayList<Path>();
        for (String module : modules) roots.add(moduleRoot(module).resolve("src/main/java"));
        return roots;
    }

    private void enforce(String name, List<Path> roots, int maxFile) throws IOException {
        int files = 0;
        long lines = 0;
        for (Path directory : roots) {
            if (!Files.isDirectory(directory)) continue;
            for (Path path : javaFiles(directory)) {
                int count = codeLines(path);
                files++;
                lines += count;
                if (count > maxFile) {
                    throw new IllegalStateException(
                            name + " file ceiling exceeded: " + relative(path) + " has " + count + "/" + maxFile);
                }
            }
        }
        System.out.println("  " + name + " sources: " + files + " files, " + lines
                + " code lines, max file " + maxFile);
    }

    private int codeLines(Path path) throws IOException {
        boolean block = false;
        int count = 0;
        for (String line : Files.readAllLines(path, StandardCharsets.UTF_8)) {
            boolean code = false;
            boolean string = false;
            boolean character = false;
            boolean escaped = false;
            for (int index = 0; index < line.length(); index++) {
                char current = line.charAt(index);
                char next = index + 1 < line.length() ? line.charAt(index + 1) : '\0';
                if (block) {
                    if (current == '*' && next == '/') { block = false; index++; }
                    continue;
                }
                if (!string && !character && current == '/' && next == '/') break;
                if (!string && !character && current == '/' && next == '*') { block = true; index++; continue; }
                if (!Character.isWhitespace(current)) code = true;
                if (escaped) { escaped = false; continue; }
                if ((string || character) && current == '\\') { escaped = true; continue; }
                if (!character && current == '"') string = !string;
                else if (!string && current == '\'') character = !character;
            }
            if (code) count++;
        }
        return count;
    }

    private void recreateBuild() throws IOException {
        if (Files.exists(build)) {
            if (!build.startsWith(root) || build.equals(root)) {
                throw new IllegalStateException("refusing to delete unsafe build path: " + build);
            }
            try (Stream<Path> paths = Files.walk(build)) {
                for (Path path : paths.sorted(Comparator.reverseOrder()).collect(Collectors.toList())) {
                    Files.delete(path);
                }
            }
        }
        Files.createDirectories(build);
    }

    private List<Path> compileModules(List<String> modules) throws Exception {
        List<Path> outputs = new ArrayList<Path>();
        for (String module : modules) {
            Path output = build.resolve("classes").resolve(module);
            Files.createDirectories(output);
            List<Path> classpath = new ArrayList<Path>();
            for (String dependency : values("module." + module + ".dependencies")) {
                classpath.add(build.resolve("classes").resolve(dependency));
            }
            compile(javaFiles(moduleRoot(module).resolve("src/main/java")), output, classpath);
            outputs.add(output);
            System.out.println("  compiled module " + module);
        }
        return outputs;
    }

    private Path compileTests(List<String> modules, List<Path> outputs) throws Exception {
        List<Path> tests = new ArrayList<Path>();
        for (String module : modules) {
            Path directory = moduleRoot(module).resolve("src/test/java");
            if (Files.isDirectory(directory)) tests.addAll(javaFiles(directory));
        }
        if (tests.isEmpty()) throw new IllegalStateException("no tests found");
        Path output = build.resolve("test-classes");
        Files.createDirectories(output);
        compile(tests, output, outputs);
        System.out.println("  compiled tests");
        return output;
    }

    private void compile(List<Path> sources, Path output, List<Path> classpath) throws Exception {
        if (sources.isEmpty()) throw new IllegalStateException("no Java sources for " + relative(output));
        List<String> command = new ArrayList<String>(Arrays.asList(
                "javac", "-encoding", "UTF-8", "--release", required("java.release"),
                "-Xlint:all,-options", "-Werror", "-d", output.toString()));
        if (!classpath.isEmpty()) {
            command.add("-classpath");
            command.add(join(classpath));
        }
        for (Path path : sources) command.add(path.toString());
        run(command);
    }

    private void runTests(List<Path> outputs, Path tests) throws Exception {
        List<Path> classpath = new ArrayList<Path>(outputs);
        classpath.add(tests);
        String joined = join(classpath);
        for (String suite : values("test.suites")) {
            run(Arrays.asList("java", "-ea", "-classpath", joined, suite));
        }
    }

    private List<Path> javaFiles(Path directory) throws IOException {
        try (Stream<Path> paths = Files.walk(directory)) {
            return paths.filter(path -> path.toString().endsWith(".java")).sorted().collect(Collectors.toList());
        }
    }

    private List<String> values(String key) {
        String raw = required(key).trim();
        if (raw.isEmpty()) return Collections.emptyList();
        return Arrays.stream(raw.split(",")).map(String::trim).filter(value -> !value.isEmpty())
                .collect(Collectors.toList());
    }

    private String required(String key) {
        String value = config.getProperty(key);
        if (value == null) throw new IllegalStateException("missing harness property: " + key);
        return value;
    }

    private int integer(String key) { return Integer.parseInt(required(key).trim()); }

    private Path moduleRoot(String module) { return root.resolve("modules").resolve(module); }

    private String join(List<Path> paths) {
        return paths.stream().map(Path::toString).collect(Collectors.joining(System.getProperty("path.separator")));
    }

    private void run(List<String> command) throws Exception {
        Process process;
        try {
            process = new ProcessBuilder(command).directory(root.toFile()).redirectErrorStream(true).start();
        } catch (IOException error) {
            throw new IllegalStateException("could not start " + command.get(0) + ": " + error.getMessage(), error);
        }
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (process.waitFor() != 0) {
            throw new IllegalStateException(command.get(0) + " exited " + process.exitValue() + "\n" + output);
        }
        if (!output.trim().isEmpty()) System.out.print(output);
    }

    private String relative(Path path) {
        return root.relativize(path.toAbsolutePath().normalize()).toString().replace('\\', '/');
    }
}
