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
        if (StrUtil.isBlank(config)) {
            throw new ServiceException("MinIO配置为空");
        }

        JSONObject jsonConfig = JSONUtil.parseObj(config);
        String endpoint = "http://192.168.180.238:9000";//jsonConfig.getStr("endpoint");
        String accessKey = CryptoUtils.decryptStrict(jsonConfig.getStr("access_key_id"));
        String secretKey = CryptoUtils.decryptStrict(jsonConfig.getStr("secret_access_key"));
        String bucketName = jsonConfig.getStr("bucket_name");
        Boolean useSSL = jsonConfig.getBool("useSSL", false);

        if (StrUtil.isBlank(endpoint) || StrUtil.isBlank(accessKey) || 
            StrUtil.isBlank(secretKey) || StrUtil.isBlank(bucketName)) {
            throw new ServiceException("MinIO配置不完整");
        }
        if(StrUtil.startWith(filePath,bucketName)){
            filePath = filePath.substring(bucketName.length() + 1);
        }

        MinioClient minioClient = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();

        return minioClient.getObject(
                io.minio.GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(filePath)
                        .build()
        );
    }
}
