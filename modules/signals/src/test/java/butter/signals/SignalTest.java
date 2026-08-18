package butter.signals;

import java.util.concurrent.atomic.AtomicInteger;

public final class SignalTest {
    private SignalTest() {}

    public static void main(String[] arguments) {
        Signal<Integer> energy = Signal.of(0);
        Computed<Boolean> canCraft = Computed.of(new Computed.Source<Boolean>() {
            public Boolean get() { return Boolean.valueOf(energy.get().intValue() >= 100); }
        });
        require(energy.get().intValue() == 0 && !canCraft.get().booleanValue(), "initial");
        energy.set(Integer.valueOf(250));
        require(canCraft.get().booleanValue(), "computed after set");
        energy.update(new Signal.Updater<Integer>() {
            public Integer apply(Integer value) { return Integer.valueOf(value.intValue() + 10); }
        });
        require(energy.get().intValue() == 260, "update");
        final AtomicInteger runs = new AtomicInteger();
        Effect effect = Effect.of(new Runnable() {
            public void run() {
                energy.get();
                runs.incrementAndGet();
            }
        });
        require(runs.get() == 1, "effect mount");
        energy.set(Integer.valueOf(1));
        require(runs.get() == 2, "effect invalidation");
        effect.dispose();
        energy.set(Integer.valueOf(2));
        require(runs.get() == 2, "disposed effect");
        System.out.println("  signals: of/get/set/update/computed/effect");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
