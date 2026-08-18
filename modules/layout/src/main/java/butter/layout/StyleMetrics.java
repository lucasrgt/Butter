package butter.layout;

/** Parsed utility metrics. One utility unit is one Minecraft GUI pixel. */
public final class StyleMetrics {
    public final int padLeft;
    public final int padRight;
    public final int padTop;
    public final int padBottom;
    public final int gap;
    public final int width;
    public final int height;
    public final boolean widthFull;
    public final int gridCols;
    public final String items;
    public final String justify;
    public final String background;
    public final String border;

    public StyleMetrics(int padLeft, int padRight, int padTop, int padBottom, int gap, int width, int height,
            boolean widthFull, int gridCols, String items, String justify, String background, String border) {
        this.padLeft = padLeft;
        this.padRight = padRight;
        this.padTop = padTop;
        this.padBottom = padBottom;
        this.gap = gap;
        this.width = width;
        this.height = height;
        this.widthFull = widthFull;
        this.gridCols = gridCols;
        this.items = items;
        this.justify = justify;
        this.background = background;
        this.border = border;
    }

    public static StyleMetrics parse(String className) {
        return StyleParser.parse(className);
    }

    public int padX() { return padLeft + padRight; }
    public int padY() { return padTop + padBottom; }
}
