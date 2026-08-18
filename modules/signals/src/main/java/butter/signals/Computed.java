package butter.signals;

/** Derived reactive value. Recomputes when recorded dependencies change. */
public final class Computed<T> implements ReadonlySignal<T>, Dep {
    private final Source<T> computation;
    private final Listeners listeners = new Listeners();
    private final Runnable invalidate = new Runnable() {
        public void run() {
            dirty = true;
            listeners.fire();
        }
    };
    private T value;
    private boolean dirty = true;
    private Dep[] dependencies = new Dep[0];

    private Computed(Source<T> computation) {
        if (computation == null) throw new IllegalArgumentException("computation");
        this.computation = computation;
    }

    public static <T> Computed<T> of(Source<T> computation) { return new Computed<T>(computation); }

    public T get() {
        Tracker.read(this);
        if (dirty) recompute();
        return value;
    }

    public void add(Runnable listener) { listeners.add(listener); }

    public void remove(Runnable listener) { listeners.remove(listener); }

    private void recompute() {
        for (int index = 0; index < dependencies.length; index++) dependencies[index].remove(invalidate);
        Tracker.Frame frame = Tracker.push();
        try {
            value = computation.get();
            dirty = false;
        } finally {
            Tracker.pop(frame);
        }
        dependencies = frame.snapshot();
        for (int index = 0; index < dependencies.length; index++) dependencies[index].add(invalidate);
    }

    public interface Source<T> { T get(); }
}
