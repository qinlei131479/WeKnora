package com.iptv.business.enums;

import lombok.Getter;

import java.util.Arrays;

/**
 * 存储后端：提供商类型
 */
public enum StorageBackendsProvider {
    LOCAL("local"),
    MINIO("minio"),
    COS("cos"),
//    TOS("tos"),
//    S3("s3"),
//    OBS("obs"),
    OSS("oss");

    @Getter
    private final String code;

    StorageBackendsProvider(String code) {
        this.code = code;
    }

    public static StorageBackendsProvider codeOf(String code) {
        return Arrays.stream(values())
                .filter(v -> v.code.equals(code))
                .findFirst()
                .orElse(null);
    }
}
