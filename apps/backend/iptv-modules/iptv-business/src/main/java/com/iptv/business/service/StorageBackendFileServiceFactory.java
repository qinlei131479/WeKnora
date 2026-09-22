package com.iptv.business.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.iptv.business.domain.StorageBackends;
import com.iptv.business.util.CryptoUtils;
import com.iptv.common.core.exception.ServiceException;
import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.InputStream;

/**
 * 存储后端文件服务工厂
 * 根据存储后端的provider创建对应的文件获取方式
 */
@Slf4j
@Component
public class StorageBackendFileServiceFactory {

    @Value("${file.path:}")
    private String localFilePath;

    /**
     * 根据存储后端获取文件流
     *
     * @param backend 存储后端配置
     * @param filePath 文件路径
     * @return 文件输入流
     */
    public InputStream getFileStream(StorageBackends backend, String filePath) {
        if (backend == null) {
            throw new ServiceException("存储后端配置为空");
        }

        String provider = backend.getProvider();
        String config = backend.getConfig();

        if (StrUtil.isBlank(provider)) {
            throw new ServiceException("存储后端provider为空");
        }

        try {
            switch (provider.toLowerCase()) {
                case "local":
                    return getLocalFileStream(filePath);
                case "minio":
                    return getMinioFileStream(config, filePath);
                case "cos":
                    throw new ServiceException("COS存储后端暂未实现");
                case "oss":
                    throw new ServiceException("OSS存储后端暂未实现");
                case "s3":
                    throw new ServiceException("S3存储后端暂未实现");
                default:
                    throw new ServiceException("不支持的存储后端类型: " + provider);
            }
        } catch (ServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("获取文件流失败, provider={}, filePath={}", provider, filePath, e);
            throw new ServiceException("获取文件流失败: " + e.getMessage());
        }
    }

    /**
     * 保存字节数据到指定存储后端，返回与 Go 端一致的引用格式
     *
     * @param backend   存储后端配置
     * @param objectKey 对象键（如 1/exports/{uuid}.zip）
     * @param data      字节数据
     * @return 引用路径：minio://{bucket}/{objectKey} 或 local://{objectKey}
     */
    public String saveBytes(StorageBackends backend, String objectKey, byte[] data) {
        if (backend == null) {
            throw new ServiceException("存储后端配置为空");
        }
        String provider = backend.getProvider().toLowerCase();
        try {
            switch (provider) {
                case "minio" -> {
                    JSONObject jsonConfig = parseMinioConfig(backend.getConfig());
                    String bucketName = jsonConfig.getStr("bucket_name");
                    try (InputStream in = new java.io.ByteArrayInputStream(data)) {
                        buildMinioClient(jsonConfig).putObject(
                                io.minio.PutObjectArgs.builder()
                                        .bucket(bucketName)
                                        .object(objectKey)
                                        .stream(in, data.length, -1)
                                        .build());
                    }
                    return StrUtil.format("minio://{}/{}", bucketName, objectKey);
                }
                case "local" -> {
                    java.nio.file.Path target = resolveLocalPath(objectKey);
                    java.nio.file.Files.createDirectories(target.getParent());
                    java.nio.file.Files.write(target, data);
                    return "local://" + objectKey;
                }
                default -> throw new ServiceException("不支持的存储后端类型: " + backend.getProvider());
            }
        } catch (ServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("保存文件失败, provider={}, objectKey={}", backend.getProvider(), objectKey, e);
            throw new ServiceException("保存文件失败: " + e.getMessage());
        }
    }

    /**
     * 删除指定存储后端中的对象（尽力而为，失败仅告警）
     *
     * @param backend   存储后端配置
     * @param objectKey 对象键
     */
    public void deleteObject(StorageBackends backend, String objectKey) {
        if (backend == null || StrUtil.isBlank(objectKey)) {
            return;
        }
        String provider = backend.getProvider().toLowerCase();
        try {
            switch (provider) {
                case "minio" -> {
                    JSONObject jsonConfig = parseMinioConfig(backend.getConfig());
                    buildMinioClient(jsonConfig).removeObject(
                            io.minio.RemoveObjectArgs.builder()
                                    .bucket(jsonConfig.getStr("bucket_name"))
                                    .object(objectKey)
                                    .build());
                }
                case "local" -> java.nio.file.Files.deleteIfExists(resolveLocalPath(objectKey));
                default -> log.warn("不支持的存储后端类型, 跳过删除: {}", backend.getProvider());
            }
        } catch (Exception e) {
            log.warn("删除存储对象失败(忽略), provider={}, objectKey={}", backend.getProvider(), objectKey, e);
        }
    }

    /**
     * 解析 MinIO 配置 JSON 并校验必填项
     */
    private JSONObject parseMinioConfig(String config) {
        if (StrUtil.isBlank(config)) {
            throw new ServiceException("MinIO配置为空");
        }
        JSONObject jsonConfig = JSONUtil.parseObj(config);
        String endpoint = jsonConfig.getStr("endpoint");
        if (StrUtil.isNotBlank(endpoint) && !StrUtil.startWith(endpoint, "http")) {
            endpoint = StrUtil.format("http://{}", endpoint);
            jsonConfig.set("endpoint", endpoint);
        }
        if (StrUtil.isBlank(jsonConfig.getStr("endpoint"))
                || StrUtil.isBlank(jsonConfig.getStr("access_key_id"))
                || StrUtil.isBlank(jsonConfig.getStr("secret_access_key"))
                || StrUtil.isBlank(jsonConfig.getStr("bucket_name"))) {
            throw new ServiceException("MinIO配置不完整");
        }
        return jsonConfig;
    }

    /**
     * 按 MinIO 配置构建客户端
     */
    private MinioClient buildMinioClient(JSONObject jsonConfig) {
        return MinioClient.builder()
                .endpoint(jsonConfig.getStr("endpoint"))
                .credentials(
                        CryptoUtils.decryptStrict(jsonConfig.getStr("access_key_id")),
                        CryptoUtils.decryptStrict(jsonConfig.getStr("secret_access_key")))
                .build();
    }

    /**
     * 解析本地存储绝对路径
     */
    private java.nio.file.Path resolveLocalPath(String objectKey) {
        String fullPath = StrUtil.isNotBlank(localFilePath) && !objectKey.contains(":")
                ? localFilePath + "/" + objectKey : objectKey;
        return java.nio.file.Paths.get(fullPath).normalize();
    }

    /**
     * 获取本地文件流
     */
    private InputStream getLocalFileStream(String filePath) throws Exception {
        // 如果filePath是绝对路径，直接使用；否则拼接本地存储路径
        String fullPath = filePath;
        if (!filePath.startsWith("/") && !filePath.contains(":")) {
            fullPath = StrUtil.isNotBlank(localFilePath) ? localFilePath + "/" + filePath : filePath;
        }
        return new FileInputStream(fullPath);
    }

    /**
     * 获取MinIO文件流
     */
    private InputStream getMinioFileStream(String config, String filePath) throws Exception {
        JSONObject jsonConfig = parseMinioConfig(config);
        String bucketName = jsonConfig.getStr("bucket_name");

        if (StrUtil.startWith(filePath, bucketName)) {
            filePath = filePath.substring(bucketName.length() + 1);
        }

        return buildMinioClient(jsonConfig).getObject(
                io.minio.GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(filePath)
                        .build()
        );
    }
}
