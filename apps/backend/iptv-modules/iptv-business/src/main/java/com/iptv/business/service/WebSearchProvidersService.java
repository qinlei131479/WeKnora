package com.iptv.business.service;

import jakarta.annotation.Nonnull;
import com.iptv.business.domain.WebSearchProviders;
import com.iptv.business.domain.vo.WebSearchProvidersVO;
import com.iptv.business.domain.vo.CredentialsResponseVO;
import com.iptv.business.domain.vo.WebSearchProviderTypeVO;
import com.iptv.business.domain.dto.WebSearchProvidersDTO;
import com.iptv.business.domain.dto.WebSearchCredentialsDTO;
import com.iptv.business.domain.dto.WebSearchTestRequestDTO;
import com.iptv.business.domain.dto.page.WebSearchProvidersPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;
import java.util.Map;

/**
 * <p>
 * 租户级网络搜索提供商配置（密钥加密存储） 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-17
 */
public interface WebSearchProvidersService extends IService<WebSearchProviders> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<WebSearchProvidersVO> queryPage(WebSearchProvidersPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    WebSearchProvidersVO queryById(@Nonnull String id);

    /**
     * 新增
     *
     * @param dto 实体
     * @return 已保存实体
     */
    WebSearchProvidersVO insert(@Nonnull WebSearchProvidersDTO dto);

    /**
     * 按 id 更新（忽略 api_key，凭证走独立接口）
     *
     * @param dto 实体
     * @return 已更新实体
     */
    WebSearchProvidersVO update(@Nonnull WebSearchProvidersDTO dto);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull String id);

    /**
     * 获取提供商类型元数据
     *
     * @return 提供商类型列表
     */
    List<WebSearchProviderTypeVO> listProviderTypes();

    /**
     * 测试已保存的提供商（使用数据库中已保存的凭证）
     *
     * @param id 提供商ID
     * @return 测试结果
     */
    Map<String, Object> testProviderById(@Nonnull String id);

    /**
     * 测试原始凭证（不落库）
     *
     * @param dto 测试请求
     * @return 测试结果
     */
    Map<String, Object> testProviderRaw(@Nonnull WebSearchTestRequestDTO dto);

    /**
     * 更新/查询凭证
     *
     * @param dto 凭证DTO（apiKey 为 null 时仅查询配置状态）
     * @return 凭证响应
     */
    CredentialsResponseVO updateOrQueryCredentials(@Nonnull WebSearchCredentialsDTO dto);

    /**
     * 删除凭证字段
     *
     * @param id    提供商ID
     * @param field 字段名（目前仅支持 api_key）
     */
    void deleteCredentialField(@Nonnull String id, @Nonnull String field);
}
