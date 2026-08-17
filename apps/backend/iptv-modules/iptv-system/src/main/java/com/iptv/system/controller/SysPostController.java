package com.iptv.system.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.enums.FlagEnum;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.utils.poi.ExcelUtil;
import com.iptv.common.core.web.controller.BaseController;
import com.iptv.common.core.web.domain.AjaxResult;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.InnerAuth;
import com.iptv.common.security.annotation.RequiresPermissions;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.domain.SysPost;
import com.iptv.system.service.ISysPostService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * 岗位信息操作处理
 *
 * @author ruoyi
 */
@RestController
@RequestMapping("/post")
public class SysPostController extends BaseController {
    @Autowired
    private ISysPostService postService;

    /**
     * 获取岗位列表
     */
//    @RequiresPermissions("system:post:list")
    @GetMapping("/list")
    public TableDataInfo list(SysPost post, PageDTO pageDTO) {
        return postService.selectPostList(post, pageDTO);
    }


    @Log(title = "log.title.post", businessType = BusinessType.EXPORT)
    @RequiresPermissions("system:post:export")

    @PostMapping("/export")
    public void export(HttpServletResponse response, SysPost post, PageDTO pageDTO) {
        TableDataInfo<SysPost> sysPostTableDataInfo = postService.selectPostList(post, pageDTO);
        List<SysPost> list = sysPostTableDataInfo.getRows();
        ExcelUtil<SysPost> util = new ExcelUtil<SysPost>(SysPost.class);
        util.exportExcel(response, list, MessageUtils.message("excel.sheet.post"));
    }

    /**
     * 根据岗位编号获取详细信息
     */
    @RequiresPermissions("system:post:query")
    @GetMapping(value = "/{postId}")
    public AjaxResult getInfo(@PathVariable Long postId) {
        return success(postService.selectPostById(postId));
    }

    /**
     * 新增岗位
     */
    @RequiresPermissions("system:post:add")
    @Log(title = "log.title.post", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysPost post) {
        if (!postService.checkPostNameUnique(post)) {
            return error(MessageUtils.message("system.post.add.name.exists", post.getPostName()));
        } else if (!postService.checkPostCodeUnique(post)) {
            return error(MessageUtils.message("system.post.add.code.exists", post.getPostName()));
        }
        post.setCreateBy(SecurityUtils.getUsername());
        return toAjax(postService.insertPost(post));
    }

    /**
     * 修改岗位
     */
    @RequiresPermissions("system:post:edit")
    @Log(title = "log.title.post", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysPost post) {
        if (!postService.checkPostNameUnique(post)) {
            return error(MessageUtils.message("system.post.edit.name.exists", post.getPostName()));
        } else if (!postService.checkPostCodeUnique(post)) {
            return error(MessageUtils.message("system.post.edit.code.exists", post.getPostName()));
        }
        post.setUpdateBy(SecurityUtils.getUsername());
        int rows = postService.updatePost(post);
        return toAjax(rows, post);
    }

    /**
     * 删除岗位
     */
    @RequiresPermissions("system:post:remove")
    @Log(title = "log.title.post", businessType = BusinessType.DELETE)
    @DeleteMapping("/{postIds}")
    public AjaxResult remove(@PathVariable Long[] postIds) {
        List<SysPost> posts = new ArrayList<>();
        for (Long postId : postIds) {
            posts.add(postService.getById(postId));
        }
        return toAjax(postService.deletePostByIds(postIds), posts);
    }

    /**
     * 获取岗位选择框列表
     */
    @GetMapping("/optionselect")
    public AjaxResult optionselect() {
        List<SysPost> posts = postService.selectPostAll();
        return success(posts);
    }

    /**
     * 根据用户ID获取岗位信息列表
     */
    @InnerAuth
    @GetMapping("/getByUserId")
    public R<SysPost> getByUserId(@RequestParam("userId") Long userId) {
        SysPost post = postService.getPostByUserId(userId);
        return R.ok(post);
    }
}
