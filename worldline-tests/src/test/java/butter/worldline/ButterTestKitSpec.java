package butter.worldline;

import butter.compiler.ButterCompiler;
import butter.compiler.ButterFormatter;
import butter.core.WidgetSpec;
import butter.runtime.ButterRuntime;
import butter.testing.ButterUi;
import worldline.test.WorldlineSpec;
import static worldline.test.Expect.expect;
import static worldline.test.Worldline.describe;
import static worldline.test.Worldline.test;

/** External TestKit consumer: no Worldline repository classes are compiled from source. */
public final class ButterTestKitSpec extends WorldlineSpec {
    @Override protected void define() {
        describe("Butter authoring", () -> {
            test("formats a template", context -> expect(ButterFormatter.format(
                    "Button.butter", "Button(\"Craft\",id:\"craft\")"))
                    .toEqual("Button(\"Craft\", id: \"craft\")\n"));
            test("compiles a semantic button", context -> {
                WidgetSpec spec = ButterCompiler.compileSource("Button.butter",
                        "Button(\"Craft\", id: \"craft\")", null);
                expect(ButterUi.of(ButterRuntime.mount(spec, null)).getById("craft").role())
                        .toEqual("button");
            });
            test("exports a stable screen", context -> {
                WidgetSpec spec = ButterCompiler.compileSource("Panel.butter",
                        "Column(children: [Text(\"Status\", id: \"status\")])", null);
                expect(ButterUi.of("panel", ButterRuntime.mount(spec, null)).screen()).toEqual("panel");
            });
        });
    }
}
