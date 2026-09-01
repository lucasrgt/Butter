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
        if ("Row".equals(type)) return FlexPack.row(spec, style, constraints, inner, false);
        if ("Column".equals(type) || "Panel".equals(type) || "MachinePanel".equals(type))
            return FlexPack.row(spec, style, constraints, inner, true);
        if ("TabBar".equals(type)) return FlexPack.row(tabSide(spec), style, constraints, inner, verticalSide(spec));
        if ("Stack".equals(type)) return FlexPack.stack(spec, style, constraints, inner);
        if ("Grid".equals(type) || "ItemGrid".equals(type) || "Inventory".equals(type)
                || "PlayerInventory".equals(type)) return grid(spec, style, constraints, inner);
        return leaf(spec, style, constraints);
    }

    static boolean seam(String left, String right) {
        return "TabBar".equals(left) && "Panel".equals(right)
                || "Panel".equals(left) && "TabBar".equals(right);
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
            int x = style.padLeft + col * (cellW + style.box.gapX);
            int y = style.padTop + row * (cellH + style.box.gapY);
            laid.add(new LayoutNode(child.widget, new Rect(x, y, child.bounds.width, child.bounds.height),
                    child.children));
        }
        int rows = children.isEmpty() ? 0 : (children.size() + cols - 1) / cols;
        int width = style.padX() + cols * cellW + Math.max(0, cols - 1) * style.box.gapX;
        int height = style.padY() + rows * cellH + Math.max(0, rows - 1) * style.box.gapY;
        return new LayoutNode(spec, new Rect(0, 0, outer.clampWidth(width), outer.clampHeight(height)), laid);
    }

    private static LayoutNode leaf(WidgetSpec spec, StyleMetrics style, BoxConstraints outer) {
        int width = style.width;
        int height = style.height;
        if (width <= 0) width = measureWidth(spec, style);
        if (height <= 0) height = measureHeight(spec, style);
        width += style.padX();
        height += style.padY();
        if (style.widthFull) width = outer.maxWidth;
        if (style.box.heightFull) height = outer.maxHeight;
        return new LayoutNode(spec, new Rect(0, 0, outer.clampWidth(width), outer.clampHeight(height)),
                Collections.<LayoutNode>emptyList());
    }

    private static WidgetSpec tabSide(WidgetSpec spec) {
        Object side = spec.prop("side");
        if (side == null) return spec;
        List<WidgetSpec> source = spec.children();
        List<WidgetSpec> children = new ArrayList<WidgetSpec>();
        for (int index = 0; index < source.size(); index++) {
            WidgetSpec child = source.get(index);
            children.add("Tab".equals(child.type()) ? child.withProp("side", side) : child);
        }
        return spec.withChildren(children);
    }

    private static boolean verticalSide(WidgetSpec spec) {
        Object side = spec.prop("side");
        return "left".equals(side) || "right".equals(side);
    }

    private static int measureWidth(WidgetSpec spec, StyleMetrics style) {
        if (style.box.slotLg) return 26;
        if ("SearchBar".equals(spec.type())) return 88;
        if ("Scrollbar".equals(spec.type())) return 6;
        if ("Separator".equals(spec.type())) return style.height > 2 ? 2 : 16;
        if ("Slider".equals(spec.type())) return 64;
        if ("Toggle".equals(spec.type())) return 16;
        if ("Flame".equals(spec.type())) return 14;
        if ("RecipeProgress".equals(spec.type())) return 22;
        if ("Spacer".equals(spec.type())) return 8;
        if ("Checkbox".equals(spec.type()) || "Radio".equals(spec.type())) return 9;
        if ("Text".equals(spec.type()) || "Tooltip".equals(spec.type())) return textWidth(spec, style);
        if (!spec.arguments().isEmpty() && spec.arguments().get(0) instanceof String) {
            return Math.max(16, ((String) spec.arguments().get(0)).length() * StyleMetrics.CHAR_W);
        }
        if ("Slot".equals(spec.type()) || "FluidTank".equals(spec.type()) || "EnergyBar".equals(spec.type())
                || "GasTank".equals(spec.type())) return 18;
        return 16;
    }

    private static int measureHeight(WidgetSpec spec, StyleMetrics style) {
        if (style.box.slotLg) return 26;
        if ("SearchBar".equals(spec.type())) return 12;
        if ("Tab".equals(spec.type())) return 16;
        if ("Scrollbar".equals(spec.type())) return 54;
        if ("Separator".equals(spec.type())) return 2;
        if ("Button".equals(spec.type())) return 20;
        if ("Slider".equals(spec.type())) return 8;
        if ("Toggle".equals(spec.type()) || "Checkbox".equals(spec.type()) || "Radio".equals(spec.type())) return 9;
        if ("Flame".equals(spec.type())) return 14;
        if ("RecipeProgress".equals(spec.type())) return 16;
        if ("Spacer".equals(spec.type())) return 8;
        if ("Text".equals(spec.type()) || "Tooltip".equals(spec.type())) return textHeight(spec, style);
        return StyleMetrics.CHAR_H;
    }

    private static int textWidth(WidgetSpec spec, StyleMetrics style) {
        String label = spec.arguments().isEmpty() ? "" : String.valueOf(spec.arguments().get(0));
        int raw = Math.max(16, label.length() * style.charWidth + style.glyphExtra());
        if (style.box.wrap && style.width > 0) return style.width;
        return raw;
    }

    private static int textHeight(WidgetSpec spec, StyleMetrics style) {
        String label = spec.arguments().isEmpty() ? "" : String.valueOf(spec.arguments().get(0));
        int lines = 1;
        if (style.box.wrap && style.width > 0) {
            int cols = Math.max(1, (style.width - style.padX()) / Math.max(1, style.charWidth));
            lines = Math.max(1, (label.length() + cols - 1) / cols);
        }
        return lines * style.charHeight + (style.textShadow ? 1 : 0);
    }
}
