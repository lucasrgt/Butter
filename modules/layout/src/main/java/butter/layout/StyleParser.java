package butter.layout;

final class StyleParser {
    private StyleParser() {}

    static StyleMetrics parse(String className) {
        int padLeft = 0, padRight = 0, padTop = 0, padBottom = 0, gap = 0, width = 0, height = 0, gridCols = 0;
        boolean widthFull = false;
        String items = "start";
        String justify = "start";
        String background = "";
        if (className == null || className.trim().isEmpty()) {
            return new StyleMetrics(0, 0, 0, 0, 0, 0, 0, false, 0, items, justify, background);
        }
        String[] tokens = className.trim().split("\\s+");
        for (int index = 0; index < tokens.length; index++) {
            String token = strip(tokens[index]);
            if (token.equals("w-full")) widthFull = true;
            else if (token.startsWith("items-")) items = token.substring(6);
            else if (token.startsWith("justify-")) justify = token.substring(8);
            else if (token.startsWith("bg-")) background = token.substring(3);
            else if (token.startsWith("grid-cols-")) gridCols = number(token.substring(10));
            else if (token.startsWith("gap-")) gap = number(token.substring(4));
            else if (token.startsWith("px-")) { padLeft = padRight = number(token.substring(3)); }
            else if (token.startsWith("py-")) { padTop = padBottom = number(token.substring(3)); }
            else if (token.startsWith("pt-")) padTop = number(token.substring(3));
            else if (token.startsWith("pr-")) padRight = number(token.substring(3));
            else if (token.startsWith("pb-")) padBottom = number(token.substring(3));
            else if (token.startsWith("pl-")) padLeft = number(token.substring(3));
            else if (token.startsWith("p-")) {
                int value = number(token.substring(2));
                padLeft = padRight = padTop = padBottom = value;
            } else if (token.startsWith("w-") && !token.equals("w-full")) width = number(token.substring(2));
            else if (token.startsWith("h-") && !token.equals("h-full")) height = number(token.substring(2));
        }
        return new StyleMetrics(padLeft, padRight, padTop, padBottom, gap, width, height, widthFull,
                gridCols, items, justify, background);
    }

    private static String strip(String token) {
        int colon = token.lastIndexOf(':');
        return colon < 0 ? token : token.substring(colon + 1);
    }

    private static int number(String text) {
        try { return Integer.parseInt(text); }
        catch (NumberFormatException error) { return 0; }
    }
}
