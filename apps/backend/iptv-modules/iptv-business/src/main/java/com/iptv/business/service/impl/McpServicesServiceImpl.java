package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.McpServices;
import com.iptv.business.domain.McpToolApprovals;
import com.iptv.business.domain.dto.McpServicesDTO;
import com.iptv.business.domain.dto.McpToolApprovalsDTO;
import com.iptv.business.domain.dto.page.McpServicesPageDTO;
import com.iptv.business.domain.vo.McpResourceVO;
import com.iptv.business.domain.vo.McpServicesVO;
import com.iptv.business.domain.vo.McpTestResultVO;
import com.iptv.business.domain.vo.McpToolVO;
import com.iptv.business.mcp.McpClient;
import com.iptv.business.mcp.McpInitResult;
import com.iptv.business.pgmapper.McpServicesMapper;
import com.iptv.business.pgmapper.McpToolApprovalsMapper;
import com.iptv.business.service.McpServicesService;
import com.iptv.common.core.constant.TenantConstant;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.security.service.TokenService;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.model.LoginUser;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

/**
 * <p>
 * MCP service configurations 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class McpServicesServiceImpl extends ServiceImpl<McpServicesMapper, McpServices> implements McpServicesService {

    private final McpToolApprovalsMapper mcpToolApprovalsMapper;

    @Override
    public TableDataInfo<McpServicesVO> queryPage(McpServicesPageDTO dto, PageDTO pg) {
        Page<McpServicesVO> page = PageUtils.toPage(pg);
        List<McpServices> list = this.baseMapper.queryPage(dto, page);
        List<McpServicesVO> voList = BeanUtil.copyToList(list, McpServicesVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public McpServicesVO queryById(@Nonnull String id) {
        McpServices entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, McpServicesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public McpServicesVO insert(@Nonnull McpServicesDTO dto) {
        McpServices entity = BeanUtil.copyProperties(dto, McpServices.class);
        entity.setIsBuiltin(true);
        entity.setTenantId(TenantConstant.BUSINESS_BUILTIN_TENANT_ID);
        this.baseMapper.insert(entity);
        return BeanUtil.copyProperties(entity, McpServicesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public McpServicesVO update(@Nonnull McpServicesDTO dto) {
        McpServices entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("MCP service configurations不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return BeanUtil.copyProperties(entity, McpServicesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        McpServices entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateEnabledBatch(@Nonnull List<String> ids) {
        if (ids.isEmpty()) return 0;
        return this.baseMapper.update(new LambdaUpdateWrapper<McpServices>()
                .in(McpServices::getId, ids)
                .set(McpServices::getEnabled, true));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateDisabledBatch(@Nonnull List<String> ids) {
        if (ids.isEmpty()) return 0;
        return this.baseMapper.update(new LambdaUpdateWrapper<McpServices>()
                .in(McpServices::getId, ids)
                .set(McpServices::getEnabled, false));
    }

    @Override
    public List<McpToolApprovals> listToolByMcpId(String mcpId) {
        return mcpToolApprovalsMapper.selectList(new LambdaQueryWrapper<McpToolApprovals>()
                .eq(McpToolApprovals::getServiceId, mcpId)
                .eq(McpToolApprovals::getRequireApproval, true));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateToolEnabledBatch(@Nonnull List<McpToolApprovalsDTO> dto) {
        if (CollUtil.isEmpty(dto)) {
            return;
        }
        String serviceId = dto.get(0).getServiceId();
        List<String> toolNames = dto.stream().map(McpToolApprovalsDTO::getToolName).toList();
        List<McpToolApprovals> list = mcpToolApprovalsMapper
                .selectList(new LambdaQueryWrapper<McpToolApprovals>()
                        .eq(McpToolApprovals::getServiceId, serviceId)
                        .in(McpToolApprovals::getToolName, toolNames));
        if (CollUtil.isNotEmpty(list)) {
            mcpToolApprovalsMapper.update(null, new LambdaUpdateWrapper<McpToolApprovals>()
                    .in(McpToolApprovals::getToolName, toolNames)
                    .eq(McpToolApprovals::getServiceId, serviceId)
                    .set(McpToolApprovals::getRequireApproval, true));
        }
        List<McpToolApprovalsDTO> other = dto
                .stream()
                .filter(item -> list
                        .stream()
                        .noneMatch(appro -> StrUtil.equals(item.getToolName(), appro.getToolName())))
                .toList();
        if (CollUtil.isNotEmpty(other)) {
            other.forEach(item -> {
                McpToolApprovals entity = new McpToolApprovals();
                entity.setServiceId(item.getServiceId());
                entity.setToolName(item.getToolName());
                entity.setRequireApproval(true);
                entity.setTenantId(TenantConstant.BUSINESS_BUILTIN_TENANT_ID);
                mcpToolApprovalsMapper.insert(entity);
            });
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateToolDisabledBatch(@Nonnull List<McpToolApprovalsDTO> dto) {
        if (CollUtil.isEmpty(dto)) {
            return;
        }
        mcpToolApprovalsMapper.update(null, new LambdaUpdateWrapper<McpToolApprovals>()
                .in(McpToolApprovals::getToolName, dto.stream().map(McpToolApprovalsDTO::getToolName).toList())
                .eq(McpToolApprovals::getServiceId, dto.get(0).getServiceId())
                .set(McpToolApprovals::getRequireApproval, false));
    }

    @Override
    public McpTestResultVO testMcpService(@Nonnull String id) {
        log.info("Testing MCP service: {}", id);
        
        // Get service
        McpServices service = this.baseMapper.selectById(id);
        if (service == null) {
            return new McpTestResultVO(false, "MCP service not found");
        }
        
        // Create temporary client for testing
        McpClient client = McpClient.create(service);
        
        try {
            // Connect
            client.connect();
            
            // Initialize
            McpInitResult initResult = client.initialize();
            
            // List tools
            List<McpToolVO> tools = null;
            try {
                tools = client.listTools();
            } catch (Exception e) {
                log.warn("Failed to list tools: {}", e.getMessage());
                tools = new java.util.ArrayList<>();
            }
            
            // List resources
            List<McpResourceVO> resources = null;
            try {
                resources = client.listResources();
            } catch (Exception e) {
                log.warn("Failed to list resources: {}", e.getMessage());
                resources = new java.util.ArrayList<>();
            }
            
            // Build success result
            McpTestResultVO result = new McpTestResultVO();
            result.setSuccess(true);
            
            if (initResult != null && initResult.getServerInfo() != null) {
                result.setMessage(String.format("Connected successfully to %s v%s", 
                    initResult.getServerInfo().getName(),
                    initResult.getServerInfo().getVersion()));
                result.setDescription(initResult.getServerInfo().getDescription());
            } else {
                result.setMessage("Connected successfully");
            }
            
            result.setTools(tools);
            result.setResources(resources);
            
            log.info("MCP service test completed: {}, success: true", id);
            return result;
            
        } catch (Exception e) {
            log.error("MCP service test failed: {}", e.getMessage(), e);
            return new McpTestResultVO(false, "Test failed: " + e.getMessage());
        } finally {
            try {
                client.disconnect();
            } catch (Exception e) {
                log.warn("Failed to disconnect MCP client: {}", e.getMessage());
            }
        }
    }
}
