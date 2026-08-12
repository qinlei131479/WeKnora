package com.iptv.business.service;

import com.iptv.business.domain.dto.OllamaCheckModelsDTO;
import com.iptv.business.domain.dto.OllamaCheckRemoteModelDTO;
import com.iptv.business.domain.vo.OllamaCheckModelsVO;
import com.iptv.business.domain.vo.OllamaCheckRemoteModelVO;
import com.iptv.business.domain.vo.OllamaDownloadTaskVO;
import com.iptv.business.domain.vo.OllamaModelVO;
import com.iptv.business.domain.vo.OllamaStatusVO;

import java.util.List;

/**
 * Ollama 服务接口
 *
 * @author kjsc
 * @since 2026-08-12
 */
public interface OllamaService {

    /**
     * 检查 Ollama 服务状态
     *
     * @return Ollama 服务状态
     */
    OllamaStatusVO checkStatus();

    /**
     * 获取已安装的 Ollama 模型列表
     *
     * @return 模型列表
     */
    List<OllamaModelVO> listModels();

    /**
     * 检查指定模型是否已安装
     *
     * @param dto 模型名称列表
     * @return 模型可用性结果
     */
    OllamaCheckModelsVO checkModels(OllamaCheckModelsDTO dto);

    /**
     * 下载指定模型
     *
     * @param modelName 模型名称
     * @return 下载任务信息
     */
    OllamaDownloadTaskVO downloadModel(String modelName);

    /**
     * 查询下载进度
     *
     * @param taskId 任务 ID
     * @return 下载任务信息
     */
    OllamaDownloadTaskVO getDownloadProgress(String taskId);

    /**
     * 列出所有下载任务
     *
     * @return 下载任务列表
     */
    List<OllamaDownloadTaskVO> listDownloadTasks();

    /**
     * 检查远程模型 API 是否可访问
     *
     * @param dto 检查参数
     * @return 检查结果
     */
    OllamaCheckRemoteModelVO checkRemoteModel(OllamaCheckRemoteModelDTO dto);
}
