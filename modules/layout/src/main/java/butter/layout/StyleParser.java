package butter.layout;

import java.util.LinkedHashSet;
import java.util.Set;
import butter.core.Theme;

final class StyleParser {
    private StyleParser() {}

    static StyleMetrics parse(String className, String flags, Theme theme) {
        int padLeft = 0, padRight = 0, padTop = 0, padBottom = 0, gap = 0, width = 0, height = 0, gridCols = 0;
        int gapX = 0, gapY = 0, marginLeft = 0, marginRight = 0, marginTop = 0, marginBottom = 0;
        int charWidth = StyleMetrics.CHAR_W, charHeight = StyleMetrics.CHAR_H;
        boolean widthFull = false, heightFull = false, grow = false, wrap = false, truncate = false, slotLg = false;
        boolean fontBold = false, textShadow = false;
        String items = "start";
        String justify = "start";
        String background = "";
        String border = "";
        String ink = "";
        Set<String> active = active(flags);
        if (className != null && !className.trim().isEmpty()) {
            String[] tokens = className.trim().split("\\s+");
            for (int index = 0; index < tokens.length; index++) {
                String token = body(tokens[index], active);
                if (token == null) continue;
                if (token.startsWith("font-") && !token.equals("font-bold") && !token.equals("font-normal")
                        && theme.hasFont(token.substring(5))) {
                    String mapped = theme.font(token.substring(5));
                    charWidth = Math.max(charWidth, size(mapped, true));
                    charHeight = Math.max(charHeight, size(mapped, false));
                    if (mapped.contains("font-bold")) fontBold = true;
                    if (mapped.contains("text-shadow")) textShadow = true;
                    String fontInk = inkOf(mapped, theme);
                    if (!fontInk.isEmpty()) ink = fontInk;
                    continue;
                }
                if (token.equals("w-full")) widthFull = true;
                else if (token.equals("h-full")) heightFull = true;
                else if (token.equals("grow")) grow = true;
                else if (token.equals("wrap")) wrap = true;
                else if (token.equals("truncate")) truncate = true;
                else if (token.equals("slot-lg")) slotLg = true;
                else if (token.startsWith("items-")) items = token.substring(6);
                else if (token.startsWith("justify-")) justify = token.substring(8);
                else if (token.startsWith("bg-")) background = token.substring(3);
                else if (token.startsWith("border-")) border = token.substring(7);
                else if (token.equals("text-xs")) { charWidth = 4; charHeight = 6; }
                else if (token.equals("text-sm")) { charWidth = 5; charHeight = 7; }
                else if (token.equals("text-base")) { charWidth = 6; charHeight = 8; }
                else if (token.equals("text-lg")) { charWidth = 8; charHeight = 10; }
                else if (token.equals("text-xl")) { charWidth = 10; charHeight = 12; }
                else if (token.equals("text-shadow")) textShadow = true;
                else if (token.startsWith("text-")) ink = token.substring(5);
                else if (token.equals("font-bold")) fontBold = true;
                else if (token.equals("font-normal")) fontBold = false;
                else if (token.startsWith("grid-cols-")) gridCols = number(token.substring(10));
                else if (token.startsWith("gap-x-")) gapX = number(token.substring(6));
                else if (token.startsWith("gap-y-")) gapY = number(token.substring(6));
                else if (token.startsWith("gap-")) {
                    gap = number(token.substring(4));
                    if (gapX == 0) gapX = gap;
                    if (gapY == 0) gapY = gap;
                } else if (token.startsWith("px-")) { padLeft = padRight = number(token.substring(3)); }
                else if (token.startsWith("py-")) { padTop = padBottom = number(token.substring(3)); }
                else if (token.startsWith("pt-")) padTop = number(token.substring(3));
                else if (token.startsWith("pr-")) padRight = number(token.substring(3));
                else if (token.startsWith("pb-")) padBottom = number(token.substring(3));
                else if (token.startsWith("pl-")) padLeft = number(token.substring(3));
                else if (token.startsWith("p-")) {
                    int value = number(token.substring(2));
                    padLeft = padRight = padTop = padBottom = value;
                } else if (token.startsWith("mx-")) { marginLeft = marginRight = number(token.substring(3)); }
                else if (token.startsWith("my-")) { marginTop = marginBottom = number(token.substring(3)); }
                else if (token.startsWith("mt-")) marginTop = number(token.substring(3));
                else if (token.startsWith("mr-")) marginRight = number(token.substring(3));
                else if (token.startsWith("mb-")) marginBottom = number(token.substring(3));
                else if (token.startsWith("ml-")) marginLeft = number(token.substring(3));
                else if (token.startsWith("m-")) {
                    int value = number(token.substring(2));
                    marginLeft = marginRight = marginTop = marginBottom = value;
                } else if (token.startsWith("w-") && !token.equals("w-full")) width = number(token.substring(2));
                else if (token.startsWith("h-") && !token.equals("h-full")) height = number(token.substring(2));
            }
        }
        if (gapX == 0) gapX = gap;
        if (gapY == 0) gapY = gap;
        StyleBox box = new StyleBox(gapX, gapY, marginLeft, marginRight, marginTop, marginBottom,
                heightFull, grow, wrap, truncate, slotLg);
        return new StyleMetrics(padLeft, padRight, padTop, padBottom, gap, width, height, widthFull,
                gridCols, items, justify, background, border, charWidth, charHeight, fontBold, textShadow, ink, box);
    }

    private static String body(String token, Set<String> active) {
        int colon = token.lastIndexOf(':');
        if (colon < 0) return token;
        String[] parts = token.split(":");
        for (int index = 0; index < parts.length - 1; index++) {
            if (!active.contains(parts[index])) return null;
        }
        return parts[parts.length - 1];
    }

    private static Set<String> active(String flags) {
        Set<String> values = new LinkedHashSet<String>();
        if (flags == null || flags.trim().isEmpty()) return values;
        String[] parts = flags.trim().split("\\s+");
        for (int index = 0; index < parts.length; index++) values.add(parts[index]);
        return values;
    }

    private static int size(String value, boolean width) {
        if (value.contains("text-xl")) return width ? 10 : 12;
        if (value.contains("text-lg")) return width ? 8 : 10;
        if (value.contains("text-sm")) return width ? 5 : 7;
        if (value.contains("text-xs")) return width ? 4 : 6;
        return width ? StyleMetrics.CHAR_W : StyleMetrics.CHAR_H;
    }

    private static String inkOf(String value, Theme theme) {
        String[] tokens = value.trim().split("\\s+");
        for (int index = 0; index < tokens.length; index++) {
            if (tokens[index].startsWith("text-") && theme.hasColor(tokens[index].substring(5))) {
                return tokens[index].substring(5);
            }
        }
        return "";
    }

    private static int number(String text) {
        try { return Integer.parseInt(text); }
        catch (NumberFormatException error) { return 0; }
    }
}
