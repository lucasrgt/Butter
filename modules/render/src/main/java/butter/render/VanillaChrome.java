package butter.render;

import butter.core.Theme;
import butter.layout.LayoutNode;
import butter.layout.Rect;
import butter.layout.StyleMetrics;

/** 1px Beta 1.7.3 bevel. Not CSS radius and not JAR 9-slice textures. */
final class VanillaChrome {
    private VanillaChrome() {}

    static void decorate(HostCanvas canvas, LayoutNode node, Theme theme, int x, int y, Rect box) {
        String type = node.widget.type();
        if ("SearchBar".equals(type)) {
            bevel(canvas, x, y, box.width, box.height, theme, false, null);
            String text = label(node);
            int color = hasValue(node) ? theme.color("text") : theme.color("muted");
            if (!text.isEmpty()) canvas.text(x + 2, y + 2, text, color);
            if (Boolean.TRUE.equals(node.widget.prop("focused"))) {
                int caret = x + 2 + (hasValue(node) ? text.length() * 6 : 0);
                canvas.fill(caret, y + 2, 1, 8, theme.color("text"));
            }
            return;
        }
        if ("Tab".equals(type)) {
            boolean selected = Boolean.TRUE.equals(node.widget.prop("selected"));
            bevel(canvas, x, y, box.width, box.height, theme, true, selected ? innerEdge(node) : null);
            Object label = node.widget.arguments().isEmpty() ? "" : node.widget.arguments().get(0);
            canvas.text(x + 2, y + 4, String.valueOf(label), theme.color("text"));
            return;
        }
        if ("Scrollbar".equals(type)) {
            bevel(canvas, x, y, box.width, box.height, theme, false, null);
            thumb(canvas, node, theme, x, y, box);
            return;
        }
        if ("MachinePanel".equals(type)) {
            bevel(canvas, x, y, box.width, box.height, theme, false, null);
            return;
        }
        String border = StyleMetrics.parse(node.widget.className(), HostRenderer.flags(node)).border;
        if (border != null && !border.isEmpty()) bevel(canvas, x, y, box.width, box.height, theme, true, null);
    }

    static void bevel(HostCanvas canvas, int x, int y, int width, int height, Theme theme, boolean raised,
            String omit) {
        if (width <= 0 || height <= 0) return;
        int light = theme.color("highlight");
        int dark = theme.color("shadow");
        int top = raised ? light : dark;
        int bottom = raised ? dark : light;
        if (!"top".equals(omit)) canvas.fill(x, y, width, 1, top);
        if (!"left".equals(omit)) canvas.fill(x, y, 1, height, top);
        if (!"bottom".equals(omit)) canvas.fill(x, y + height - 1, width, 1, bottom);
        if (!"right".equals(omit)) canvas.fill(x + width - 1, y, 1, height, bottom);
    }

    private static String innerEdge(LayoutNode node) {
        Object side = node.widget.prop("side");
        if ("right".equals(side)) return "left";
        if ("top".equals(side)) return "bottom";
        if ("bottom".equals(side)) return "top";
        return "right";
    }

    private static void thumb(HostCanvas canvas, LayoutNode node, Theme theme, int x, int y, Rect box) {
        int max = Math.max(1, number(node.widget.prop("max"), 1));
        int value = Math.min(max, Math.max(0, number(node.widget.prop("value"), 0)));
        int innerH = Math.max(1, box.height - 2);
        int thumbH = Math.min(innerH, Math.max(4, innerH / (max + 1)));
        int ty = y + 1 + ((innerH - thumbH) * value / max);
        canvas.fill(x + 1, ty, Math.max(1, box.width - 2), thumbH, theme.color("button"));
    }

    private static boolean hasValue(LayoutNode node) {
        Object value = node.widget.prop("value");
        return value != null && !String.valueOf(value).isEmpty();
    }

    private static String label(LayoutNode node) {
        if (hasValue(node)) return String.valueOf(node.widget.prop("value"));
        Object placeholder = node.widget.prop("placeholder");
        return placeholder == null ? "" : String.valueOf(placeholder);
    }

    private static int number(Object value, int fallback) {
        if (!(value instanceof Number)) return fallback;
        return ((Number) value).intValue();
    }
}
