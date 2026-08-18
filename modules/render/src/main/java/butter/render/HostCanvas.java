package butter.render;

/** Pixel host. Minecraft later implements this with tessellation. */
public interface HostCanvas {
    int width();
    int height();
    void fill(int x, int y, int width, int height, int argb);
    void text(int x, int y, String value, int argb);
    int[] pixels();
}
