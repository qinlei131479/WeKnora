package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Date;
import java.util.List;

/**
 * FAQ条目视图对象
 *
 * @author iptv
 * @since 2026-01-27
 */
@Data
@Schema(description = "FAQ条目视图对象")
public class FAQEntryVO {

    @Schema(description = "分块ID")
    private String id;

    @Schema(description = "标准问题")
    private String standardQuestion;

    @Schema(description = "相似问题列表")
    private List<String> similarQuestions;

    @Schema(description = "反例子问题列表")
    private List<String> negativeQuestions;

    @Schema(description = "答案列表")
    private List<String> answers;

    @Schema(description = "标签ID")
    private String tagId;

    @Schema(description = "标签名称")
    private String tagName;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "更新时间")
    private Date updatedAt;
}
