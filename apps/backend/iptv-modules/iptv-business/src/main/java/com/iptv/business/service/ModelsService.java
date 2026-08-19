package com.iptv.business.service;

import com.iptv.business.domain.Models;
import com.iptv.business.domain.dto.ModelCredentialsDTO;
import com.iptv.business.domain.dto.ModelDebugDTO;
import com.iptv.business.domain.dto.ModelTestRequestDTO;
import com.iptv.business.domain.dto.ModelsDTO;
import com.iptv.business.domain.vo.CredentialsResponseVO;
import com.iptv.business.domain.vo.ModelProviderVO;
import com.iptv.business.domain.vo.ModelTestResultVO;
import com.iptv.business.domain.vo.ModelsVO;
import com.baomidou.mybatisplus.extension.service.IService;
import jakarta.annotation.Nonnull;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * <p>
 * 模型配置 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
public interface ModelsService extends IService<Models> {

    /**
     * 获取模型厂商列表
     *
     * @param modelType 模型类型（可选）
     * @return 厂商列表
     */
    List<ModelProviderVO> listProviders(String modelType);

    /**
     * 创建模型
     *
     * @param dto 模型信息
     * @return 已保存模型
     */
    ModelsVO createModel(@Nonnull ModelsDTO dto);

    /**
     * 获取模型列表
     *
     * @return 模型列表
     */
    List<ModelsVO> listModels();

    /**
     * 获取模型详情
     *
     * @param id 模型ID
     * @return 模型信息
     */
    ModelsVO getModelById(@Nonnull String id);

    /**
     * 更新模型
     *
     * @param dto 模型信息
     * @return 已更新模型
     */
    ModelsVO updateModel(@Nonnull ModelsDTO dto);

    /**
     * 删除模型
     *
     * @param id 模型ID
     */
    void deleteModel(@Nonnull String id);

    /**
     * 更新凭证
     *
     * @param dto 凭证信息
     * @return 凭证状态
     */
    CredentialsResponseVO updateCredentials(@Nonnull ModelCredentialsDTO dto);

    /**
     * 查询凭证状态
     *
     * @param id 模型ID
     * @return 凭证状态
     */
    CredentialsResponseVO getCredentials(@Nonnull String id);

    /**
     * 删除凭证字段
     *
     * @param id    模型ID
     * @param field 字段名
     */
    void deleteCredentialField(@Nonnull String id, @Nonnull String field);

    /**
     * 调试模型
     *
     * @param dto  调试参数
     * @param file 上传文件（可选）
     * @return 调试结果
     */
    Object debugModel(@Nonnull ModelDebugDTO dto, MultipartFile file);

    /**
     * 测试远程 Chat 模型连接
     *
     * @param dto 测试请求
     * @return 测试结果
     */
    ModelTestResultVO testRemoteModel(@Nonnull ModelTestRequestDTO dto);

    /**
     * 测试 Embedding 模型
     *
     * @param dto 测试请求
     * @return 测试结果
     */
    ModelTestResultVO testEmbeddingModel(@Nonnull ModelTestRequestDTO dto);

    /**
     * 测试 Rerank 模型
     *
     * @param dto 测试请求
     * @return 测试结果
     */
    ModelTestResultVO testRerankModel(@Nonnull ModelTestRequestDTO dto);

    /**
     * 测试 ASR 模型
     *
     * @param dto 测试请求
     * @return 测试结果
     */
    ModelTestResultVO testASRModel(@Nonnull ModelTestRequestDTO dto);

    /**
     * 测试多模态模型
     *
     * @param dto  测试请求
     * @param file 测试图片
     * @return 测试结果
     */
    ModelTestResultVO testMultimodalModel(@Nonnull ModelTestRequestDTO dto, MultipartFile file);
}
