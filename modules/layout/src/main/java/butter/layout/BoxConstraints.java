package butter.layout;

/** Inclusive min and exclusive-unbounded max using Integer.MAX_VALUE. */
public final class BoxConstraints {
    public final int minWidth;
    public final int minHeight;
    public final int maxWidth;
    public final int maxHeight;

    public BoxConstraints(int minWidth, int minHeight, int maxWidth, int maxHeight) {
        this.minWidth = minWidth;
        this.minHeight = minHeight;
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
    }

    public static BoxConstraints loose(int width, int height) {
        return new BoxConstraints(0, 0, width, height);
    }

    public BoxConstraints deflate(int left, int top, int right, int bottom) {
        int width = Math.max(0, maxWidth - left - right);
        int height = Math.max(0, maxHeight - top - bottom);
        return new BoxConstraints(0, 0, width, height);
    }

    public int clampWidth(int width) {
        return Math.max(minWidth, Math.min(maxWidth, width));
    }

    public int clampHeight(int height) {
        return Math.max(minHeight, Math.min(maxHeight, height));
    }
}
