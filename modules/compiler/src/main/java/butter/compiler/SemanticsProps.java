package butter.compiler;

import java.util.ArrayList;
import java.util.Map;
import butter.core.Binding;

final class SemanticsProps {
    private SemanticsProps() {}

    @SuppressWarnings("unchecked")
    static void literals(Map<String, Object> props) {
        Object semantics = props.get("semantics");
        if (!(semantics instanceof Map)) return;
        Map<String, Object> fields = (Map<String, Object>) semantics;
        ArrayList<Map.Entry<String, Object>> entries = new ArrayList<Map.Entry<String, Object>>(fields.entrySet());
        for (int index = 0; index < entries.size(); index++) {
            Map.Entry<String, Object> entry = entries.get(index);
            if (entry.getValue() instanceof Binding) {
                fields.put(entry.getKey(), ((Binding) entry.getValue()).path());
            }
        }
    }
}
