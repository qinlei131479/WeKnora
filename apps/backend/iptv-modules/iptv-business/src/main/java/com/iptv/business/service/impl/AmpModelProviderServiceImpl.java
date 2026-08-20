package com.iptv.business.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iptv.business.domain.AmpModelProvider;
import com.iptv.business.domain.vo.ModelProviderVO;
import com.iptv.business.pgmapper.AmpModelProviderMapper;
import com.iptv.business.service.AmpModelProviderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 模型厂商配置 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AmpModelProviderServiceImpl extends ServiceImpl<AmpModelProviderMapper, AmpModelProvider>
        implements AmpModelProviderService {

    @Override
    public List<ModelProviderVO> listAllProviders() {
        LambdaQueryWrapper<AmpModelProvider> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(AmpModelProvider::getEnabled, true);
        queryWrapper.orderByAsc(AmpModelProvider::getSortOrder);
        List<AmpModelProvider> providers = this.list(queryWrapper);

        return providers.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ModelProviderVO> listProvidersByModelType(String modelType) {
        if (StrUtil.isBlank(modelType)) {
            return listAllProviders();
        }

        List<AmpModelProvider> providers = this.baseMapper.selectList(new LambdaQueryWrapper<AmpModelProvider>()
                .eq(AmpModelProvider::getEnabled, true)
                .apply("model_types::text LIKE {0}", "%" + modelType + "%")
                .orderByAsc(AmpModelProvider::getSortOrder));

        return providers.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    /**
     * 转换为 VO
     */
    private ModelProviderVO convertToVO(AmpModelProvider provider) {
        ModelProviderVO vo = new ModelProviderVO();
        vo.setValue(provider.getName());
        vo.setLabel(provider.getDisplayName());
        vo.setDescription(provider.getDescription());

        // 解析 defaultUrls JSON
        if (StrUtil.isNotBlank(provider.getDefaultUrls())) {
            try {
                Map<String, String> defaultUrls = JSONUtil.toBean(
                        provider.getDefaultUrls(),
                        Map.class
                );
                vo.setDefaultUrls(defaultUrls);
            } catch (Exception e) {
                log.error("Failed to parse defaultUrls for provider: {}", provider.getName(), e);
                vo.setDefaultUrls(new java.util.HashMap<>());
            }
        } else {
            vo.setDefaultUrls(new java.util.HashMap<>());
        }

        // 解析 modelTypes JSON
        if (StrUtil.isNotBlank(provider.getModelTypes())) {
            try {
                List<String> modelTypes = JSONUtil.toList(
                        provider.getModelTypes(),
                        String.class
                );
                vo.setModelTypes(modelTypes);
            } catch (Exception e) {
                log.error("Failed to parse modelTypes for provider: {}", provider.getName(), e);
                vo.setModelTypes(new ArrayList<>());
            }
        } else {
            vo.setModelTypes(new ArrayList<>());
        }

        return vo;
    }
}
