package butter.compiler;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

public final class ButterFormatterTest {
    private ButterFormatterTest() {}

    public static void main(String[] arguments) throws Exception {
        String compact = ButterFormatter.format("Hello.butter",
                "Button(\"Craft\",id:\"craft\")");
        require(compact.equals("Button(\"Craft\", id: \"craft\")\n"), "inline spacing");
        String again = ButterFormatter.format("Hello.butter", compact);
        require(again.equals(compact), "idempotent");
        String nested = ButterFormatter.format("Card.butter",
                "public component Card(title: String, show: boolean = true) { Text(title) } Card(title: \"Reactor\")");
        require(nested.contains("public component Card(title: String, show: boolean = true)"), "params");
        require(nested.contains("Card(title: \"Reactor\")\n"), "body call");
        String[] files = {
                "examples/hello/Hello.butter",
                "examples/thaum/Research.butter",
                "examples/vanilla/Chrome.butter",
                "examples/vanilla/Furnace.butter",
                "examples/vanilla/Terminal.butter",
                "modules/reference/src/main/butter/FusionReactorPanel.butter",
                "modules/reference/src/main/butter/FuelSection.butter",
                "modules/reference/src/main/butter/ReactorControls.butter",
                "modules/reference/src/main/butter/ReactorHeader.butter",
                "modules/reference/src/main/butter/ReactorCore.butter",
                "modules/reference/src/main/butter/ContainmentPanel.butter",
                "modules/reference/src/main/butter/CoolingPanel.butter",
                "modules/reference/src/main/butter/ReactorHistory.butter"
        };
        for (int index = 0; index < files.length; index++) {
            String original = new String(Files.readAllBytes(Paths.get(files[index])), StandardCharsets.UTF_8)
                    .replace("\r\n", "\n");
            String formatted = ButterFormatter.format(files[index].substring(files[index].lastIndexOf('/') + 1),
                    original);
            require(formatted.equals(ButterFormatter.format("again.butter", formatted)), files[index] + " idemp");
            require(formatted.equals(original), files[index] + " canonical");
        }
        try {
            ButterFormatter.format("Bad.butter", "???");
            throw new IllegalStateException("invalid must fail");
        } catch (ButterCompileException error) {
            require(error.getMessage().contains("B1001"), "fail closed");
        }
        System.out.println("  compiler: format");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
}
