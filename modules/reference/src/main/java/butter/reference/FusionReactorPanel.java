package butter.reference;

import butter.annotations.ButterAction;
import butter.annotations.ButterComponent;
import butter.signals.Computed;
import butter.signals.Signal;

/** Java backing for the fusion-reactor reference screen. */
@ButterComponent(template = "FusionReactorPanel.butter")
public final class FusionReactorPanel {
    public final Signal<Integer> energyOutput = Signal.of(Integer.valueOf(0));
    public final Signal<Integer> plasmaTemperature = Signal.of(Integer.valueOf(0));
    public final Signal<Integer> fusionIntensity = Signal.of(Integer.valueOf(40));
    public final Signal<Integer> deuterium = Signal.of(Integer.valueOf(80));
    public final Signal<Integer> tritium = Signal.of(Integer.valueOf(80));
    public final Signal<Integer> deuteriumRate = Signal.of(Integer.valueOf(0));
    public final Signal<Integer> tritiumRate = Signal.of(Integer.valueOf(0));
    public final Signal<Boolean> running = Signal.of(Boolean.FALSE);
    public final Signal<Integer> coolant = Signal.of(Integer.valueOf(100));
    public final Signal<Integer> magneticField = Signal.of(Integer.valueOf(100));
    public final Computed<Boolean> canIgnite = Computed.of(new Computed.Source<Boolean>() {
        public Boolean get() {
            return Boolean.valueOf(!running.get().booleanValue() && deuterium.get().intValue() > 0
                    && tritium.get().intValue() > 0);
        }
    });
    public final Computed<Boolean> canScram = Computed.of(new Computed.Source<Boolean>() {
        public Boolean get() { return running.get(); }
    });
    public final Computed<String> status = Computed.of(new Computed.Source<String>() {
        public String get() { return running.get().booleanValue() ? "ONLINE" : "STANDBY"; }
    });

    @ButterAction
    public void ignite() {
        running.set(Boolean.TRUE);
        energyOutput.set(Integer.valueOf(180000));
        plasmaTemperature.set(Integer.valueOf(150000000));
        deuteriumRate.set(Integer.valueOf(4));
        tritiumRate.set(Integer.valueOf(4));
    }

    @ButterAction
    public void standby() {
        running.set(Boolean.FALSE);
        energyOutput.set(Integer.valueOf(0));
        plasmaTemperature.set(Integer.valueOf(0));
        deuteriumRate.set(Integer.valueOf(0));
        tritiumRate.set(Integer.valueOf(0));
    }

    @ButterAction
    public void scram() {
        running.set(Boolean.FALSE);
        fusionIntensity.set(Integer.valueOf(0));
        energyOutput.set(Integer.valueOf(0));
        plasmaTemperature.set(Integer.valueOf(0));
        deuteriumRate.set(Integer.valueOf(0));
        tritiumRate.set(Integer.valueOf(0));
    }
}
