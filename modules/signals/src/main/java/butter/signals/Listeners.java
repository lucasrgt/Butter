package butter.signals;

import java.util.ArrayList;
import java.util.List;

/** Copies before firing so set() during a listener cannot skip later listeners. */
final class Listeners {
    private final List<Runnable> listeners = new ArrayList<Runnable>();

    void add(Runnable listener) {
        if (listener != null && !listeners.contains(listener)) listeners.add(listener);
    }

    void remove(Runnable listener) { listeners.remove(listener); }

    void fire() {
        if (listeners.isEmpty()) return;
        List<Runnable> snapshot = new ArrayList<Runnable>(listeners);
        for (int index = 0; index < snapshot.size(); index++) snapshot.get(index).run();
    }
}
