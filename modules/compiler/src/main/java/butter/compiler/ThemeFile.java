package butter.compiler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import butter.core.Theme;

/** Fail-closed TOML subset: `id`, `[colors]`, `[slots]`, `[fonts]`, quoted strings. */
public final class ThemeFile {
    private ThemeFile() {}

    public static Theme load(Path path) {
        if (path == null || !Files.isRegularFile(path)) {
            throw fail("B1701", "Missing theme file", path == null ? "" : path.toString(), 0);
        }
        try {
            return parse(path.getFileName().toString(),
                    new String(Files.readAllBytes(path), StandardCharsets.UTF_8));
        } catch (IOException error) {
            throw fail("B1701", error.getMessage(), path.getFileName().toString(), 0);
        }
    }

    public static Theme parse(String fileName, String source) {
        if (source == null) throw fail("B1702", "Empty theme", fileName, 1);
        String id = "";
        Map<String, Integer> colors = new LinkedHashMap<String, Integer>();
        Map<String, String> slots = new LinkedHashMap<String, String>();
        Map<String, String> fonts = new LinkedHashMap<String, String>();
        String table = "";
        String[] lines = source.split("\n", -1);
        for (int index = 0; index < lines.length; index++) {
            int line = index + 1;
            String text = stripComment(lines[index].replace("\r", "")).trim();
            if (text.isEmpty()) continue;
            if (text.startsWith("[[")) throw fail("B1701", "Arrays of tables are not supported", fileName, line);
            if (text.startsWith("[")) {
                table = tableName(text, fileName, line);
                continue;
            }
            id = put(fileName, line, table, text, id, colors, slots, fonts);
        }
        if (id.isEmpty()) throw fail("B1702", "Missing theme id", fileName, 1);
        return new Theme(id, colors, slots, fonts);
    }

    private static String put(String file, int line, String table, String text, String id,
            Map<String, Integer> colors, Map<String, String> slots, Map<String, String> fonts) {
        int eq = text.indexOf('=');
        if (eq < 1) throw fail("B1705", "Expected key = \"value\"", file, line);
        String key = text.substring(0, eq).trim();
        String value = quoted(text.substring(eq + 1).trim(), file, line);
        if (!key.matches("[a-z][a-z0-9-]*")) throw fail("B1705", "Invalid key", file, line);
        if ("id".equals(key)) {
            if (!table.isEmpty()) throw fail("B1705", "id must be top-level", file, line);
            if (!id.isEmpty()) throw fail("B1703", "Duplicate key", file, line);
            return value;
        }
        if (table.isEmpty()) throw fail("B1705", "Unknown top-level key", file, line);
        if ("colors".equals(table)) putUnique(colors, key, Integer.valueOf(parseHex(value, file, line)), file, line);
        else if ("slots".equals(table)) putUnique(slots, key, value, file, line);
        else putUnique(fonts, key, value, file, line);
        return id;
    }

    private static String tableName(String text, String file, int line) {
        if (!text.endsWith("]")) throw fail("B1701", "Invalid table", file, line);
        String name = text.substring(1, text.length() - 1).trim();
        if (!"colors".equals(name) && !"slots".equals(name) && !"fonts".equals(name)) {
            throw fail("B1701", "Unknown table", file, line);
        }
        return name;
    }

    private static int parseHex(String value, String file, int line) {
        boolean rgb = value.length() == 7;
        boolean argb = value.length() == 9;
        if ((!rgb && !argb) || value.charAt(0) != '#') {
            throw fail("B1704", "Expected #RRGGBB or #AARRGGBB", file, line);
        }
        for (int index = 1; index < value.length(); index++) {
            if (Character.digit(value.charAt(index), 16) < 0) {
                throw fail("B1704", "Expected #RRGGBB or #AARRGGBB", file, line);
            }
        }
        long parsed = Long.parseLong(value.substring(1), 16);
        if (rgb) return 0xFF000000 | (int) parsed;
        return (int) parsed;
    }

    private static String quoted(String text, String file, int line) {
        if (text.length() < 2 || text.charAt(0) != '"') throw fail("B1705", "Expected string", file, line);
        StringBuilder out = new StringBuilder();
        boolean escaped = false;
        for (int index = 1; index < text.length(); index++) {
            char current = text.charAt(index);
            if (escaped) {
                if (current != '"' && current != '\\') throw fail("B1705", "Invalid escape", file, line);
                out.append(current);
                escaped = false;
                continue;
            }
            if (current == '\\') { escaped = true; continue; }
            if (current == '"') {
                if (index != text.length() - 1) throw fail("B1705", "Trailing characters", file, line);
                return out.toString();
            }
            out.append(current);
        }
        throw fail("B1705", "Unclosed string", file, line);
    }

    private static String stripComment(String line) {
        boolean string = false;
        for (int index = 0; index < line.length(); index++) {
            char current = line.charAt(index);
            if (current == '"' && (index == 0 || line.charAt(index - 1) != '\\')) string = !string;
            if (!string && current == '#') return line.substring(0, index);
        }
        return line;
    }

    private static <T> void putUnique(Map<String, T> map, String key, T value, String file, int line) {
        if (map.containsKey(key)) throw fail("B1703", "Duplicate key", file, line);
        map.put(key, value);
    }

    private static ButterCompileException fail(String code, String message, String file, int line) {
        return new ButterCompileException(new Diagnostic(code, message, file, null, null, null, line, 1));
    }
}
