package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.AmpBuiltinTools;
import com.iptv.business.domain.dto.AmpBuiltinToolsDTO;
import com.iptv.business.domain.dto.page.AmpBuiltinToolsPageDTO;
import com.iptv.business.domain.vo.AmpBuiltinToolsVO;
import com.iptv.business.pgmapper.AmpBuiltinToolsMapper;
import com.iptv.business.service.AmpBuiltinToolsService;
import com.iptv.common.core.enums.EnableEnum;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * Harness 内置工具只读目录，用于统一预览、依赖解析和统计 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
@Service
public class AmpBuiltinToolsServiceImpl extends ServiceImpl<AmpBuiltinToolsMapper, AmpBuiltinTools> implements AmpBuiltinToolsService {

    @Override
    public TableDataInfo<AmpBuiltinToolsVO> queryPage(AmpBuiltinToolsPageDTO dto, PageDTO pg) {
        Page<AmpBuiltinToolsVO> page = PageUtils.toPage(pg);
        List<AmpBuiltinTools> list = this.baseMapper.queryPage(dto, page);
        List<AmpBuiltinToolsVO> voList = BeanUtil.copyToList(list, AmpBuiltinToolsVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public AmpBuiltinToolsVO queryById(@Nonnull String id) {
        AmpBuiltinTools entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, AmpBuiltinToolsVO.class);
    }

//    @Override
//    @Transactional(rollbackFor = Exception.class)
//    public AmpBuiltinToolsVO insert(@Nonnull AmpBuiltinToolsDTO dto) {
//        AmpBuiltinTools entity = BeanUtil.copyProperties(dto, AmpBuiltinTools.class);
//        this.baseMapper.insert(entity);
//        return BeanUtil.copyProperties(entity, AmpBuiltinToolsVO.class);
//    }

//    @Override
//    @Transactional(rollbackFor = Exception.class)
//    public AmpBuiltinToolsVO update(@Nonnull AmpBuiltinToolsDTO dto) {
//        AmpBuiltinTools entity = this.baseMapper.selectById(dto.getId());
//        if (BeanUtil.isEmpty(entity)) {
//            throw new ServiceException("Harness 内置工具只读目录，用于统一预览、依赖解析和统计不存在");
//        }
//        BeanUtil.copyProperties(dto, entity);
//        this.baseMapper.updateById(entity);
//        return BeanUtil.copyProperties(entity, AmpBuiltinToolsVO.class);
//    }

//    @Override
//    @Transactional(rollbackFor = Exception.class)
//    public void deleteById(@Nonnull String id) {
//        AmpBuiltinTools entity = this.baseMapper.selectById(id);
//        if (BeanUtil.isNotEmpty(entity)) {
//            this.baseMapper.deleteById(id);
//        }
//    }

//    @Override
//    @Transactional(rollbackFor = Exception.class)
//    public int updateEnabledBatch(@Nonnull List<String> ids) {
//        if (ids.isEmpty()) return 0;
//        return this.baseMapper.update(new LambdaUpdateWrapper<AmpBuiltinTools>()
//                .in(AmpBuiltinTools::getId, ids)
//                .set(AmpBuiltinTools::getEnabled, EnableEnum.ENABLE.getCode()));
//    }

//    @Override
//    @Transactional(rollbackFor = Exception.class)
//    public int updateDisabledBatch(@Nonnull List<String> ids) {
//        if (ids.isEmpty()) return 0;
//        return this.baseMapper.update(new LambdaUpdateWrapper<AmpBuiltinTools>()
//                .in(AmpBuiltinTools::getId, ids)
//                .set(AmpBuiltinTools::getEnabled, EnableEnum.DISABLE.getCode()));
//    }
}
