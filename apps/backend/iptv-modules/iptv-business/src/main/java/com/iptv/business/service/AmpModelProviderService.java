package com.iptv.business.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.business.domain.AmpModelProvider;
import com.iptv.business.domain.vo.ModelProviderVO;

import java.util.List;

/**
 * 模型厂商配置 Service
 */
public interface AmpModelProviderService extends IService<AmpModelProvider> {

    /**
     * 获取所有厂商列表
     *
     * @return 厂商列表
     */
    List<ModelProviderVO> listAllProviders();

    /**
     * 根据模型类型获取支持的厂商列表
     *
     * @param modelType 模型类型（chat, embedding, rerank, vllm, asr）
     * @return 厂商列表
     */
    List<ModelProviderVO> listProvidersByModelType(String modelType);
}
