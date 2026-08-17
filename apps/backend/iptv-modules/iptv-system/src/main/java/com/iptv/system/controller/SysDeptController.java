package com.iptv.system.controller;

import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.iptv.common.core.constant.UserConstants;
import com.iptv.common.core.enums.FlagEnum;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.core.web.controller.BaseController;
import com.iptv.common.core.web.domain.AjaxResult;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.domain.SysDept;
import com.iptv.system.service.ISysDeptService;
import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 部门信息
 * 
 * @author iptv
 */
@RestController
@RequestMapping("/dept")
public class SysDeptController extends BaseController
{
    @Autowired
    private ISysDeptService deptService;

    /**
     * 获取部门列表
     */
//    @RequiresPermissions("system:dept:list")
    @GetMapping("/list")
    public AjaxResult list(SysDept dept)
    {
        List<SysDept> depts = deptService.selectDeptList(dept);
        return success(depts);
    }

    /**
     * 查询部门列表（排除节点）
     */
    @RequiresPermissions("system:dept:list")
    @GetMapping("/list/exclude/{deptId}")
    public AjaxResult excludeChild(@PathVariable(value = "deptId", required = false) Long deptId)
    {
        List<SysDept> depts = deptService.selectDeptList(new SysDept());
        depts.removeIf(d -> d.getDeptId().intValue() == deptId || ArrayUtils.contains(StringUtils.split(d.getAncestors(), ","), deptId + ""));
        return success(depts);
    }

    /**
     * 根据部门编号获取详细信息
     */
    @RequiresPermissions("system:dept:query")
    @GetMapping(value = "/{deptId}")
    public AjaxResult getInfo(@PathVariable Long deptId)
    {
        deptService.checkDeptDataScope(deptId);
        return success(deptService.selectDeptById(deptId));
    }

    /**
     * 新增部门
     */
    @RequiresPermissions("system:dept:add")
    @Log(title = "log.title.dept", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysDept dept)
    {
        if (!deptService.checkDeptNameUnique(dept))
        {
            return error(MessageUtils.message("system.dept.add.name.exists", dept.getDeptName()));
        }
        dept.setCreateBy(SecurityUtils.getUsername());
        return toAjax(deptService.insertDept(dept));
    }

    /**
     * 修改部门
     */
    @RequiresPermissions("system:dept:edit")
    @Log(title = "log.title.dept", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysDept dept)
    {
        Long deptId = dept.getDeptId();
        deptService.checkDeptDataScope(deptId);
        if (!deptService.checkDeptNameUnique(dept))
        {
            return error(MessageUtils.message("system.dept.edit.name.exists", dept.getDeptName()));
        }
        else if (dept.getParentId().equals(deptId))
        {
            return error(MessageUtils.message("system.dept.edit.parent.self", dept.getDeptName()));
        }
        else if (StringUtils.equals(UserConstants.DEPT_DISABLE, dept.getStatus()) && deptService.selectNormalChildrenDeptById(deptId) > 0)
        {
            return error(MessageUtils.message("system.dept.has.active.children"));
        }
        dept.setUpdateBy(SecurityUtils.getUsername());
        int i = deptService.updateDept(dept);
        return toAjax(i,dept);
    }

    /**
     * 删除部门
     */
    @RequiresPermissions("system:dept:remove")
    @Log(title = "log.title.dept", businessType = BusinessType.DELETE)
    @DeleteMapping("/{deptId}")
    public AjaxResult remove(@PathVariable Long deptId)
    {
        if (deptService.hasChildByDeptId(deptId))
        {
            return warn(MessageUtils.message("system.dept.has.children"));
        }
        if (deptService.checkDeptExistUser(deptId))
        {
            return warn(MessageUtils.message("system.dept.has.users"));
        }
        deptService.checkDeptDataScope(deptId);
        SysDept dept = deptService.selectDeptById(deptId);
        return toAjax(deptService.deleteDeptById(deptId),dept);
    }
}
