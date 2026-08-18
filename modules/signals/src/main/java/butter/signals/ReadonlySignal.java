package butter.signals;

/** Read-only reactive value. */
public interface ReadonlySignal<T> {
    T get();
}
