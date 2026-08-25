package com.iptv.business.util;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM 加密工具类
 * 与 Go 代码的 crypto.go 保持一致
 *
 * @author kjsc
 * @since 2026-08-18
 */
@Slf4j
public class CryptoUtils {

    /**
     * 加密数据前缀标识
     */
    private static final String ENC_PREFIX = "enc:v1:";

    /**
     * AES-GCM Nonce 长度（字节）
     */
    private static final int NONCE_LENGTH = 12;

    /**
     * AES-GCM 认证标签长度（位）
     */
    private static final int TAG_LENGTH_BIT = 128;

    /**
     * AES 密钥长度（字节）
     */
    private static final int KEY_LENGTH = 32;

    /**
     * 系统 AES 密钥（从环境变量 SYSTEM_AES_KEY 读取）
     */
    private static volatile byte[] systemAesKey;

    /**
     * 安全随机数生成器
     */
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * 获取 AES 密钥
     * 从环境变量 SYSTEM_AES_KEY 读取，必须是 32 字节
     *
     * @return AES 密钥，如果未设置或长度不对则返回 null
     */
    public static byte[] getAesKey() {
        if (systemAesKey != null) {
            return systemAesKey;
        }

        String envKey = EnvUtil.get("SYSTEM_AES_KEY","weknora-system-aes-key-32bytes!!");
        log.info("SYSTEM_AES_KEY: {}", envKey);
        if (StrUtil.isBlank(envKey)) {
            log.warn("未配置 SYSTEM_AES_KEY");
            return null;
        }

        byte[] key = envKey.getBytes(StandardCharsets.UTF_8);
        if (key.length != KEY_LENGTH) {
            log.warn("SYSTEM_AES_KEY 长度不正确: {} 字节，需要 {} 字节", key.length, KEY_LENGTH);
            return null;
        }

        systemAesKey = key;
        return systemAesKey;
    }

    /**
     * 手动设置 AES 密钥（用于测试或特殊场景）
     *
     * @param key AES 密钥，必须是 32 字节
     * @throws IllegalArgumentException 如果密钥长度不是 32 字节
     */
    public static void setAesKey(byte[] key) {
        if (key == null) {
            systemAesKey = null;
            return;
        }
        if (key.length != KEY_LENGTH) {
            throw new IllegalArgumentException("AES 密钥必须是 32 字节，当前: " + key.length);
        }
        systemAesKey = key.clone();
    }

    /**
     * AES-256-GCM 加密
     *
     * @param plaintext 明文
     * @param key       AES 密钥
     * @return 加密后的字符串，格式为 "enc:v1:<base64编码>"
     * @throws Exception 加密失败
     */
    public static String encryptAesGcm(String plaintext, byte[] key) {
        if (StrUtil.isBlank(plaintext) || key == null) {
            return plaintext;
        }

        // 已加密则跳过（幂等性）
        if (plaintext.startsWith(ENC_PREFIX)) {
            return plaintext;
        }

        // 生成随机 Nonce
        byte[] nonce = new byte[NONCE_LENGTH];
        SECURE_RANDOM.nextBytes(nonce);
        try {
            // 创建 AES-GCM 加密器
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BIT, nonce);
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);

            // 加密
            byte[] plaintextBytes = plaintext.getBytes(StandardCharsets.UTF_8);
            byte[] ciphertext = cipher.doFinal(plaintextBytes);

            // 拼接 Nonce + 密文
            byte[] combined = new byte[NONCE_LENGTH + ciphertext.length];
            System.arraycopy(nonce, 0, combined, 0, NONCE_LENGTH);
            System.arraycopy(ciphertext, 0, combined, NONCE_LENGTH, ciphertext.length);

            // Base64 编码（URL 安全，无填充）
            String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(combined);

            return ENC_PREFIX + encoded;
        }catch (Exception e){
            log.error("AES-GCM 加密失败", e);
            return plaintext;
        }
    }

    /**
     * AES-256-GCM 解密
     *
     * @param encrypted 加密字符串
     * @param key       AES 密钥
     * @return 解密后的明文，如果无加密前缀则返回原字符串
     * @throws Exception 解密失败
     */
    public static String decryptAesGcm(String encrypted, byte[] key) {
        if (StrUtil.isBlank(encrypted) || key == null) {
            return encrypted;
        }

        // 无加密前缀则视为明文（向后兼容）
        if (!encrypted.startsWith(ENC_PREFIX)) {
            return encrypted;
        }

        // Base64 解码
        String encoded = encrypted.substring(ENC_PREFIX.length());
        byte[] combined = Base64.getUrlDecoder().decode(encoded);

        if (combined.length < NONCE_LENGTH) {
            throw new IllegalArgumentException("加密数据太短: " + combined.length + " 字节");
        }

        // 分离 Nonce 和密文
        byte[] nonce = new byte[NONCE_LENGTH];
        byte[] ciphertext = new byte[combined.length - NONCE_LENGTH];
        System.arraycopy(combined, 0, nonce, 0, NONCE_LENGTH);
        System.arraycopy(combined, NONCE_LENGTH, ciphertext, 0, ciphertext.length);

        try {
            // 创建 AES-GCM 解密器
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BIT, nonce);
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);

            // 解密
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
        }catch (Exception e){
            log.error("AES-GCM 解密失败", e);
            return encrypted;
        }


    }

    /**
     * 使用系统密钥加密（严格模式）
     *
     * @param plaintext 明文
     * @return 加密后的字符串
     * @throws Exception 加密失败或密钥未配置
     */
    public static String encrypt(String plaintext){
        byte[] key = getAesKey();
        if (key == null) {
            log.warn("[crypto] SYSTEM_AES_KEY 未配置或长度不正确");
            return plaintext;
        }
        return encryptAesGcm(plaintext, key);
    }

    /**
     * 使用系统密钥解密（严格模式）
     * 用于实际使用凭证时，解密失败会抛出异常
     *
     * @param encrypted 加密字符串
     * @return 解密后的明文
     * @throws Exception 解密失败或密钥未配置
     */
    public static String decryptStrict(String encrypted) throws Exception {
        if (StrUtil.isBlank(encrypted)) {
            return encrypted;
        }

        // 无加密前缀则视为明文
        if (!encrypted.startsWith(ENC_PREFIX)) {
            return encrypted;
        }

        byte[] key = getAesKey();
        if (key == null) {
            throw new IllegalStateException("加密数据存在但 SYSTEM_AES_KEY 未配置或长度不正确");
        }

        return decryptAesGcm(encrypted, key);
    }

    /**
     * 使用系统密钥解密（宽松模式）
     * 用于 GORM Scan 加载数据时，解密失败返回空字符串而不是报错
     *
     * @param encrypted 加密字符串
     * @return 解密结果，包含明文和是否成功
     */
    public static DecryptResult decryptLenient(String encrypted) {
        if (StrUtil.isBlank(encrypted)) {
            return new DecryptResult("", true);
        }

        // 无加密前缀则视为明文
        if (!encrypted.startsWith(ENC_PREFIX)) {
            return new DecryptResult(encrypted, true);
        }

        byte[] key = getAesKey();
        if (key == null) {
            log.warn("[crypto] 加密数据存在但 SYSTEM_AES_KEY 未配置或长度不正确");
            return new DecryptResult("", false);
        }

        try {
            String plaintext = decryptAesGcm(encrypted, key);
            return new DecryptResult(plaintext, true);
        } catch (Exception e) {
            log.warn("[crypto] 解密失败: {}", e.getMessage());
            return new DecryptResult("", false);
        }
    }

    /**
     * 检查字符串是否已加密
     *
     * @param str 待检查的字符串
     * @return true 表示已加密
     */
    public static boolean isEncrypted(String str) {
        return StrUtil.isNotBlank(str) && str.startsWith(ENC_PREFIX);
    }

    /**
     * 解密结果
     */
    public static class DecryptResult {
        private final String plaintext;
        private final boolean success;

        public DecryptResult(String plaintext, boolean success) {
            this.plaintext = plaintext;
            this.success = success;
        }

        public String getPlaintext() {
            return plaintext;
        }

        public boolean isSuccess() {
            return success;
        }
    }
}
