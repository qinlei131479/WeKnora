package com.iptv.system.domain;

import com.iptv.common.core.annotation.Excel;
import com.iptv.common.core.annotation.Excel.ColumnType;
import com.iptv.common.core.web.domain.BaseEntity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.apache.ibatis.type.Alias;

/**
 * 参数配置表 sys_config
 *
 * @author ruoyi
 */
@Data
public class SysConfig extends BaseEntity {
    private static final long serialVersionUID = 1L;

    /**
     * 参数主键
     */
    @Excel(name = "参数主键", cellType = ColumnType.NUMERIC)
    private Long configId;

    /**
     * 参数名称
     */

    @NotBlank(message = "{system.validation.config.name.required}")
    @Size(min = 0, max = 100, message = "{system.validation.config.name.size}")
    @Excel(name = "参数名称")
    private String configName;

    /**
     * 参数键名
     */

    @NotBlank(message = "{system.validation.config.key.required}")
    @Size(min = 0, max = 100, message = "{system.validation.config.key.size}")
    @Excel(name = "参数键名")
    private String configKey;

    /**
     * 参数键值
     */

    @NotBlank(message = "{system.validation.config.value.required}")
    @Size(min = 0, max = 500, message = "{system.validation.config.value.size}")
    @Excel(name = "参数键值")
    private String configValue;

    /**
     * 系统内置（Y是 N否）
     */
    @Excel(name = "系统内置", readConverterExp = "Y=是,N=否")
    private String configType;

    /**
     * 备注
     */
    private String remark;
}
