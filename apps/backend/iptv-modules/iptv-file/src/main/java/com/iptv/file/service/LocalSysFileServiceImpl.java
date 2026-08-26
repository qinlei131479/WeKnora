package com.iptv.file.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.core.utils.file.FileUtils;
import com.iptv.file.utils.FileUploadUtils;

import java.io.FileInputStream;
import java.io.InputStream;

/**
 * 本地文件存储
 * 
 * @author ruoyi
 */
@ConditionalOnProperty(name = "file.storageType", havingValue = "local", matchIfMissing = true)
@Service
public class LocalSysFileServiceImpl implements ISysFileService
{
    /**
     * 资源映射路径 前缀
     */
    @Value("${local.prefix}")
    public String localFilePrefix;

    /**
     * 域名或本机访问地址
     */
    @Value("${local.domain}")
    public String domain;
    
    /**
     * 上传文件存储在本地的根路径
     */
    @Value("${local.path}")
    private String localFilePath;

    /**
     * 本地文件上传接口
     * 
     * @param file 上传的文件
     * @return 访问地址
     * @throws Exception
     */
    @Override
    public String uploadFile(MultipartFile file) throws Exception
    {
        String name = FileUploadUtils.upload(localFilePath, file);
//        String url = domain + localFilePrefix + name;
        String url = name;
        return url;
    }

    /**
     * 本地文件删除接口
     * 
     * @param fileUrl 文件访问URL
     * @throws Exception
     */
    @Override
    public void deleteFile(String fileUrl) throws Exception
    {
        String localFile = StringUtils.substringAfter(fileUrl, localFilePrefix);
        FileUtils.deleteFile(localFilePath + localFile);
    }

    /**
     * 获取文件流
     *
     * @param filePath 文件路径
     * @return 文件输入流
     * @throws Exception
     */
    @Override
    public InputStream getFile(String filePath) throws Exception
    {
        return new FileInputStream(filePath);
    }
}
