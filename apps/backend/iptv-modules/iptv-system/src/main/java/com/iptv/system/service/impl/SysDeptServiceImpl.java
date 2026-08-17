package com.iptv.system.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.common.core.constant.UserConstants;
import com.iptv.common.core.enums.DelFlagEnum;
import com.iptv.common.core.enums.FlagEnum;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.text.Convert;
import com.iptv.common.core.utils.SpringUtils;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.datascope.annotation.DataScope;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.domain.SysDept;
import com.iptv.system.api.domain.SysRole;
import com.iptv.system.api.domain.SysUser;
import com.iptv.system.api.domain.SysUserDept;
import com.iptv.system.domain.vo.TreeSelect;
import com.iptv.system.mapper.SysDeptMapper;
import com.iptv.system.mapper.SysRoleMapper;
import com.iptv.system.mapper.SysUserDeptMapper;
import com.iptv.system.mapper.SysUserMapper;
import com.iptv.system.service.ISysDeptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 部门管理 服务实现
 *
 * @author ruoyi
 */
@Service
public class SysDeptServiceImpl extends ServiceImpl<SysDeptMapper, SysDept> implements ISysDeptService {

    @Autowired
    private SysRoleMapper roleMapper;

    @Autowired
    private SysUserDeptMapper sysUserDeptMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    /**
     * 查询部门管理数据
     *
     * @param dept 部门信息
     * @return 部门信息集合
     */
    @Override
    @DataScope(deptAlias = "d")
    public List<SysDept> selectDeptList(SysDept dept) {
        return this.baseMapper.selectDeptList(dept);
    }

    /**
     * 查询部门树结构信息
     *
     * @param dept 部门信息
     * @return 部门树信息集合
     */
    @Override
    public List<TreeSelect> selectDeptTreeList(SysDept dept) {
        List<SysDept> depts = selectDeptList(dept);
        return buildDeptTreeSelect(depts);
    }

    /**
     * 构建前端所需要树结构
     *
     * @param depts 部门列表
     * @return 树结构列表
     */
    @Override
    public List<SysDept> buildDeptTree(List<SysDept> depts) {
        List<SysDept> returnList = new ArrayList<SysDept>();
        List<Long> tempList = depts.stream().map(SysDept::getDeptId).collect(Collectors.toList());
        for (SysDept dept : depts) {
            // 如果是顶级节点, 遍历该父节点的所有子节点
            if (!tempList.contains(dept.getParentId())) {
                recursionFn(depts, dept);
                returnList.add(dept);
            }
        }
        if (returnList.isEmpty()) {
            returnList = depts;
        }
        return returnList;
    }

    /**
     * 构建前端所需要下拉树结构
     *
     * @param depts 部门列表
     * @return 下拉树结构列表
     */
    @Override
    public List<TreeSelect> buildDeptTreeSelect(List<SysDept> depts) {
        List<SysDept> deptTrees = buildDeptTree(depts);
        return deptTrees.stream().map(TreeSelect::new).collect(Collectors.toList());
    }

    /**
     * 根据角色ID查询部门树信息
     *
     * @param roleId 角色ID
     * @return 选中部门列表
     */
    @Override
    public List<Long> selectDeptListByRoleId(Long roleId) {
        SysRole role = roleMapper.selectRoleById(roleId);
        return this.baseMapper.selectDeptListByRoleId(roleId, role.isDeptCheckStrictly());
    }

    /**
     * 根据部门ID查询信息
     *
     * @param deptId 部门ID
     * @return 部门信息
     */
    @Override
    public SysDept selectDeptById(Long deptId) {
        return this.baseMapper.selectDeptById(deptId);
    }

    /**
     * 根据ID查询所有子部门（正常状态）
     *
     * @param deptId 部门ID
     * @return 子部门数
     */
    @Override
    public int selectNormalChildrenDeptById(Long deptId) {
        return this.baseMapper.selectNormalChildrenDeptById(deptId);
    }

    /**
     * 是否存在子节点
     *
     * @param deptId 部门ID
     * @return 结果
     */
    @Override
    public boolean hasChildByDeptId(Long deptId) {
        int result = this.baseMapper.hasChildByDeptId(deptId);
        return result > 0;
    }

    /**
     * 查询部门是否存在用户
     *
     * @param deptId 部门ID
     * @return 结果 true 存在 false 不存在
     */
    @Override
    public boolean checkDeptExistUser(Long deptId) {
        int result = this.baseMapper.checkDeptExistUser(deptId);
        return result > 0;
    }

    /**
     * 校验部门名称是否唯一
     *
     * @param dept 部门信息
     * @return 结果
     */
    @Override
    public boolean checkDeptNameUnique(SysDept dept) {
        Long deptId = StringUtils.isNull(dept.getDeptId()) ? -1L : dept.getDeptId();
        SysDept info = this.baseMapper.checkDeptNameUnique(dept.getDeptName(), dept.getParentId());
        if (StringUtils.isNotNull(info) && info.getDeptId().longValue() != deptId.longValue()) {
            return UserConstants.NOT_UNIQUE;
        }
        return UserConstants.UNIQUE;
    }

    /**
     * 校验部门是否有数据权限
     *
     * @param deptId 部门id
     */
    @Override
    public void checkDeptDataScope(Long deptId) {
        if (!SecurityUtils.isAdmin() && StringUtils.isNotNull(deptId)) {
            SysDept dept = new SysDept();
            dept.setDeptId(deptId);
            List<SysDept> depts = SpringUtils.getAopProxy(this).selectDeptList(dept);
            if (StringUtils.isEmpty(depts)) {
                throw new ServiceException("system.dept.scope.denied");
            }
        }
    }

    /**
     * 新增保存部门信息
     *
     * @param dept 部门信息
     * @return 结果
     */
    @Override
    public int insertDept(SysDept dept) {
        SysDept info = this.baseMapper.selectDeptById(dept.getParentId());
        // 如果父节点不为正常状态,则不允许新增子节点
        if (!UserConstants.DEPT_NORMAL.equals(info.getStatus())) {
            throw new ServiceException("system.dept.disabled");
        }
        dept.setAncestors(info.getAncestors() + "," + dept.getParentId());
        return this.baseMapper.insertDept(dept);
    }

    /**
     * 修改保存部门信息
     *
     * @param dept 部门信息
     * @return 结果
     */
    @Override
    public int updateDept(SysDept dept) {
        SysDept newParentDept = this.baseMapper.selectDeptById(dept.getParentId());
        SysDept oldDept = this.baseMapper.selectDeptById(dept.getDeptId());
        if (StringUtils.isNotNull(newParentDept) && StringUtils.isNotNull(oldDept)) {
            String newAncestors = newParentDept.getAncestors() + "," + newParentDept.getDeptId();
            String oldAncestors = oldDept.getAncestors();
            dept.setAncestors(newAncestors);
            updateDeptChildren(dept.getDeptId(), newAncestors, oldAncestors);
        }
        int result = this.baseMapper.updateDept(dept);
        if (UserConstants.DEPT_NORMAL.equals(dept.getStatus()) && StringUtils.isNotEmpty(dept.getAncestors())
                && !StringUtils.equals("0", dept.getAncestors())) {
            // 如果该部门是启用状态，则启用该部门的所有上级部门
            updateParentDeptStatusNormal(dept);
        }
        return result;
    }

    /**
     * 修改该部门的父级部门状态
     *
     * @param dept 当前部门
     */
    private void updateParentDeptStatusNormal(SysDept dept) {
        String ancestors = dept.getAncestors();
        Long[] deptIds = Convert.toLongArray(ancestors);
        this.baseMapper.updateDeptStatusNormal(deptIds);
    }

    /**
     * 修改子元素关系
     *
     * @param deptId       被修改的部门ID
     * @param newAncestors 新的父ID集合
     * @param oldAncestors 旧的父ID集合
     */
    public void updateDeptChildren(Long deptId, String newAncestors, String oldAncestors) {
        List<SysDept> children = this.baseMapper.selectChildrenDeptById(deptId);
        for (SysDept child : children) {
            child.setAncestors(child.getAncestors().replaceFirst(oldAncestors, newAncestors));
        }
        if (children.size() > 0) {
            this.baseMapper.updateDeptChildren(children);
        }
    }

    /**
     * 删除部门管理信息
     *
     * @param deptId 部门ID
     * @return 结果
     */
    @Override
    public int deleteDeptById(Long deptId) {
        return this.baseMapper.deleteDeptById(deptId);
    }

    /**
     * 递归列表
     */
    private void recursionFn(List<SysDept> list, SysDept t) {
        // 得到子节点列表
        List<SysDept> childList = getChildList(list, t);
        t.setChildren(childList);
        for (SysDept tChild : childList) {
            if (hasChild(list, tChild)) {
                recursionFn(list, tChild);
            }
        }
    }

    /**
     * 得到子节点列表
     */
    private List<SysDept> getChildList(List<SysDept> list, SysDept t) {
        List<SysDept> tlist = new ArrayList<SysDept>();
        Iterator<SysDept> it = list.iterator();
        while (it.hasNext()) {
            SysDept n = (SysDept) it.next();
            if (StringUtils.isNotNull(n.getParentId()) && n.getParentId().longValue() == t.getDeptId().longValue()) {
                tlist.add(n);
            }
        }
        return tlist;
    }

    /**
     * 判断是否有子节点
     */
    private boolean hasChild(List<SysDept> list, SysDept t) {
        return getChildList(list, t).size() > 0 ? true : false;
    }

    @Override
    public List<TreeSelect> userDeptTree(SysDept dept) {
        if (ObjectUtil.isNull(dept)) {
            dept = new SysDept();
        }
        dept.setHideDept(1);
        List<TreeSelect> treeSelects = selectDeptTreeList(dept);
        // 添加部门标识
        setDeptFlag(treeSelects);
        List<SysUserDept> userDeptList = sysUserDeptMapper.selectList(new LambdaQueryWrapper<>());
        List<Long> users = userDeptList.stream().map(SysUserDept::getUserId).distinct().collect(Collectors.toList());
        List<SysUser> sysUsers = new ArrayList<>();
        if (CollUtil.isNotEmpty(users)) {
            sysUsers = sysUserMapper.selectList(new LambdaQueryWrapper<SysUser>().in(SysUser::getUserId, users)
                    .ne(SysUser::getHiddenFlag, dept.getHideDept()));
        }
        Map<Long, SysUser> userIdMap = CollUtil.toMap(sysUsers, new HashMap<>(), SysUser::getUserId);
        Map<Long, List<SysUserDept>> collect = userDeptList.stream().collect(Collectors.groupingBy(SysUserDept::getDeptId, Collectors.toList()));
        Map<Long, List<SysUser>> userMap = collect.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, x -> {
            return x.getValue().stream().map(y -> {
                return userIdMap.get(y.getUserId());
            }).collect(Collectors.toList());
        }));
        // 给部门添加用户
        recursionDept(treeSelects, userMap);
        return treeSelects;
    }

    private void setDeptFlag(List<TreeSelect> list) {
        if (CollUtil.isNotEmpty(list)) {
            for (TreeSelect treeSelect : list) {
                treeSelect.getOther().put("dataType", "dept");
                setDeptFlag(treeSelect.getChildren());
            }
        }
    }

    private void recursionDept(List<TreeSelect> list, Map<Long, List<SysUser>> userMap) {
        if (CollUtil.isNotEmpty(list)) {
            for (TreeSelect treeSelect : list) {
                if (StrUtil.equals("dept", StrUtil.toString(treeSelect.getOther().get("dataType")))) {
                    recursionDept(treeSelect.getChildren(), userMap);
                    // 查询当前部门下面的人, 添加到下面
                    List<SysUser> sysUsers = userMap.get(treeSelect.getId());
                    if (CollUtil.isNotEmpty(sysUsers)) {
                        for (SysUser sysUser : sysUsers) {
                            if (ObjectUtil.isNotNull(sysUser)) {
                                TreeSelect treeSelect1 = new TreeSelect();
                                treeSelect1.setId(sysUser.getUserId());
                                treeSelect1.setLabel(sysUser.getNickName() + "(" + sysUser.getTitle() + ")");
                                treeSelect1.getOther().put("dataType", "user");
                                Map<String, Object> stringObjectMap = BeanUtil.beanToMap(sysUser);
                                treeSelect1.getOther().putAll(stringObjectMap);
                                if (ObjectUtil.isNull(treeSelect.getChildren())) {
                                    treeSelect.setChildren(new ArrayList<>());
                                }
                                treeSelect.getChildren().add(treeSelect1);
                            }
                        }
                    }
                }
            }
        }
    }

    @Override
    public List<SysDept> selectDeptAll() {
        return this.baseMapper.selectList(new LambdaQueryWrapper<SysDept>()
                .eq(SysDept::getStatus, FlagEnum.NO.getCodeStr())
                .eq(SysDept::getDelFlag, DelFlagEnum.NORMAL.getCodeStr())
                .eq(SysDept::getHideDept, FlagEnum.NO.getCode()));
    }

    @Override
    public List<Long> selectDeptListByUserId(Long userId) {
        return sysUserDeptMapper.selectList(new LambdaQueryWrapper<SysUserDept>()
                        .eq(SysUserDept::getUserId, userId))
                .stream()
                .map(SysUserDept::getDeptId)
                .toList();
    }
}
