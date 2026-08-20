package com.iptv.business.service.impl;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.iptv.business.domain.dto.OllamaCheckModelsDTO;
import com.iptv.business.domain.dto.OllamaCheckRemoteModelDTO;
import com.iptv.business.domain.vo.*;
import com.iptv.business.service.OllamaService;
import com.iptv.common.core.exception.ServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Ollama 服务实现类
 *
 * @author kjsc
 * @since 2026-08-12
 */
@Slf4j
@Service
public class OllamaServiceImpl implements OllamaService {

    private String ollamaEndpoint;

    public OllamaServiceImpl() {
        String envUrl = System.getenv("OLLAMA_BASE_URL");
        log.info("OLLAMA_BASE_URL from env: [{}]", envUrl);
        this.ollamaEndpoint = (envUrl != null && !envUrl.isEmpty()) 
                ? envUrl 
                : "http://192.168.170.71:11434";
    }

    // 存储下载任务
    private final Map<String, OllamaDownloadTaskVO> downloadTasks = new ConcurrentHashMap<>();

    @Override
    public OllamaStatusVO checkStatus() {
        OllamaStatusVO statusVO = new OllamaStatusVO();
        statusVO.setEndpoint(ollamaEndpoint);

        try {
            // 先检查根路径获取版本信息
            URL url = new URL(ollamaEndpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                statusVO.setAvailable(true);
                // Ollama 根路径返回版本信息，如 "Ollama is running"
                // 实际版本需要从 /api/version 获取
                conn.disconnect();

                // 尝试从 /api/version 获取版本号
                try {
                    URL versionUrl = new URL(ollamaEndpoint + "/api/version");
                    HttpURLConnection versionConn = (HttpURLConnection) versionUrl.openConnection();
                    versionConn.setRequestMethod("GET");
                    versionConn.setConnectTimeout(5000);
                    versionConn.setReadTimeout(5000);

                    if (versionConn.getResponseCode() == 200) {
                        try (Scanner scanner = new Scanner(versionConn.getInputStream())) {
                            String response = scanner.useDelimiter("\\A").next();
                            JSONObject json = JSON.parseObject(response);
                            statusVO.setVersion(json.getString("version"));
                        }
                    }
                    versionConn.disconnect();
                } catch (Exception e) {
                    log.debug("获取 Ollama 版本失败: {}", e.getMessage());
                    statusVO.setVersion("unknown");
                }
            } else {
                statusVO.setAvailable(false);
                conn.disconnect();
            }
        } catch (Exception e) {
            log.warn("Ollama 服务检查失败: {}", e.getMessage());
            statusVO.setAvailable(false);
        }

        return statusVO;
    }

    @Override
    public List<OllamaModelVO> listModels() {
        List<OllamaModelVO> models = new ArrayList<>();

        try {
            URL url = new URL(ollamaEndpoint + "/api/tags");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                try (Scanner scanner = new Scanner(conn.getInputStream())) {
                    String response = scanner.useDelimiter("\\A").next();
                    JSONObject json = JSON.parseObject(response);
                    JSONArray modelsArray = json.getJSONArray("models");

                    if (modelsArray != null) {
                        for (int i = 0; i < modelsArray.size(); i++) {
                            JSONObject modelJson = modelsArray.getJSONObject(i);
                            OllamaModelVO modelVO = new OllamaModelVO();
                            modelVO.setName(modelJson.getString("name"));
                            modelVO.setSize(modelJson.getLong("size"));
                            modelVO.setModifiedAt(DateUtil.parse(modelJson.getString("modified_at")));
                            modelVO.setDigest(modelJson.getString("digest"));
                            models.add(modelVO);
                        }
                    }
                }
            } else {
                throw new ServiceException("Ollama 服务返回错误状态码: " + responseCode);
            }

            conn.disconnect();
        } catch (ServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("获取 Ollama 模型列表失败", e);
            throw new ServiceException("获取 Ollama 模型列表失败: " + e.getMessage());
        }

        return models;
    }

    @Override
    public OllamaCheckModelsVO checkModels(OllamaCheckModelsDTO dto) {
        OllamaCheckModelsVO vo = new OllamaCheckModelsVO();
        Map<String, Boolean> result = new HashMap<>();

        List<String> models = dto.getModels();
        if (models == null || models.isEmpty()) {
            vo.setModels(result);
            return vo;
        }

        // 获取已安装的模型名称列表
        List<OllamaModelVO> installedModels = listModels();
        Set<String> installedNames = new HashSet<>();
        for (OllamaModelVO model : installedModels) {
            installedNames.add(model.getName());
        }

        // 检查每个请求的模型是否已安装
        for (String modelName : models) {
            boolean found = false;
            for (String installed : installedNames) {
                // Ollama 模型名称可能带 tag，如 "llama3:latest"
                if (installed.equals(modelName) || installed.startsWith(modelName + ":")) {
                    found = true;
                    break;
                }
            }
            result.put(modelName, found);
        }

        vo.setModels(result);
        return vo;
    }

    @Override
    public OllamaDownloadTaskVO downloadModel(String modelName) {
        if (StrUtil.isBlank(modelName)) {
            throw new ServiceException("模型名称不能为空");
        }

        // 检查是否已有相同模型的下载任务正在进行
        for (OllamaDownloadTaskVO task : downloadTasks.values()) {
            if (modelName.equals(task.getModelName())
                    && ("pending".equals(task.getStatus()) || "downloading".equals(task.getStatus()))) {
                return task;
            }
        }

        // 创建下载任务
        String taskId = UUID.randomUUID().toString();
        OllamaDownloadTaskVO task = new OllamaDownloadTaskVO();
        task.setId(taskId);
        task.setModelName(modelName);
        task.setStatus("pending");
        task.setProgress(0.0);
        task.setMessage("准备下载");
        task.setStartTime(LocalDateTime.now());

        downloadTasks.put(taskId, task);

        // 异步执行下载
        downloadModelAsync(taskId, modelName);

        return task;
    }

    @Override
    public OllamaDownloadTaskVO getDownloadProgress(String taskId) {
        if (StrUtil.isBlank(taskId)) {
            throw new ServiceException("任务 ID 不能为空");
        }

        OllamaDownloadTaskVO task = downloadTasks.get(taskId);
        if (task == null) {
            throw new ServiceException("下载任务不存在");
        }

        return task;
    }

    @Override
    public List<OllamaDownloadTaskVO> listDownloadTasks() {
        return new ArrayList<>(downloadTasks.values());
    }

    @Override
    public OllamaCheckRemoteModelVO checkRemoteModel(OllamaCheckRemoteModelDTO dto) {
        OllamaCheckRemoteModelVO vo = new OllamaCheckRemoteModelVO();

        if (StrUtil.isBlank(dto.getUrl())) {
            vo.setSuccess(false);
            vo.setMessage("URL 不能为空");
            return vo;
        }

        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(dto.getUrl()).openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            if (StrUtil.isNotBlank(dto.getApiKey())) {
                conn.setRequestProperty("Authorization", "Bearer " + dto.getApiKey());
            }

            int responseCode = conn.getResponseCode();
            conn.disconnect();

            if (responseCode >= 200 && responseCode < 400) {
                vo.setSuccess(true);
                vo.setMessage("模型服务可访问");
            } else {
                vo.setSuccess(false);
                vo.setMessage("模型服务返回状态码: " + responseCode);
            }
        } catch (Exception e) {
            log.error("检查远程模型失败: {}", e.getMessage(), e);
            vo.setSuccess(false);
            vo.setMessage("连接失败: " + e.getMessage());
        }

        return vo;
    }

    /**
     * 异步下载模型
     */
    private void downloadModelAsync(String taskId, String modelName) {
        new Thread(() -> {
            OllamaDownloadTaskVO task = downloadTasks.get(taskId);
            if (task == null) {
                return;
            }

            try {
                // 更新状态为下载中
                task.setStatus("downloading");
                task.setMessage("开始下载模型");

                // 调用 Ollama /api/pull 接口下载模型
                URL url = new URL(ollamaEndpoint + "/api/pull");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(30000);
                conn.setReadTimeout(0); // 无超时，下载可能耗时很长
                conn.setDoOutput(true);

                // 请求体
                JSONObject requestBody = new JSONObject();
                requestBody.put("name", modelName);
                requestBody.put("stream", false);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(requestBody.toJSONString().getBytes(StandardCharsets.UTF_8));
                }

                int responseCode = conn.getResponseCode();
                if (responseCode == 200) {
                    task.setStatus("completed");
                    task.setProgress(100.0);
                    task.setMessage("下载完成");
                    task.setEndTime(LocalDateTime.now());
                    log.info("模型 {} 下载完成, 任务 ID: {}", modelName, taskId);
                } else {
                    try (Scanner scanner = new Scanner(conn.getErrorStream())) {
                        String errorResponse = scanner.useDelimiter("\\A").next();
                        task.setStatus("failed");
                        task.setMessage("下载失败: " + errorResponse);
                        task.setEndTime(LocalDateTime.now());
                    }
                }

                conn.disconnect();
            } catch (Exception e) {
                log.error("下载模型 {} 失败, 任务 ID: {}", modelName, taskId, e);
                task.setStatus("failed");
                task.setMessage("下载失败: " + e.getMessage());
                task.setEndTime(LocalDateTime.now());
            }
        }, "ollama-download-" + taskId).start();
    }
}
