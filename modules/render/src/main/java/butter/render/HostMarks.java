package butter.render;

import butter.core.Theme;
import butter.layout.LayoutNode;
import butter.layout.Rect;

/** Host fills for tank, flame, recipe arrow, slider, and boolean controls. */
final class HostMarks {
    private HostMarks() {}

    static void paint(HostCanvas canvas, LayoutNode node, Theme theme, int x, int y, Rect box) {
        String type = node.widget.type();
        if ("FluidTank".equals(type)) tank(canvas, node, theme, x, y, box);
        else if ("Flame".equals(type)) flame(canvas, node, theme, x, y, box);
        else if ("RecipeProgress".equals(type)) arrow(canvas, node, theme, x, y, box);
        else if ("Slider".equals(type)) slider(canvas, node, theme, x, y, box);
        else if ("Checkbox".equals(type) || "Radio".equals(type)) check(canvas, node, theme, x, y, box);
        else if ("Toggle".equals(type)) toggle(canvas, node, theme, x, y, box);
        else if ("Slot".equals(type) && occupied(node)) {
            VanillaChrome.bevel(canvas, x, y, box.width, box.height, theme, false, null);
        }
    }

    private static void tank(HostCanvas canvas, LayoutNode node, Theme theme, int x, int y, Rect box) {
        int fill = fillHeight(node, box.height);
        if (fill <= 0) return;
        canvas.fill(x + 1, y + box.height - fill, Math.max(1, box.width - 2), fill, theme.color("accent"));
    }

    private static void flame(HostCanvas canvas, LayoutNode node, Theme theme, int x, int y, Rect box) {
        int fill = fillHeight(node, box.height);
        if (fill <= 0) return;
        int top = y + box.height - fill;
        canvas.fill(x + 3, top, Math.max(1, box.width - 6), fill, theme.color("energy"));
        canvas.fill(x + 5, Math.max(y, top - 2), Math.max(1, box.width - 10), 2, theme.color("energy"));
    }

    private static void arrow(HostCanvas canvas, LayoutNode node, Theme theme, int x, int y, Rect box) {
        int width = Math.max(1, barWidth(node, box.width));
        int mid = y + box.height / 2;
        canvas.fill(x, mid - 2, Math.max(1, width - 4), 4, theme.color("energy"));
        int tip = x + width - 1;
        int head = Math.min(6, box.height / 2);
        for (int index = 0; index < head; index++) {
            canvas.fill(tip - head + index, mid - index, 1, 1 + index * 2, theme.color("energy"));
        }
    }

    private static void slider(HostCanvas canvas, LayoutNode node, Theme theme, int x, int y, Rect box) {
        int mid = y + box.height / 2;
        canvas.fill(x, mid, box.width, 2, theme.color("shadow"));
        int max = Math.max(1, number(node.widget.prop("max"), 1));
        int value = Math.min(max, Math.max(0, number(node.widget.prop("value"), 0)));
        int tx = x + (box.width - 4) * value / max;
        canvas.fill(tx, y, 4, box.height, theme.color("button"));
    }

    private static void check(HostCanvas canvas, LayoutNode node, Theme theme, int x, int y, Rect box) {
        VanillaChrome.bevel(canvas, x, y, box.width, box.height, theme, false, null);
        if (on(node)) canvas.fill(x + 2, y + 2, Math.max(1, box.width - 4), Math.max(1, box.height - 4),
                theme.color("accent"));
    }

    private static void toggle(HostCanvas canvas, LayoutNode node, Theme theme, int x, int y, Rect box) {
        VanillaChrome.bevel(canvas, x, y, box.width, box.height, theme, false, null);
        boolean on = on(node);
        int thumb = Math.max(4, box.width / 2);
        canvas.fill(on ? x + box.width - thumb - 1 : x + 1, y + 1, thumb, Math.max(1, box.height - 2),
                on ? theme.color("accent") : theme.color("button"));
    }

    private static boolean occupied(LayoutNode node) {
        Object item = node.widget.prop("item");
        Object count = node.widget.prop("count");
        return item instanceof Number || (count instanceof Number && ((Number) count).intValue() > 0);
    }

    private static boolean on(LayoutNode node) {
        return Boolean.TRUE.equals(node.widget.prop("value")) || Boolean.TRUE.equals(node.widget.prop("selected"));
    }

    private static int fillHeight(LayoutNode node, int height) {
        return Math.max(0, Math.min(height, barWidth(node, height)));
    }

    private static int barWidth(LayoutNode node, int width) {
        Object value = node.widget.prop("value");
        Object max = node.widget.prop("max");
        if (!(value instanceof Number) || !(max instanceof Number)) return width / 2;
        double maximum = ((Number) max).doubleValue();
        if (maximum <= 0) return 0;
        return (int) Math.round(width * ((Number) value).doubleValue() / maximum);
    }

    private static int number(Object value, int fallback) {
        return value instanceof Number ? ((Number) value).intValue() : fallback;
    }
}
