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

/** Two mapped processes: GameUi against a live ButterGuiScreen. */
public final class HostUiCycle {
    private final Path root = Paths.get("").toAbsolutePath().normalize();
    private final Path build = root.resolve(".butter/build");

    public static void main(String[] arguments) {
        if (arguments.length != 0) {
            System.err.println("usage: java tools/harness/HostUiCycle.java");
            System.exit(2);
        }
        try {
            new HostUiCycle().execute();
        } catch (Exception error) {
            System.err.println("host ui cycle failed: " + error.getMessage());
            System.exit(1);
        }
    }

    private void execute() throws Exception {
        Properties config = load("harness.properties");
        Path workspace = root.resolve(required(config, "runtime.workspace")).normalize();
        Path worldline = workspace.resolve("../../..").normalize();
        require(Files.isRegularFile(worldline.resolve(
                "adapters/b173-client/src/main/java/worldline/b173/B173Gui.java")),
                "sibling Worldline adapter missing under " + worldline);
        Path mapped = workspace.resolve("minecraft/bin");
        require(Files.isRegularFile(mapped.resolve("net/minecraft/client/Minecraft.class")),
                "mapped Minecraft.class missing under " + workspace);
        Path out = build.resolve("hostui");
        recreate(out);
        List<Path> none = Collections.emptyList();
        Properties worldlineConfig = new Properties();
        try (java.io.Reader reader = Files.newBufferedReader(worldline.resolve("harness.properties"), StandardCharsets.UTF_8)) {
            worldlineConfig.load(reader);
        }
        List<Path> worldlineModules = new ArrayList<Path>();
        for (String module : required(worldlineConfig, "modules").split(",")) {
            worldlineModules.add(compile(worldline.resolve("modules/" + module.trim() + "/src/main/java"),
                    out.resolve(module.trim()), worldlineModules, worldlineConfig.getProperty(
                            "module." + module.trim() + ".release", required(worldlineConfig, "java.release"))));
        }
        Path headless = compile(worldline.resolve("adapters/b173-client/headless-src"),
                out.resolve("headless"), none);
        List<Path> adapterPath = new ArrayList<Path>(Arrays.asList(headless, mapped));
        adapterPath.addAll(worldlineModules);
        adapterPath.addAll(jars(workspace.resolve("libraries")));
        Path adapter = compile(worldline.resolve("adapters/b173-client/src/main/java"),
                out.resolve("adapter"), adapterPath);
        List<Path> smokePath = new ArrayList<Path>();
        smokePath.add(headless);
        smokePath.add(build.resolve("adapter-classes"));
        for (String module : required(config, "modules").split(",")) {
            Path classes = build.resolve("classes").resolve(module.trim());
            if (Files.isDirectory(classes)) smokePath.add(classes);
        }
        smokePath.addAll(Arrays.asList(adapter, mapped));
        smokePath.addAll(worldlineModules);
        smokePath.addAll(jars(workspace.resolve("libraries")));
        Path classes = compile(root.resolve("smokes/hostui-live/src"), out.resolve("classes"), smokePath);
        List<Path> runtime = new ArrayList<Path>(smokePath);
        runtime.add(0, classes);
        Path official = workspace.resolve("jars/minecraft.jar");
        if (Files.isRegularFile(official)) runtime.add(official);
        String first = runSmoke(runtime);
        String second = runSmoke(runtime);
        require(first.equals(second), "fresh HostUi processes diverged");
        require(first.replace('\\', '/').contains("minecraft/bin"), "mapped client missing from classpath");
        String trace = line(first, "BUTTER_HOSTUI_TRACE=");
        Properties smoke = load("smokes/hostui-live/smoke.properties");
        require(required(smoke, "expected.trace").equals(trace), "HostUi trace diverged: " + trace);
        System.out.println("  host ui cycle: 2 mapped processes");
        System.out.println("  trace: " + trace);
    }

    private Path compile(Path source, Path output, List<Path> classpath) throws Exception {
        return compile(source, output, classpath, "8");
    }

    private Path compile(Path source, Path output, List<Path> classpath, String release) throws Exception {
        Files.createDirectories(output);
        List<String> command = new ArrayList<String>(Arrays.asList(
                "javac", "-encoding", "UTF-8", "--release", release,
                "-Xlint:all,-options", "-Werror", "-d", output.toString()));
        if (!classpath.isEmpty()) {
            command.add("-classpath");
            command.add(join(classpath));
        }
        List<Path> sources = javaFiles(source);
        require(!sources.isEmpty(), "no Java sources in " + source);
        for (Path path : sources) command.add(path.toString());
        Path args = output.resolve("javac.args");
        List<String> quoted = new ArrayList<String>();
        for (String item : command.subList(1, command.size())) {
            quoted.add("\"" + item.replace('\\', '/').replace("\"", "\\\"") + "\"");
        }
        Files.write(args, quoted, StandardCharsets.UTF_8);
        run(Arrays.asList("javac", "@" + args));
        return output;
    }

    private String runSmoke(List<Path> classpath) throws Exception {
        return capture(Arrays.asList("java", "-Djava.awt.headless=true", "-classpath",
                join(classpath), "butter.smoke.hostui.HostUiSmoke"));
    }

    private void recreate(Path output) throws IOException {
        if (Files.exists(output)) {
            require(output.startsWith(build), "unsafe hostui output");
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
        if (!Files.isDirectory(directory)) return Collections.emptyList();
        try (Stream<Path> paths = Files.walk(directory)) {
            return paths.filter(path -> path.toString().endsWith(".jar"))
                    .filter(path -> !path.toString().endsWith("-sources.jar"))
                    .sorted().collect(Collectors.toList());
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

    private String capture(List<String> command) throws Exception {
        Process process = new ProcessBuilder(command).directory(root.toFile()).redirectErrorStream(true).start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (process.waitFor() != 0) throw new IllegalStateException(command.get(0) + " failed\n" + output);
        return output;
    }

    private void run(List<String> command) throws Exception {
        String output = capture(command);
        if (!output.trim().isEmpty()) System.out.print(output);
    }

    private String line(String output, String prefix) {
        return output.lines().filter(value -> value.startsWith(prefix)).findFirst()
                .orElseThrow(() -> new IllegalStateException("missing " + prefix))
                .substring(prefix.length());
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
