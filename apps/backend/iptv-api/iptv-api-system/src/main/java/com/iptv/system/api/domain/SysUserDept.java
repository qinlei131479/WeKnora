package com.iptv.system.api.domain;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

/**
 * <p>
 * 用户与部门关联表
 * </p>
 *
 * @author kjsc
 * @since 2024-12-23
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class SysUserDept implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 部门ID
     */
    private Long deptId;

}
