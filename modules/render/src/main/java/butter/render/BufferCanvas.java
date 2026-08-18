package butter.render;

/** Deterministic ARGB framebuffer used by tests and as the host oracle. */
public final class BufferCanvas implements HostCanvas {
    private final int width;
    private final int height;
    private final int[] pixels;

    public BufferCanvas(int width, int height) {
        this.width = width;
        this.height = height;
        this.pixels = new int[width * height];
    }

    public int width() { return width; }
    public int height() { return height; }
    public int[] pixels() { return pixels; }

    public void fill(int x, int y, int rectWidth, int rectHeight, int argb) {
        for (int row = y; row < y + rectHeight; row++) {
            if (row < 0 || row >= height) continue;
            for (int column = x; column < x + rectWidth; column++) {
                if (column < 0 || column >= width) continue;
                pixels[row * width + column] = argb;
            }
        }
    }

    public void text(int x, int y, String value, int argb) {
        if (value == null) return;
        fill(x, y, Math.max(1, value.length() * 6), 8, argb);
    }

    public int sample(int x, int y) {
        if (x < 0 || y < 0 || x >= width || y >= height) return 0;
        return pixels[y * width + x];
    }
}
