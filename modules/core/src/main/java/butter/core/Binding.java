package butter.core;

/** Symbolic reference to Java state or an action. */
public final class Binding {
    private final String path;

    public Binding(String path) {
        if (path == null || path.isEmpty()) throw new IllegalArgumentException("path");
        this.path = path;
    }

    public String path() { return path; }

    public String toString() { return path; }

    public int hashCode() { return path.hashCode(); }

    public boolean equals(Object other) {
        return other instanceof Binding && path.equals(((Binding) other).path);
    }
}
