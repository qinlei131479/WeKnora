package com.iptv.system.api.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.iptv.common.core.web.domain.BaseEntity;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 部门表 sys_dept
 *
 * @author ruoyi
 */
@Data
public class SysDept extends BaseEntity {
    private static final long serialVersionUID = 1L;

    /**
     * 部门ID
     */
    @TableId(type = IdType.AUTO)
    private Long deptId;

    /**
     * 父部门ID
     */
    private Long parentId;

    /**
     * 祖级列表
     */
    private String ancestors;

    /**
     * 部门名称
     */
    @NotBlank(message = "{system.validation.dept.name.required}")
    @Size(min = 0, max = 30, message = "{system.validation.dept.name.size}")
    private String deptName;

    /**
     * 显示顺序
     */
    @NotNull(message = "{system.validation.order.required}")
    private Integer orderNum;

    /**
     * 负责人
     */
    private String leader;

    /**
     * 联系电话
     */
    @Size(min = 0, max = 11, message = "{system.validation.phone.size}")
    private String phone;

    /**
     * 邮箱
     */
    @Email(message = "{system.validation.email.invalid}")
    @Size(min = 0, max = 50, message = "{system.validation.email.size}")
    private String email;

    /**
     * 部门状态:0正常,1停用
     */
    private String status;

    /**
     * 隐藏标志（0代表存在 2代表删除）
     */
    private Integer hideDept;


    /**
     * 删除标志（0代表存在 2代表删除）
     */
    private String delFlag;

    /**
     * 钉钉部门ID
     */
    private String ddDeptId;

    /**
     * 钉钉父部门ID
     */
    private String ddParentId;

    /**
     * 数据来源：0：系统创建，1：从钉钉同步
     */
    private Integer sourceType;

    /**
     * 描述
     */
    private String description;

    /**
     * 子部门
     */
    @TableField(exist = false)
    private List<SysDept> children = new ArrayList<SysDept>();
}
