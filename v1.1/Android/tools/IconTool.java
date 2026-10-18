import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;

/**
 * 启动图标生成器（构建期工具，不打入 APK）。
 *
 * 以 icon.png 为源，生成：
 *   mipmap-&lt;density&gt;/ic_launcher.png             传统图标（48dp 满幅）
 *   mipmap-&lt;density&gt;/ic_launcher_foreground.png    自适应图标前景（108dp 画布，居中留白）
 *   values/colors.xml                              自适应图标背景色（取样自图片四角）
 *
 * 自适应图标采用「纯色背景 + 居中前景」结构，保证在圆形/方形等任意桌面遮罩下
 * 原图构图不被裁切，适配 Android 8.0 及以上各厂商启动器。
 *
 * 用法：java IconTool.java &lt;icon.png&gt; &lt;res 目录&gt;
 */
public final class IconTool {

    /** 各密度对应的传统启动图标边长（48dp）。 */
    private static final int[] LEGACY_PX = {48, 72, 96, 144, 192};
    /** 各密度对应的自适应图标画布边长（108dp）。 */
    private static final int[] ADAPTIVE_PX = {108, 162, 216, 324, 432};
    private static final String[] DENSITIES = {"mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"};

    /** 前景在 108dp 画布中的占比：留出四周安全区，避免被桌面遮罩裁切。 */
    private static final double FOREGROUND_RATIO = 0.72;

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("用法: java IconTool.java <icon.png> <res 目录>");
            System.exit(1);
        }
        File source = new File(args[0]);
        BufferedImage src = ImageIO.read(source);
        if (src == null) {
            throw new IOException("无法解码图标图片（支持 JPEG/PNG）: " + source);
        }
        File resDir = new File(args[1]);

        for (int i = 0; i < DENSITIES.length; i++) {
            File dir = new File(resDir, "mipmap-" + DENSITIES[i]);
            writePng(cover(src, LEGACY_PX[i], LEGACY_PX[i]), new File(dir, "ic_launcher.png"));
            writePng(inset(src, ADAPTIVE_PX[i]), new File(dir, "ic_launcher_foreground.png"));
            System.out.println("[icon] mipmap-" + DENSITIES[i]
                    + " 传统 " + LEGACY_PX[i] + "px / 自适应 " + ADAPTIVE_PX[i] + "px");
        }

        String bg = String.format("#%06X", cornerColor(src) & 0xFFFFFF);
        File colors = new File(resDir, "values/colors.xml");
        colors.getParentFile().mkdirs();
        java.nio.file.Files.write(colors.toPath(),
                ("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
                        + "<resources>\n"
                        + "    <color name=\"ic_launcher_background\">" + bg + "</color>\n"
                        + "</resources>\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
        System.out.println("[icon] 自适应图标背景色 " + bg);
    }

    /** 等比缩放并居中裁切为正方形（cover 模式，不留空白）。 */
    private static BufferedImage cover(BufferedImage src, int w, int h) {
        BufferedImage out = newImage(w, h);
        Graphics2D g = out.createGraphics();
        applyHints(g);
        double scale = Math.max((double) w / src.getWidth(), (double) h / src.getHeight());
        int dw = (int) Math.round(src.getWidth() * scale);
        int dh = (int) Math.round(src.getHeight() * scale);
        g.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh, null);
        g.dispose();
        return out;
    }

    /** 生成 108dp 自适应画布：原图按比例居中，四周透明留白。 */
    private static BufferedImage inset(BufferedImage src, int canvas) {
        BufferedImage out = newImage(canvas, canvas);
        Graphics2D g = out.createGraphics();
        applyHints(g);
        int side = (int) Math.round(canvas * FOREGROUND_RATIO);
        int twin = (int) Math.round(side * (double) src.getHeight() / src.getWidth());
        g.drawImage(src, (canvas - side) / 2, (canvas - twin) / 2, side, twin, null);
        g.dispose();
        return out;
    }

    private static BufferedImage newImage(int w, int h) {
        return new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
    }

    private static void applyHints(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    }

    /** 取图片四角邻域的平均色，作为自适应图标的背景色。 */
    private static int cornerColor(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();
        int[][] corners = {{0, 0}, {w - 1, 0}, {0, h - 1}, {w - 1, h - 1}};
        long r = 0;
        long g = 0;
        long b = 0;
        int n = 0;
        for (int[] c : corners) {
            for (int dy = -4; dy <= 4; dy++) {
                for (int dx = -4; dx <= 4; dx++) {
                    int x = Math.min(Math.max(c[0] + dx, 0), w - 1);
                    int y = Math.min(Math.max(c[1] + dy, 0), h - 1);
                    int p = img.getRGB(x, y);
                    r += (p >> 16) & 0xFF;
                    g += (p >> 8) & 0xFF;
                    b += p & 0xFF;
                    n++;
                }
            }
        }
        return (0xFF << 24) | ((int) (r / n) << 16) | ((int) (g / n) << 8) | (int) (b / n);
    }

    private static void writePng(BufferedImage img, File out) throws IOException {
        File parent = out.getParentFile();
        if (parent != null) {
            parent.mkdirs();
        }
        if (!ImageIO.write(img, "png", out)) {
            throw new IOException("PNG 编码失败: " + out);
        }
    }

    private IconTool() {
    }
}
