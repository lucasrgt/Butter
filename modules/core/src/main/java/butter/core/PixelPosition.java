package butter.core;

/** Integer offsets inside a Stack, expressed in target-independent UI pixels. */
public final class PixelPosition {
    private PixelPosition() {}

    public static int value(WidgetSpec widget, String axis, int fallback) {
        Object value = widget.prop(axis);
        if (value == null) return fallback;
        if (!valid(value)) throw new IllegalArgumentException(axis + " must be an integer between -32768 and 32768");
        return ((Number) value).intValue();
    }

    public static boolean valid(Object value) {
        if (!(value instanceof Number)) return false;
        double number = ((Number) value).doubleValue();
        return number >= -32768 && number <= 32768 && number == Math.rint(number);
    }
}
