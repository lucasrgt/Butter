package butter.core;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/** Fail-closed utility token catalog. Unknown classes are compile errors. */
public final class Utilities {
    private static final Set<String> VARIANTS = new LinkedHashSet<String>(Arrays.asList(
            "hover", "focus", "disabled", "selected", "occupied", "tiny", "compact", "normal", "wide"));
    private static final Set<String> LITERALS = new LinkedHashSet<String>(Arrays.asList(
            "grow", "shrink", "w-full", "h-full", "text-shadow", "font-bold", "font-normal",
            "text-lg", "text-sm", "text-xs", "text-base", "text-xl", "wrap", "truncate", "slot-lg",
            "items-center", "items-start", "items-end", "items-stretch",
            "justify-between", "justify-center", "justify-start", "justify-end"));
    private static final Pattern SPACED = Pattern.compile(
            "^(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|w|h)-\\d+$");
    private static final Pattern GRID = Pattern.compile("^grid-cols-\\d+$");

    private Utilities() {}

    public static List<String> unknownTokens(String className) {
        return unknownTokens(className, Theme.standard());
    }

    public static List<String> unknownTokens(String className, Theme theme) {
        if (className == null || className.trim().isEmpty()) return Collections.emptyList();
        Theme catalog = theme == null ? Theme.standard() : theme;
        List<String> unknown = new ArrayList<String>();
        String[] tokens = className.trim().split("\\s+");
        for (int index = 0; index < tokens.length; index++) {
            if (!known(stripVariants(tokens[index]), catalog)) unknown.add(tokens[index]);
        }
        return unknown;
    }

    static String stripVariants(String token) {
        int colon = token.lastIndexOf(':');
        if (colon < 0) return token;
        String[] parts = token.split(":");
        for (int index = 0; index < parts.length - 1; index++) {
            if (!VARIANTS.contains(parts[index])) return token;
        }
        return parts[parts.length - 1];
    }

    static boolean known(String token, Theme theme) {
        if (LITERALS.contains(token) || SPACED.matcher(token).matches() || GRID.matcher(token).matches()) {
            return true;
        }
        if (token.startsWith("bg-") || token.startsWith("border-")) {
            return theme.hasColor(token.substring(token.indexOf('-') + 1));
        }
        if (token.startsWith("text-") && theme.hasColor(token.substring(5))) return true;
        if (token.startsWith("font-") && theme.hasFont(token.substring(5))) return true;
        return token.startsWith("slot-") && theme.hasSlot(token.substring(5));
    }
}
