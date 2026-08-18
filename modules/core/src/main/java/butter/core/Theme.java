package butter.core;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/** Fail-closed color, slot, and font catalog for utility tokens. */
public final class Theme {
    private static final Theme STANDARD = vanilla();
    private final String id;
    private final Map<String, Integer> colors;
    private final Map<String, String> slots;
    private final Map<String, String> fonts;

    public Theme(String id, Map<String, Integer> colors, Map<String, String> slots,
            Map<String, String> fonts) {
        if (id == null || id.trim().isEmpty()) throw new IllegalArgumentException("theme id");
        this.id = id.trim();
        this.colors = copyInts(colors);
        this.slots = copyStrings(slots);
        this.fonts = copyStrings(fonts);
    }

    public static Theme standard() { return STANDARD; }

    public String id() { return id; }

    public boolean hasColor(String name) { return colors.containsKey(name); }

    public boolean hasSlot(String name) { return slots.containsKey(name); }

    public boolean hasFont(String name) { return fonts.containsKey(name); }

    public int color(String name) {
        Integer value = colors.get(name);
        if (value == null) throw new IllegalStateException("unknown theme color " + name);
        return value.intValue();
    }

    public String slot(String name) {
        String value = slots.get(name);
        if (value == null) throw new IllegalStateException("unknown theme slot " + name);
        return value;
    }

    public Theme extend(Theme overlay) {
        if (overlay == null) return this;
        Map<String, Integer> nextColors = new LinkedHashMap<String, Integer>(colors);
        nextColors.putAll(overlay.colors);
        Map<String, String> nextSlots = new LinkedHashMap<String, String>(slots);
        nextSlots.putAll(overlay.slots);
        Map<String, String> nextFonts = new LinkedHashMap<String, String>(fonts);
        nextFonts.putAll(overlay.fonts);
        return new Theme(overlay.id, nextColors, nextSlots, nextFonts);
    }

    private static Theme vanilla() {
        Map<String, Integer> colors = new LinkedHashMap<String, Integer>();
        colors.put("panel", Integer.valueOf(0xFF2B2B2B));
        colors.put("accent", Integer.valueOf(0xFF3D6B9A));
        colors.put("tooltip", Integer.valueOf(0xFF1A1A1A));
        colors.put("vanilla", Integer.valueOf(0xFF8B8B8B));
        colors.put("button", Integer.valueOf(0xFF8B8B8B));
        colors.put("text", Integer.valueOf(0xFFFFFFFF));
        colors.put("energy", Integer.valueOf(0xFF44CC44));
        colors.put("slot", Integer.valueOf(0xFF1A1A1A));
        colors.put("highlight", Integer.valueOf(0xFFFFFFFF));
        colors.put("shadow", Integer.valueOf(0xFF555555));
        colors.put("border", Integer.valueOf(0xFF000000));
        colors.put("muted", Integer.valueOf(0xFFA0A0A0));
        Map<String, String> slots = new LinkedHashMap<String, String>();
        slots.put("vanilla", "gui/slot.png");
        return new Theme("vanilla", colors, slots, Collections.<String, String>emptyMap());
    }

    private static Map<String, Integer> copyInts(Map<String, Integer> source) {
        if (source == null || source.isEmpty()) return Collections.emptyMap();
        return Collections.unmodifiableMap(new LinkedHashMap<String, Integer>(source));
    }

    private static Map<String, String> copyStrings(Map<String, String> source) {
        if (source == null || source.isEmpty()) return Collections.emptyMap();
        return Collections.unmodifiableMap(new LinkedHashMap<String, String>(source));
    }
}
