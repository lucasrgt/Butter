package butter.layout;

import java.util.ArrayList;
import java.util.List;
import butter.core.WidgetSpec;
import butter.core.PixelPosition;

/** Row/Column/Stack packing: items, justify, grow, margins, and h-full. */
final class FlexPack {
    private FlexPack() {}

    static LayoutNode row(WidgetSpec spec, StyleMetrics style, BoxConstraints outer,
            BoxConstraints inner, boolean vertical) {
        BoxConstraints childInner = tighten(inner, style, outer);
        List<WidgetSpec> children = spec.children();
        List<LayoutNode> raw = new ArrayList<LayoutNode>();
        List<StyleMetrics> metrics = new ArrayList<StyleMetrics>();
        int used = 0;
        int cross = 0;
        for (int index = 0; index < children.size(); index++) {
            if (index > 0 && LayoutEngine.seam(children.get(index - 1).type(), children.get(index).type())) used -= 1;
            StyleMetrics childStyle = StyleMetrics.parse(children.get(index).className());
            LayoutNode child = LayoutEngine.layout(children.get(index), childInner);
            raw.add(child);
            metrics.add(childStyle);
            used += mainOf(child, vertical) + mainMargin(childStyle, vertical);
            if (index + 1 < children.size()) used += style.box.gap(vertical);
            cross = Math.max(cross, crossOf(child, vertical) + crossMargin(childStyle, vertical));
        }
        int width = vertical ? cross + style.padX() : used + style.padX();
        int height = vertical ? used + style.padY() : cross + style.padY();
        if (style.widthFull) width = outer.maxWidth;
        if (style.box.heightFull) height = outer.maxHeight;
        if (style.width > 0) width = style.width;
        if (style.height > 0) height = style.height;
        width = outer.clampWidth(width);
        height = outer.clampHeight(height);
        int innerMain = Math.max(0, vertical ? height - style.padY() : width - style.padX());
        int innerCross = Math.max(0, vertical ? width - style.padX() : height - style.padY());
        int extra = Math.max(0, innerMain - used);
        int grows = 0;
        for (int index = 0; index < metrics.size(); index++) if (metrics.get(index).box.grow) grows++;
        int share = grows == 0 ? 0 : extra / grows;
        if (grows > 0) extra = 0;
        int offset = 0;
        int between = 0;
        if ("center".equals(style.justify)) offset = extra / 2;
        else if ("end".equals(style.justify)) offset = extra;
        else if ("between".equals(style.justify) && raw.size() > 1) between = extra / (raw.size() - 1);
        int cursor = offset;
        List<LayoutNode> laid = new ArrayList<LayoutNode>();
        for (int index = 0; index < raw.size(); index++) {
            if (index > 0 && LayoutEngine.seam(children.get(index - 1).type(), children.get(index).type())) cursor -= 1;
            StyleMetrics childStyle = metrics.get(index);
            LayoutNode child = raw.get(index);
            int main = mainOf(child, vertical) + (childStyle.box.grow ? share : 0);
            int across = "stretch".equals(style.items)
                    ? Math.max(crossOf(child, vertical), innerCross - crossMargin(childStyle, vertical))
                    : crossOf(child, vertical);
            int m0 = vertical ? childStyle.box.marginTop : childStyle.box.marginLeft;
            int m1 = vertical ? childStyle.box.marginBottom : childStyle.box.marginRight;
            int c0 = vertical ? childStyle.box.marginLeft : childStyle.box.marginTop;
            int c1 = vertical ? childStyle.box.marginRight : childStyle.box.marginBottom;
            int crossPos = c0;
            if ("center".equals(style.items)) crossPos = c0 + (innerCross - across - c0 - c1) / 2;
            else if ("end".equals(style.items)) crossPos = innerCross - across - c1;
            int mainPos = cursor + m0;
            int x = style.padLeft + (vertical ? crossPos : mainPos);
            int y = style.padTop + (vertical ? mainPos : crossPos);
            int w = vertical ? across : main;
            int h = vertical ? main : across;
            laid.add(new LayoutNode(child.widget, new Rect(x, y, w, h), child.children));
            cursor += m0 + main + m1 + (index + 1 < raw.size() ? style.box.gap(vertical) + between : 0);
        }
        return new LayoutNode(spec, new Rect(0, 0, width, height), laid);
    }

    static LayoutNode stack(WidgetSpec spec, StyleMetrics style, BoxConstraints outer, BoxConstraints inner) {
        BoxConstraints childInner = tighten(inner, style, outer);
        List<LayoutNode> laid = new ArrayList<LayoutNode>();
        int width = 0;
        int height = 0;
        List<WidgetSpec> children = spec.children();
        List<LayoutNode> raw = new ArrayList<LayoutNode>();
        for (int index = 0; index < children.size(); index++) {
            LayoutNode child = LayoutEngine.layout(children.get(index), childInner);
            raw.add(child);
            width = Math.max(width, PixelPosition.value(child.widget, "x", 0) + child.bounds.width);
            height = Math.max(height, PixelPosition.value(child.widget, "y", 0) + child.bounds.height);
        }
        width += style.padX();
        height += style.padY();
        if (style.widthFull) width = outer.maxWidth;
        if (style.box.heightFull) height = outer.maxHeight;
        if (style.width > 0) width = style.width;
        if (style.height > 0) height = style.height;
        width = outer.clampWidth(width);
        height = outer.clampHeight(height);
        int innerW = Math.max(0, width - style.padX());
        int innerH = Math.max(0, height - style.padY());
        for (int index = 0; index < raw.size(); index++) {
            LayoutNode child = raw.get(index);
            int x = style.padLeft + PixelPosition.value(child.widget, "x", shift(style.justify, innerW, child.bounds.width));
            int y = style.padTop + PixelPosition.value(child.widget, "y", shift(style.items, innerH, child.bounds.height));
            laid.add(new LayoutNode(child.widget, new Rect(x, y, child.bounds.width, child.bounds.height),
                    child.children));
        }
        return new LayoutNode(spec, new Rect(0, 0, width, height), laid);
    }

    static BoxConstraints tighten(BoxConstraints inner, StyleMetrics style, BoxConstraints outer) {
        int maxW = inner.maxWidth;
        int maxH = inner.maxHeight;
        if (style.widthFull) maxW = Math.max(0, outer.maxWidth - style.padX());
        if (style.width > 0) maxW = Math.max(0, style.width - style.padX());
        if (style.box.heightFull) maxH = Math.max(0, outer.maxHeight - style.padY());
        if (style.height > 0) maxH = Math.max(0, style.height - style.padY());
        return new BoxConstraints(inner.minWidth, inner.minHeight, maxW, maxH);
    }

    private static int shift(String align, int inner, int size) {
        if ("center".equals(align)) return Math.max(0, (inner - size) / 2);
        if ("end".equals(align)) return Math.max(0, inner - size);
        return 0;
    }

    private static int mainOf(LayoutNode child, boolean vertical) {
        return vertical ? child.bounds.height : child.bounds.width;
    }

    private static int crossOf(LayoutNode child, boolean vertical) {
        return vertical ? child.bounds.width : child.bounds.height;
    }

    private static int mainMargin(StyleMetrics style, boolean vertical) {
        return vertical ? style.box.marginY() : style.box.marginX();
    }

    private static int crossMargin(StyleMetrics style, boolean vertical) {
        return vertical ? style.box.marginX() : style.box.marginY();
    }
}
