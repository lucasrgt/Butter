import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

/** Compiles and runs Butter's external Worldline TestKit consumer specs. */
public final class Run {
    private Run() {}
    public static void main(String[] arguments) throws Exception {
        if (arguments.length != 0) throw new IllegalArgumentException("usage: java tools/testkit/Run.java");
        Path root = Paths.get("").toAbsolutePath().normalize();
        Path home = requiredHome(); Path api = home.resolve("worldline-test-api-0.1.0.jar");
        Path runner = home.resolve("worldline-test-runner-0.1.0.jar");
        require(Files.isRegularFile(api) && Files.isRegularFile(runner), "TestKit 0.1.0 distribution is incomplete");
        run(root, java(), "tools/harness/Verify.java");
        List<Path> product = directories(root.resolve(".butter/build/classes"));
        require(!product.isEmpty(), "Butter Verify produced no module classes");
        Path output = root.resolve(".butter/worldline-test/classes"); Files.createDirectories(output);
        List<Path> sources = sources(root.resolve("worldline-tests/src/test/java"));
        List<String> compile = new ArrayList<>(); compile.add(javac()); compile.add("--release"); compile.add("8");
        compile.add("-Xlint:all,-options"); compile.add("-Werror"); compile.add("-classpath");
        compile.add(join(api, product)); compile.add("-d"); compile.add(output.toString());
        for (Path source : sources) compile.add(source.toString()); run(root, compile);
        List<String> test = new ArrayList<>(); test.add(java()); test.add("-jar"); test.add(runner.toString());
        test.add("test"); test.add("run"); test.add(output.toString());
        test.add("--classpath=" + join(null, product)); test.add("--no-runtime");
        test.add("--reporter=default,agent");
        test.add("--artifacts=" + root.resolve(".butter/worldline-test/results")); run(root, test);
    }
    private static Path requiredHome() {
        String value = System.getenv("WORLDLINE_TESTKIT_HOME");
        require(value != null && !value.trim().isEmpty(), "WORLDLINE_TESTKIT_HOME is required");
        return Paths.get(value).toAbsolutePath().normalize();
    }
    private static List<Path> directories(Path root) throws Exception {
        List<Path> values = new ArrayList<>();
        try (Stream<Path> stream = Files.list(root)) {
            stream.filter(Files::isDirectory).sorted().forEach(values::add);
        }
        return values;
    }
    private static List<Path> sources(Path root) throws Exception {
        List<Path> values = new ArrayList<>();
        try (Stream<Path> stream = Files.walk(root)) {
            stream.filter(path -> Files.isRegularFile(path) && path.toString().endsWith(".java"))
                    .sorted(Comparator.naturalOrder()).limit(1001).forEach(values::add);
        }
        require(!values.isEmpty() && values.size() <= 1000, "invalid spec source count"); return values;
    }
    private static String join(Path first, List<Path> rest) {
        List<String> values = new ArrayList<>(); if (first != null) values.add(first.toString());
        for (Path path : rest) values.add(path.toString()); return String.join(File.pathSeparator, values);
    }
    private static String java() { return executable("java"); }
    private static String javac() { return executable("javac"); }
    private static String executable(String name) {
        Path path = Paths.get(System.getProperty("java.home"), "bin", name + (File.separatorChar == '\\' ? ".exe" : ""));
        require(Files.isRegularFile(path), "missing JDK executable " + path); return path.toString();
    }
    private static void run(Path root, String... command) throws Exception {
        run(root, java.util.Arrays.asList(command));
    }
    private static void run(Path root, List<String> command) throws Exception {
        Process process = new ProcessBuilder(command).directory(root.toFile()).inheritIO().start();
        int status = process.waitFor(); if (status != 0) throw new IllegalStateException("command failed: " + command.get(0));
    }
    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
