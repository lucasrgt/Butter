package butter.minecraft;

import butter.render.HostCanvas;

/** HostCanvas bound to a live GuiScreen. */
final class MinecraftCanvas implements HostCanvas {
    private final ButterGuiScreen screen;

    MinecraftCanvas(ButterGuiScreen screen) { this.screen = screen; }

    public int width() { return screen.width > 0 ? screen.width : 427; }

    public int height() { return screen.height > 0 ? screen.height : 240; }

    public void fill(int x, int y, int width, int height, int argb) {
        screen.fill(x, y, width, height, argb);
    }

    public void text(int x, int y, String value, int argb) {
        screen.text(x, y, value, argb);
    }

    public int[] pixels() { return new int[0]; }
}
