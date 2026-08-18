package butter.signals;

/** Mutable reactive cell. Public surface: of, get, set, update. */
public final class Signal<T> implements ReadonlySignal<T>, Dep {
    private T value;
    private final Listeners listeners = new Listeners();

    private Signal(T value) { this.value = value; }

    public static <T> Signal<T> of(T value) { return new Signal<T>(value); }

    public T get() {
        Tracker.read(this);
        return value;
    }

    public void set(T value) {
        if (equal(this.value, value)) return;
        this.value = value;
        listeners.fire();
    }

    public void update(Updater<T> updater) {
        if (updater == null) throw new IllegalArgumentException("updater");
        set(updater.apply(value));
    }

    public void add(Runnable listener) { listeners.add(listener); }

    public void remove(Runnable listener) { listeners.remove(listener); }

    private static boolean equal(Object left, Object right) {
        return left == right || (left != null && left.equals(right));
    }

    public interface Updater<T> { T apply(T value); }
}
