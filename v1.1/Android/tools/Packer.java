import com.sunset.forecast.core.Vault;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 构建期资源打包工具（仅在开发机运行，不会进入 APK）。
 *
 * 读取原始 index.html，整文件 AES-256-CBC 加密后输出到 assets/app.dat，
 * 使 APK 解包后无法直接看到任何网页源码 / JavaScript 逻辑。
 *
 * 用法： java -cp <classes> Packer <index.html> <app.dat>
 */
public final class Packer {

    public static void main(String[] args) throws IOException {
        if (args.length < 2) {
            System.err.println("usage: Packer <input.html> <output.dat>");
            System.exit(2);
        }
        Path in = Paths.get(args[0]);
        Path out = Paths.get(args[1]);

        byte[] plain = Files.readAllBytes(in);
        try {
            byte[] blob = Vault.encrypt(plain);
            if (out.getParent() != null) {
                Files.createDirectories(out.getParent());
            }
            Files.write(out, blob);
            System.out.println("[packer] 已加密页面资源: " + plain.length
                    + " 字节明文 -> " + blob.length + " 字节密文 -> " + out);
        } catch (Exception e) {
            throw new IOException("加密失败: " + e.getMessage(), e);
        }
    }
}
