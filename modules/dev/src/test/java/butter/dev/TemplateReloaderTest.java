package butter.dev;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import butter.compiler.ButterCompiler;
import butter.core.WidgetSpec;

public final class TemplateReloaderTest {
    private TemplateReloaderTest() {}

    public static void main(String[] arguments) throws Exception {
        Path file = Files.createTempFile("butter-reload", ".butter");
        Files.write(file, "Text(\"A\", class: \"text-lg\")".getBytes(StandardCharsets.UTF_8));
        WidgetSpec first = ButterCompiler.compile(file);
        WidgetSpec same = TemplateReloader.reload(file, first);
        require(same == first, "unchanged identity");
        Files.write(file, "Text(\"B\", class: \"text-sm\")".getBytes(StandardCharsets.UTF_8));
        WidgetSpec next = TemplateReloader.reload(file, first);
        require(next != first && "Text".equals(next.type()), "rebuild");
        Files.deleteIfExists(file);
        System.out.println("  dev: template reload");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
