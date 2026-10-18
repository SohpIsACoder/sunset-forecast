package com.sunset.forecast.core;

import java.io.ByteArrayOutputStream;
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * 页面资源解密核心（源码保护关键部件）。
 *
 *  - AES-256-CBC 密钥被拆分为两个伪随机字节表 A / B，仅在运行期按位异或重组；
 *    任何位置都不会出现明文密钥，R8 会进一步混淆本类与方法名。
 *  - 密文格式：MAGIC(4) + IV(16) + CipherText，MAGIC 用于校验解密结果是否有效。
 */
public final class Vault {

    private Vault() { }

    private static final int[] A = { 226, 204, 179, 72, 206, 184, 118, 108, 110, 176, 192, 27, 42, 74, 255, 136, 84, 114, 62, 139, 209, 155, 121, 9, 35, 241, 132, 221, 186, 137, 168, 48 };
    private static final int[] B = { 19, 202, 130, 81, 24, 112, 6, 181, 37, 61, 121, 53, 144, 55, 54, 116, 190, 117, 92, 92, 226, 190, 58, 62, 118, 10, 186, 164, 31, 73, 165, 34 };

    private static final byte[] MAGIC = { 83, 85, 78, 33 };
    private static final int IV_LEN = 16;

    private static byte[] key() {
        byte[] k = new byte[A.length];
        for (int i = 0; i < k.length; i++) {
            k[i] = (byte) (A[i] ^ B[i]);
        }
        return k;
    }

    public static byte[] encrypt(byte[] plain) throws Exception {
        byte[] iv = new byte[IV_LEN];
        new SecureRandom().nextBytes(iv);
        Cipher c = Cipher.getInstance("AES/CBC/PKCS5Padding");
        c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key(), "AES"), new IvParameterSpec(iv));
        byte[] ct = c.doFinal(plain);
        ByteArrayOutputStream out = new ByteArrayOutputStream(ct.length + IV_LEN + MAGIC.length);
        out.write(MAGIC);
        out.write(iv);
        out.write(ct);
        return out.toByteArray();
    }

    public static byte[] decrypt(byte[] blob) throws Exception {
        if (blob == null || blob.length <= MAGIC.length + IV_LEN) {
            throw new IllegalArgumentException("blob too small");
        }
        for (int i = 0; i < MAGIC.length; i++) {
            if (blob[i] != MAGIC[i]) {
                throw new IllegalArgumentException("bad magic");
            }
        }
        byte[] iv = new byte[IV_LEN];
        System.arraycopy(blob, MAGIC.length, iv, 0, IV_LEN);
        Cipher c = Cipher.getInstance("AES/CBC/PKCS5Padding");
        c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key(), "AES"), new IvParameterSpec(iv));
        return c.doFinal(blob, MAGIC.length + IV_LEN, blob.length - MAGIC.length - IV_LEN);
    }
}
