package butter.testing;

/** Minimal assertion helpers for Butter screens. */
public final class Expect {
    private Expect() {}

    public static void toBeGreaterThan(double actual, double expected) {
        if (!(actual > expected)) {
            throw new IllegalStateException("expected " + actual + " > " + expected);
        }
    }

    public static void toEqual(Object actual, Object expected) {
        if (actual == expected) return;
        if (actual != null && actual.equals(expected)) return;
        throw new IllegalStateException("expected " + expected + " but was " + actual);
    }
}
