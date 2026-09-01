package butter.testing;

import java.util.List;

/**
 * Screen contract Worldline consumes by method name. Butter never depends on
 * Worldline types; the b1.7.3 adapter binds this interface reflectively.
 */
public interface HostUi {
    String screen();

    List<HostUiNode> nodes();

    void click(String name);

    void type(char ch);

    void backspace();

    void setValue(String name, int value);

    void rightClick(String name);
}
