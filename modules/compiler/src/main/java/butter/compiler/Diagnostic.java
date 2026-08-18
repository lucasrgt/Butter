package butter.compiler;

/** Fail-closed compiler diagnostic. Printed as BUTTER B#### blocks. */
public final class Diagnostic {
    public final String code;
    public final String message;
    public final String component;
    public final String property;
    public final String expected;
    public final String received;
    public final int line;
    public final int column;

    public Diagnostic(String code, String message, String component, String property,
            String expected, String received, int line, int column) {
        this.code = code;
        this.message = message;
        this.component = component;
        this.property = property;
        this.expected = expected;
        this.received = received;
        this.line = line;
        this.column = column;
    }

    public String format() {
        StringBuilder text = new StringBuilder();
        text.append("BUTTER ").append(code).append('\n').append(message);
        if (component != null) text.append("\nComponent: ").append(component);
        if (property != null) text.append("\nProperty: ").append(property);
        if (expected != null) text.append("\nExpected: ").append(expected);
        if (received != null) text.append("\nReceived: ").append(received);
        if (line > 0) text.append("\nLine: ").append(line).append(':').append(column);
        return text.toString();
    }
}
