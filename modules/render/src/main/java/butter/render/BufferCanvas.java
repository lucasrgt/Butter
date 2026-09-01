package butter.render;

import butter.layout.StyleMetrics;

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
        text(x, y, value, argb, StyleMetrics.CHAR_W, StyleMetrics.CHAR_H);
    }

    public void text(int x, int y, String value, int argb, int charWidth, int charHeight) {
        if (value == null) return;
        int glyphW = Math.max(1, charWidth);
        int glyphH = Math.max(1, charHeight);
        fill(x, y, Math.max(1, value.length() * glyphW), glyphH, argb);
    }

    public int sample(int x, int y) {
        if (x < 0 || y < 0 || x >= width || y >= height) return 0;
        return pixels[y * width + x];
    }
}
