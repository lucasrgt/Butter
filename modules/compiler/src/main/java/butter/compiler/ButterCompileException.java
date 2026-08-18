package butter.compiler;

import java.util.Collections;
import java.util.List;

/** Thrown when the Butter compiler fails closed. */
public final class ButterCompileException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private final transient List<Diagnostic> diagnostics;

    public ButterCompileException(Diagnostic diagnostic) {
        this(Collections.singletonList(diagnostic));
    }

    public ButterCompileException(List<Diagnostic> diagnostics) {
        super(diagnostics.get(0).format());
        this.diagnostics = Collections.unmodifiableList(diagnostics);
    }

    public List<Diagnostic> diagnostics() { return diagnostics; }
}
