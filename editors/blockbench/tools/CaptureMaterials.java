import java.awt.image.BufferedImage;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import javax.imageio.ImageIO;

/** Captures the user's installed game/mod TextureFX; contains no game sources or assets. */
public final class CaptureMaterials {
    public static void main(String[] args) throws Exception {
        if (args.length != 1) throw new IllegalArgumentException("Expected output directory");
        Path output = Paths.get(args[0]).toAbsolutePath();
        Files.createDirectories(output);
        String[] names = {"water", "lava", "gas"};
        String[] classes = {"net.minecraft.src.TextureWaterFX", "net.minecraft.src.TextureLavaFX",
            "retronism.tile.Retronism_TextureGasOverlayFX"};
        StringBuilder manifest = new StringBuilder("{\"version\":1,\"textures\":{");
        for (int type = 0; type < classes.length; type++) {
            Class<?> implementation = Class.forName(classes[type]);
            Object effect = type == 2 ? implementation.getConstructor(int.class).newInstance(0)
                : implementation.getConstructor().newInstance();
            for (int tick = 0; tick < 200; tick++) implementation.getMethod("onTick").invoke(effect);
            BufferedImage strip = new BufferedImage(16, 16 * 64, BufferedImage.TYPE_INT_ARGB);
            for (int frame = 0; frame < 64; frame++) {
                implementation.getMethod("onTick").invoke(effect);
                byte[] data = (byte[]) implementation.getField("imageData").get(effect);
                for (int pixel = 0; pixel < 256; pixel++) {
                    int i = pixel * 4;
                    int color = (data[i + 3] & 255) << 24 | (data[i] & 255) << 16
                        | (data[i + 1] & 255) << 8 | (data[i + 2] & 255);
                    strip.setRGB(pixel % 16, frame * 16 + pixel / 16, color);
                }
            }
            Path texture = output.resolve(names[type] + ".png");
            ImageIO.write(strip, "png", texture.toFile());
            if (type > 0) manifest.append(',');
            manifest.append('"').append(names[type]).append("\":{\"path\":\"")
                .append(texture.toString().replace("\\", "/").replace("\"", "\\\""))
                .append("\",\"frames\":64,\"frame_ms\":50,\"generator\":\"")
                .append(classes[type]).append("\"}");
        }
        manifest.append("}}");
        Files.write(output.resolve("pack.json"), manifest.toString().getBytes(StandardCharsets.UTF_8));
        System.out.println(output.resolve("pack.json"));
    }
    private CaptureMaterials() { }
}
