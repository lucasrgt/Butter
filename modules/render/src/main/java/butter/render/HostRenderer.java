package butter.render;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import butter.core.Theme;
import butter.layout.LayoutNode;
import butter.layout.Rect;

/** Paints a laid-out tree onto a host canvas. */
public final class HostRenderer {
    public static final int PANEL = 0xFF2B2B2B;
    public static final int ACCENT = 0xFF3D6B9A;
    public static final int TEXT = 0xFFFFFFFF;
    public static final int BUTTON = 0xFF8B8B8B;
    public static final int ENERGY = 0xFF44CC44;
    private final Map<String, NativePainter> natives = new LinkedHashMap<String, NativePainter>();
    private final Theme theme;

    public HostRenderer() { this(Theme.standard()); }

    public HostRenderer(Theme theme) {
        this.theme = Theme.standard().extend(theme == null ? Theme.standard() : theme);
    }

    static {
        Theme vanilla = Theme.standard();
        if (PANEL != vanilla.color("panel") || ACCENT != vanilla.color("accent")
                || TEXT != vanilla.color("text") || BUTTON != vanilla.color("button")
                || ENERGY != vanilla.color("energy")) {
            throw new IllegalStateException("vanilla theme colors drifted");
        }
    }

    public void register(String type, NativePainter painter) { natives.put(type, painter); }

    public void paint(LayoutNode node, HostCanvas canvas) { paint(node, canvas, 0, 0); }

    private void paint(LayoutNode node, HostCanvas canvas, int ox, int oy) {
        Rect box = node.bounds;
        int x = ox + box.x;
        int y = oy + box.y;
        NativePainter painter = natives.get(node.widget.type());
        if (painter != null) {
            painter.paint(canvas, new Rect(x, y, box.width, box.height), node);
            return;
        }
        fill(canvas, node, x, y, box);
        HostMarks.paint(canvas, node, theme, x, y, box);
        VanillaChrome.decorate(canvas, node, theme, x, y, box);
        List<LayoutNode> children = node.children;
        for (int index = 0; index < children.size(); index++) paint(children.get(index), canvas, x, y);
    }

    private void fill(HostCanvas canvas, LayoutNode node, int x, int y, Rect box) {
        String type = node.widget.type();
        String flags = flags(node);
        String bg = butter.layout.StyleMetrics.parse(node.widget.className(), flags, theme).background;
        int color = fillColor(node, bg);
        if (Boolean.FALSE.equals(node.widget.prop("enabled")) && (bg == null || bg.isEmpty())) {
            color = theme.color("muted");
        }
        if (color != 0) canvas.fill(x, y, box.width, box.height, color);
        if ("EnergyBar".equals(type) || "ProgressBar".equals(type)) {
            canvas.fill(x, y, Math.max(1, barWidth(node, box.width)), box.height, theme.color("energy"));
        } else if ("Text".equals(type) || "Tooltip".equals(type)) {
            HostText.paint(canvas, node, theme, x, y);
        } else if ("Slot".equals(type)) slotGlyph(canvas, node, x, y);
    }

    private int fillColor(LayoutNode node, String bg) {
        String type = node.widget.type();
        if (bg != null && !bg.isEmpty()) return theme.color(bg);
        if ("Tab".equals(type)) {
            return Boolean.TRUE.equals(node.widget.prop("selected")) ? theme.color("panel") : theme.color("button");
        }
        if ("Button".equals(type)) return theme.color("button");
        if ("Panel".equals(type) || "Column".equals(type)) return theme.color("panel");
        if ("EnergyBar".equals(type) || "ProgressBar".equals(type)) return theme.color("panel");
        if ("SearchBar".equals(type)) {
            return theme.hasColor("search") ? theme.color("search") : theme.color("slot");
        }
        if ("Slot".equals(type) || "FluidTank".equals(type) || "Scrollbar".equals(type)
                || "Slider".equals(type) || "Flame".equals(type) || "Checkbox".equals(type)
                || "Toggle".equals(type) || "Radio".equals(type)) return theme.color("slot");
        if ("MachinePanel".equals(type) || "RecipeProgress".equals(type)) return theme.color("panel");
        if ("Separator".equals(type)) return theme.color("shadow");
        return 0;
    }

    static String flags(LayoutNode node) {
        StringBuilder flags = new StringBuilder();
        if (Boolean.TRUE.equals(node.widget.prop("hover"))) flags.append("hover ");
        if (Boolean.TRUE.equals(node.widget.prop("focused"))) flags.append("focus ");
        if (Boolean.FALSE.equals(node.widget.prop("enabled"))) flags.append("disabled ");
        if (Boolean.TRUE.equals(node.widget.prop("selected"))) flags.append("selected ");
        Object item = node.widget.prop("item");
        Object count = node.widget.prop("count");
        if (item instanceof Number || (count instanceof Number && ((Number) count).intValue() > 0)) {
            flags.append("occupied ");
        }
        return flags.toString();
    }

    private static int barWidth(LayoutNode node, int width) {
        Object value = node.widget.prop("value");
        Object max = node.widget.prop("max");
        if (!(value instanceof Number) || !(max instanceof Number)) return width / 2;
        double maximum = ((Number) max).doubleValue();
        if (maximum <= 0) return 0;
        return (int) Math.round(width * ((Number) value).doubleValue() / maximum);
    }

    private void slotGlyph(HostCanvas canvas, LayoutNode node, int x, int y) {
        Object item = node.widget.prop("item");
        Object count = node.widget.prop("count");
        if (item instanceof Number) canvas.text(x + 1, y + 1, String.valueOf(item), theme.color("text"));
        else if (count instanceof Number && ((Number) count).intValue() > 0)
            canvas.text(x + 1, y + 1, String.valueOf(count), theme.color("text"));
    }
}
