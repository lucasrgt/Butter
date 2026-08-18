package butter.layout;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import butter.core.WidgetSpec;

/** Deterministic layout for Row, Column, Stack, and Grid. */
public final class LayoutEngine {
    private LayoutEngine() {}

    public static LayoutNode layout(WidgetSpec spec, BoxConstraints constraints) {
        StyleMetrics style = StyleMetrics.parse(spec.className());
        BoxConstraints inner = constraints.deflate(style.padLeft, style.padTop, style.padRight, style.padBottom);
        String type = spec.type();
        if ("Row".equals(type)) return row(spec, style, constraints, inner, false);
        if ("Column".equals(type) || "Panel".equals(type) || "MachinePanel".equals(type))
            return row(spec, style, constraints, inner, true);
        if ("Stack".equals(type)) return stack(spec, style, constraints, inner);
        if ("Grid".equals(type) || "ItemGrid".equals(type) || "Inventory".equals(type)
                || "PlayerInventory".equals(type)) return grid(spec, style, constraints, inner);
        return leaf(spec, style, constraints);
    }

    private static LayoutNode row(WidgetSpec spec, StyleMetrics style, BoxConstraints outer,
            BoxConstraints inner, boolean vertical) {
        List<WidgetSpec> children = spec.children();
        List<LayoutNode> laid = new ArrayList<LayoutNode>();
        int cursor = 0;
        int cross = 0;
        for (int index = 0; index < children.size(); index++) {
            LayoutNode child = layout(children.get(index), inner);
            int x = vertical ? 0 : cursor;
            int y = vertical ? cursor : 0;
            laid.add(new LayoutNode(child.widget, new Rect(x + style.padLeft, y + style.padTop,
                    child.bounds.width, child.bounds.height), child.children));
            cursor += (vertical ? child.bounds.height : child.bounds.width) + (index + 1 < children.size() ? style.gap : 0);
            cross = Math.max(cross, vertical ? child.bounds.width : child.bounds.height);
        }
        int width = vertical ? cross + style.padX() : cursor + style.padX();
        int height = vertical ? cursor + style.padY() : cross + style.padY();
        if (style.widthFull) width = outer.maxWidth;
        if (style.width > 0) width = style.width;
        if (style.height > 0) height = style.height;
        return new LayoutNode(spec, new Rect(0, 0, outer.clampWidth(width), outer.clampHeight(height)), laid);
    }

    private static LayoutNode stack(WidgetSpec spec, StyleMetrics style, BoxConstraints outer, BoxConstraints inner) {
        List<LayoutNode> laid = new ArrayList<LayoutNode>();
        int width = 0;
        int height = 0;
        List<WidgetSpec> children = spec.children();
        for (int index = 0; index < children.size(); index++) {
            LayoutNode child = layout(children.get(index), inner);
            laid.add(new LayoutNode(child.widget, new Rect(style.padLeft, style.padTop,
                    child.bounds.width, child.bounds.height), child.children));
            width = Math.max(width, child.bounds.width);
            height = Math.max(height, child.bounds.height);
        }
        width += style.padX();
        height += style.padY();
        if (style.width > 0) width = style.width;
        if (style.height > 0) height = style.height;
        return new LayoutNode(spec, new Rect(0, 0, outer.clampWidth(width), outer.clampHeight(height)), laid);
    }

    private static LayoutNode grid(WidgetSpec spec, StyleMetrics style, BoxConstraints outer, BoxConstraints inner) {
        int cols = style.gridCols <= 0 ? 9 : style.gridCols;
        List<WidgetSpec> children = spec.children();
        List<LayoutNode> laid = new ArrayList<LayoutNode>();
        int cellW = 18;
        int cellH = 18;
        for (int index = 0; index < children.size(); index++) {
            LayoutNode child = layout(children.get(index), inner);
            cellW = Math.max(cellW, child.bounds.width);
            cellH = Math.max(cellH, child.bounds.height);
        }
        for (int index = 0; index < children.size(); index++) {
            LayoutNode child = layout(children.get(index), inner);
            int col = index % cols;
            int row = index / cols;
            int x = style.padLeft + col * (cellW + style.gap);
            int y = style.padTop + row * (cellH + style.gap);
            laid.add(new LayoutNode(child.widget, new Rect(x, y, child.bounds.width, child.bounds.height),
                    child.children));
        }
        int rows = children.isEmpty() ? 0 : (children.size() + cols - 1) / cols;
        int width = style.padX() + cols * cellW + Math.max(0, cols - 1) * style.gap;
        int height = style.padY() + rows * cellH + Math.max(0, rows - 1) * style.gap;
        return new LayoutNode(spec, new Rect(0, 0, outer.clampWidth(width), outer.clampHeight(height)), laid);
    }

    private static LayoutNode leaf(WidgetSpec spec, StyleMetrics style, BoxConstraints outer) {
        int width = style.width;
        int height = style.height;
        if (width <= 0) width = measureWidth(spec);
        if (height <= 0) height = "Button".equals(spec.type()) ? 20 : 8;
        width += style.padX();
        height += style.padY();
        if (style.widthFull) width = outer.maxWidth;
        return new LayoutNode(spec, new Rect(0, 0, outer.clampWidth(width), outer.clampHeight(height)),
                Collections.<LayoutNode>emptyList());
    }

    private static int measureWidth(WidgetSpec spec) {
        if (!spec.arguments().isEmpty() && spec.arguments().get(0) instanceof String) {
            return Math.max(16, ((String) spec.arguments().get(0)).length() * 6);
        }
        if ("Slot".equals(spec.type()) || "FluidTank".equals(spec.type()) || "EnergyBar".equals(spec.type())) return 18;
        return 16;
    }
}
