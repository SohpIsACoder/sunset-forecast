#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
火烧云预报 —— 构建辅助脚本（无第三方依赖，仅用标准库）

子命令：
  genkey <Vault.java 路径>      生成含随机 AES-256 密钥（异或拆分隐藏）的 Vault.java
                                （若文件已存在则保持不变，确保密钥稳定）
  adddex <base.apk> <classes.dex> <out.apk>
                                将 classes.dex 注入 aapt2 生成的 APK，保留原有条目压缩方式

注：启动图标由 tools/IconTool.java 从 icon.jpg 生成，见 build_apk.ps1 第 3 步。
"""
import os
import sys
import random
import zipfile


# ----------------------------------------------------------------------------
# genkey
# ----------------------------------------------------------------------------
VAULT_TEMPLATE = '''package com.sunset.forecast.core;

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

    private static final int[] A = { %s };
    private static final int[] B = { %s };

    private static final byte[] MAGIC = { %s };
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
'''

MAGIC = [0x53, 0x55, 0x4E, 0x21]  # "SUN!"


def _int_array(values):
    return ", ".join(str(v) for v in values)


def genkey(vault_path):
    if os.path.exists(vault_path):
        print("[genkey] 已存在 Vault.java，沿用既有密钥：%s" % vault_path)
        return
    key = [random.randrange(256) for _ in range(32)]          # AES-256
    a = [random.randrange(256) for _ in range(32)]
    b = [(key[i] ^ a[i]) & 0xFF for i in range(32)]           # 保证 a[i]^b[i]==key[i]
    src = VAULT_TEMPLATE % (_int_array(a), _int_array(b), _int_array(MAGIC))
    os.makedirs(os.path.dirname(vault_path), exist_ok=True)
    with open(vault_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(src)
    print("[genkey] 已生成随机密钥并写入：%s" % vault_path)


# ----------------------------------------------------------------------------
# adddex
# ----------------------------------------------------------------------------
def adddex(base_apk, dex_path, out_apk):
    with open(dex_path, "rb") as f:
        dex = f.read()
    zin = zipfile.ZipFile(base_apk, "r")
    zout = zipfile.ZipFile(out_apk, "w", zipfile.ZIP_DEFLATED)
    for item in zin.infolist():
        data = zin.read(item.filename)
        zi = zipfile.ZipInfo(item.filename, item.date_time)
        zi.compress_type = item.compress_type       # 保留 resources.arsc 等条目的“不压缩”属性
        zi.external_attr = item.external_attr
        zi.internal_attr = item.internal_attr
        zout.writestr(zi, data)
    zi = zipfile.ZipInfo("classes.dex", (1980, 1, 1, 0, 0, 0))
    zi.compress_type = zipfile.ZIP_STORED
    zout.writestr(zi, dex)
    zout.close()
    zin.close()
    print("[adddex] 已注入 classes.dex (%d 字节) -> %s" % (len(dex), out_apk))


# ----------------------------------------------------------------------------
def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    cmd = sys.argv[1]
    if cmd == "genkey":
        genkey(sys.argv[2])
    elif cmd == "adddex":
        adddex(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        print("未知子命令：%s" % cmd)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
