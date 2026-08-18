package butter.cli;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import butter.compiler.ButterCompileException;
import butter.compiler.ButterCompiler;
import butter.compiler.ButterFormatter;
import butter.core.ButterVersion;
import butter.core.WidgetSpec;

/** Compile, check, and format `.butter` files without Minecraft. */
public final class ButterCli {
    private ButterCli() {}

    public static void main(String[] arguments) {
        int status = run(arguments, System.out, System.err);
        if (status != 0) System.exit(status);
    }

    public static int run(String[] arguments, PrintStream output, PrintStream error) {
        return run(arguments, output, error, System.in);
    }

    public static int run(String[] arguments, PrintStream output, PrintStream error, InputStream input) {
        if (arguments == null || arguments.length == 0) return usage(error);
        try {
            if (arguments.length == 1 && "version".equals(arguments[0])) {
                output.println("butter " + ButterVersion.VERSION);
                return 0;
            }
            if (arguments.length == 2 && "compile".equals(arguments[0])) return compile(arguments[1], output);
            if (arguments.length == 2 && "check".equals(arguments[0])) return check(arguments[1], output);
            if ("format".equals(arguments[0])) return format(arguments, output, error, input);
            return usage(error);
        } catch (ButterCompileException failure) {
            error.println(failure.getMessage());
            return 1;
        } catch (RuntimeException failure) {
            error.println("butter command failed: " + failure.getMessage());
            return 1;
        }
    }

    private static int compile(String path, PrintStream output) {
        WidgetSpec spec = ButterCompiler.compile(Paths.get(path));
        output.println("BUTTER_COMPILE=PASS");
        output.println("root=" + spec.type());
        output.println("children=" + spec.children().size());
        return 0;
    }

    private static int check(String path, PrintStream output) {
        Path directory = Paths.get(path);
        if (!Files.isDirectory(directory)) return compile(path, output);
        int count = ButterCompiler.compileDirectory(directory, null).size();
        output.println("BUTTER_CHECK=PASS");
        output.println("components=" + count);
        return 0;
    }

    private static int format(String[] arguments, PrintStream output, PrintStream error, InputStream input) {
        if (arguments.length == 2 && "--stdin".equals(arguments[1])) {
            output.print(ButterFormatter.format("stdin.butter", readUtf8(input)));
            return 0;
        }
        if (arguments.length == 2) {
            Path file = Paths.get(arguments[1]);
            try {
                Files.write(file, ButterFormatter.format(file).getBytes(StandardCharsets.UTF_8));
            } catch (IOException failure) {
                throw new RuntimeException(failure.getMessage(), failure);
            }
            output.println("BUTTER_FORMAT=PASS");
            return 0;
        }
        if (arguments.length == 3 && "--stdout".equals(arguments[1])) {
            output.print(ButterFormatter.format(Paths.get(arguments[2])));
            return 0;
        }
        return usage(error);
    }

    private static String readUtf8(InputStream input) {
        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int count;
            while ((count = input.read(buffer)) >= 0) bytes.write(buffer, 0, count);
            return new String(bytes.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException error) {
            throw new RuntimeException(error.getMessage(), error);
        }
    }

    private static int usage(PrintStream error) {
        error.println("usage: butter version");
        error.println("   or: butter compile <file.butter>");
        error.println("   or: butter check <file-or-directory>");
        error.println("   or: butter format <file.butter>");
        error.println("   or: butter format --stdout <file.butter>");
        error.println("   or: butter format --stdin");
        return 2;
    }
}
