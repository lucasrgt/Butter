package butter.signals;

/** Explicit side effect. Not a public watch() API. */
public final class Effect {
    private final Runnable effect;
    private final Runnable invalidate = new Runnable() {
        public void run() { runEffect(); }
    };
    private Dep[] dependencies = new Dep[0];
    private boolean disposed;

    public static Effect of(Runnable effect) {
        Effect created = new Effect(effect);
        created.runEffect();
        return created;
    }

    private Effect(Runnable effect) {
        if (effect == null) throw new IllegalArgumentException("effect");
        this.effect = effect;
    }

    public void dispose() {
        disposed = true;
        for (int index = 0; index < dependencies.length; index++) dependencies[index].remove(invalidate);
        dependencies = new Dep[0];
    }

    private void runEffect() {
        if (disposed) return;
        for (int index = 0; index < dependencies.length; index++) dependencies[index].remove(invalidate);
        Tracker.Frame frame = Tracker.push();
        try {
            effect.run();
        } finally {
            Tracker.pop(frame);
        }
        dependencies = frame.snapshot();
        for (int index = 0; index < dependencies.length; index++) dependencies[index].add(invalidate);
    }
}
