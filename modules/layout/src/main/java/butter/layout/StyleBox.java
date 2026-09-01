package butter.layout;

/** Margin, axis gap, and flex flags parsed from utilities. */
public final class StyleBox {
    public static final StyleBox EMPTY = new StyleBox(0, 0, 0, 0, 0, 0, false, false, false, false, false);
    public final int gapX;
    public final int gapY;
    public final int marginLeft;
    public final int marginRight;
    public final int marginTop;
    public final int marginBottom;
    public final boolean heightFull;
    public final boolean grow;
    public final boolean wrap;
    public final boolean truncate;
    public final boolean slotLg;

    public StyleBox(int gapX, int gapY, int marginLeft, int marginRight, int marginTop, int marginBottom,
            boolean heightFull, boolean grow, boolean wrap, boolean truncate, boolean slotLg) {
        this.gapX = gapX;
        this.gapY = gapY;
        this.marginLeft = marginLeft;
        this.marginRight = marginRight;
        this.marginTop = marginTop;
        this.marginBottom = marginBottom;
        this.heightFull = heightFull;
        this.grow = grow;
        this.wrap = wrap;
        this.truncate = truncate;
        this.slotLg = slotLg;
    }

    public int marginX() { return marginLeft + marginRight; }
    public int marginY() { return marginTop + marginBottom; }
    public int gap(boolean vertical) { return vertical ? gapY : gapX; }
}
