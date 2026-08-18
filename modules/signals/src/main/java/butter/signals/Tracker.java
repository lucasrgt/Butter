package butter.signals;

import java.util.LinkedHashSet;
import java.util.Set;

/** Thread-local dependency collector used by Computed and Effect. */
final class Tracker {
    private static final ThreadLocal<Frame> CURRENT = new ThreadLocal<Frame>();

    private Tracker() {}

    static void read(Dep dependency) {
        Frame frame = CURRENT.get();
        if (frame != null) frame.dependencies.add(dependency);
    }

    static Frame push() {
        Frame previous = CURRENT.get();
        Frame next = new Frame(previous);
        CURRENT.set(next);
        return next;
    }

    static void pop(Frame frame) { CURRENT.set(frame.previous); }

    static final class Frame {
        final Frame previous;
        final Set<Dep> dependencies = new LinkedHashSet<Dep>();

        Frame(Frame previous) { this.previous = previous; }

        Dep[] snapshot() { return dependencies.toArray(new Dep[0]); }
    }
}
