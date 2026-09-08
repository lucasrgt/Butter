package butter.compiler;

import java.util.List;
import java.util.Map;
import butter.core.PixelPosition;
import butter.core.WidgetSpec;

final class PixelProps {
    private PixelProps() {}

    static void check(String type, Map<String, Object> props, List<WidgetSpec> children,
            String component, List<Diagnostic> errors) {
        for (String axis : new String[] { "x", "y" }) {
            if (props.containsKey(axis) && !PixelPosition.valid(props.get(axis))) {
                errors.add(new Diagnostic("B1204", "Pixel coordinate must be an integer in [-32768, 32768]",
                        component, axis, "int", String.valueOf(props.get(axis)), 0, 0));
            }
        }
        if ("Stack".equals(type)) return;
        for (WidgetSpec child : children) {
            if (child.prop("x") != null || child.prop("y") != null) {
                errors.add(new Diagnostic("B1204", "Positioned children require a Stack parent",
                        component, "children", "Stack", type, 0, 0));
            }
        }
    }
}
