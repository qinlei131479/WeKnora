package com.iptv.business.domain;

import java.util.Date;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;



/**
 * <p>
 * 知识条目与标签的多对多关联
 * </p>
 *
 * @author kjsc
 * @since 2026-08-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class KnowledgeTagRelations implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 知识条目 ID
     */


    @Schema(description = "知识条目 ID")
    private String knowledgeId;

    /**
     * 标签 ID
     */


    @Schema(description = "标签 ID")
    private String tagId;

    /**
     * 创建时间
     */


    @Schema(description = "创建时间")
    private Date createdAt;
}