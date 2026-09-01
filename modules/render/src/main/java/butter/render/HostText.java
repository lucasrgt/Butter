package butter.render;

import butter.core.Theme;
import butter.layout.LayoutNode;
import butter.layout.StyleMetrics;

/** Host glyph paint for Text/Tooltip. Mapped GuiScreen still uses default font. */
final class HostText {
    private HostText() {}

    static void paint(HostCanvas canvas, LayoutNode node, Theme theme, int x, int y) {
        StyleMetrics style = StyleMetrics.parse(node.widget.className(), HostRenderer.flags(node), theme);
        Object label = node.widget.arguments().isEmpty() ? "" : node.widget.arguments().get(0);
        String text = String.valueOf(label);
        int color = style.ink.isEmpty() ? theme.color("text") : theme.color(style.ink);
        if (Boolean.FALSE.equals(node.widget.prop("enabled"))) color = theme.color("muted");
        int inner = Math.max(1, node.bounds.width - style.padX());
        if (style.box.truncate) text = ellipsis(text, inner, style);
        int ox = x + 2;
        int oy = y + 2;
        if (style.box.wrap && style.charWidth > 0) {
            int cols = Math.max(1, inner / style.charWidth);
            for (int line = 0; line * cols < text.length(); line++) {
                int end = Math.min(text.length(), (line + 1) * cols);
                draw(canvas, theme, style, ox, oy + line * style.charHeight, text.substring(line * cols, end), color);
            }
            return;
        }
        draw(canvas, theme, style, ox, oy, text, color);
    }

    private static void draw(HostCanvas canvas, Theme theme, StyleMetrics style, int ox, int oy, String text,
            int color) {
        if (style.textShadow) {
            canvas.text(ox + 1, oy + 1, text, theme.color("shadow"), style.charWidth, style.charHeight);
        }
        canvas.text(ox, oy, text, color, style.charWidth, style.charHeight);
        if (style.fontBold) canvas.text(ox + 1, oy, text, color, style.charWidth, style.charHeight);
    }

    private static String ellipsis(String text, int inner, StyleMetrics style) {
        int max = Math.max(1, inner / Math.max(1, style.charWidth));
        if (text.length() <= max) return text;
        if (max <= 3) return text.substring(0, max);
        return text.substring(0, max - 3) + "...";
    }
}
