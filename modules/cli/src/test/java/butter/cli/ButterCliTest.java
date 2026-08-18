package butter.cli;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public final class ButterCliTest {
    private ButterCliTest() {}

    public static void main(String[] arguments) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ByteArrayOutputStream error = new ByteArrayOutputStream();
        int status = ButterCli.run(new String[] {"version"}, new PrintStream(output, true, "UTF-8"),
                new PrintStream(error, true, "UTF-8"));
        require(status == 0 && output.toString("UTF-8").contains("0.1.0"), "version");
        Path file = Files.createTempFile("butter-cli", ".butter");
        Files.write(file, "Button(\"Craft\", id: \"craft\")".getBytes(StandardCharsets.UTF_8));
        output.reset();
        status = ButterCli.run(new String[] {"compile", file.toString()}, new PrintStream(output, true, "UTF-8"),
                new PrintStream(error, true, "UTF-8"));
        require(status == 0 && output.toString("UTF-8").contains("BUTTER_COMPILE=PASS"), "compile");
        Files.write(file, "Button(\"Craft\",id:\"craft\")".getBytes(StandardCharsets.UTF_8));
        output.reset();
        status = ButterCli.run(new String[] {"format", "--stdout", file.toString()},
                new PrintStream(output, true, "UTF-8"), new PrintStream(error, true, "UTF-8"));
        require(status == 0 && output.toString("UTF-8").equals("Button(\"Craft\", id: \"craft\")\n"), "format");
        Files.deleteIfExists(file);
        System.out.println("  cli: version, compile, format");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
