package butter.dev;

import java.nio.file.Path;
import java.util.Objects;
import butter.compiler.ButterCompiler;
import butter.core.WidgetSpec;
import butter.runtime.ButterRuntime;

/** Reloads `.butter` templates without requiring DCEVM. Java still uses javac. */
public final class TemplateReloader {
    private TemplateReloader() {}

    public static WidgetSpec reload(Path file, WidgetSpec previous) {
        WidgetSpec next = ButterCompiler.compile(file);
        if (same(previous, next)) return previous;
        return next;
    }

    public static ButterRuntime reload(Path file, ButterRuntime runtime) {
        WidgetSpec next = reload(file, runtime.tree());
        return ButterRuntime.mount(next, runtime.backing());
    }

    static boolean same(WidgetSpec left, WidgetSpec right) {
        if (left == right) return true;
        if (left == null || right == null) return false;
        if (!left.type().equals(right.type())) return false;
        if (!Objects.equals(left.className(), right.className())) return false;
        if (left.children().size() != right.children().size()) return false;
        for (int index = 0; index < left.children().size(); index++) {
            if (!same(left.children().get(index), right.children().get(index))) return false;
        }
        return true;
    }
}
