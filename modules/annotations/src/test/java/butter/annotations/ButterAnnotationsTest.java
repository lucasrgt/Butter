package butter.annotations;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

public final class ButterAnnotationsTest {
    private ButterAnnotationsTest() {}

    public static void main(String[] arguments) {
        Retention component = ButterComponent.class.getAnnotation(Retention.class);
        Retention action = ButterAction.class.getAnnotation(Retention.class);
        require(component != null && component.value() == RetentionPolicy.RUNTIME, "component retention");
        require(action != null && action.value() == RetentionPolicy.RUNTIME, "action retention");
        ButterComponent annotation = Sample.class.getAnnotation(ButterComponent.class);
        require(annotation != null && annotation.template().equals("panel.butter"), "template pairing");
        boolean found = false;
        java.lang.reflect.Method[] methods = Sample.class.getDeclaredMethods();
        for (int index = 0; index < methods.length; index++) {
            if ("craft".equals(methods[index].getName())
                    && methods[index].getAnnotation(ButterAction.class) != null) found = true;
        }
        require(found, "action");
        System.out.println("  annotations: pairing contract");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }

    @ButterComponent(template = "panel.butter")
    public static final class Sample {
        @ButterAction public void craft() {}
    }
}
