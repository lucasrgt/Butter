package butter.layout;

import butter.core.Theme;

/** Parsed utility metrics. One utility unit is one Minecraft GUI pixel. */
public final class StyleMetrics {
    public static final int CHAR_W = 6;
    public static final int CHAR_H = 8;
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
    public final int charWidth;
    public final int charHeight;
    public final boolean fontBold;
    public final boolean textShadow;
    public final String ink;
    public final StyleBox box;

    public StyleMetrics(int padLeft, int padRight, int padTop, int padBottom, int gap, int width, int height,
            boolean widthFull, int gridCols, String items, String justify, String background, String border,
            int charWidth, int charHeight, boolean fontBold, boolean textShadow, String ink, StyleBox box) {
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
        this.charWidth = charWidth;
        this.charHeight = charHeight;
        this.fontBold = fontBold;
        this.textShadow = textShadow;
        this.ink = ink;
        this.box = box == null ? StyleBox.EMPTY : box;
    }

    public static StyleMetrics parse(String className) {
        return parse(className, "", Theme.standard());
    }

    public static StyleMetrics parse(String className, String flags) {
        return parse(className, flags, Theme.standard());
    }

    public static StyleMetrics parse(String className, String flags, Theme theme) {
        return StyleParser.parse(className, flags, theme == null ? Theme.standard() : theme);
    }

    public int padX() { return padLeft + padRight; }
    public int padY() { return padTop + padBottom; }
    public int glyphExtra() { return (fontBold || textShadow) ? 1 : 0; }
}
