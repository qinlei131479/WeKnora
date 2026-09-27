package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.digest.DigestUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.business.domain.Resources;
import com.iptv.business.domain.SkillCatalog;
import com.iptv.business.domain.StorageBackends;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.dto.SkillCatalogFileSaveDTO;
import com.iptv.business.domain.dto.SkillCatalogSourceDTO;
import com.iptv.business.domain.dto.page.SkillCatalogPageDTO;
import com.iptv.business.domain.vo.SkillCatalogVO;
import com.iptv.business.pgmapper.ResourcesMapper;
import com.iptv.business.pgmapper.SkillCatalogMapper;
import com.iptv.business.pgmapper.StorageBackendsMapper;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.service.SkillCatalogService;
import com.iptv.business.service.StorageBackendFileServiceFactory;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.yaml.snakeyaml.Yaml;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

/**
 * 技能目录定义服务实现类（与 Go 端 tenant_skill_catalog / skill bundle 管线互通）
 *
 * @author kjsc
 * @since 2026-09-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SkillCatalogServiceImpl implements SkillCatalogService {

    private final SkillCatalogMapper skillCatalogMapper;
    private final TenantsMapper tenantsMapper;
    private final StorageBackendsMapper storageBackendsMapper;
    private final ResourcesMapper resourcesMapper;
    private final StorageBackendFileServiceFactory storageBackendFileServiceFactory;

    /**
     * 内置技能书租户 ID（tenant_id=0，管理后台新增的技能书均为内置技能书）；
     * bundle_ref 直连存储格式 minio://{bucket}/{tenantId}/tenant-skills/catalog/{name}.zip，
     * 存储-{}-后端取同租户（tenant_id=0）的 StorageBackends，不注册 resources 记录
     */
    private static final long BUILTIN_TENANT_ID = 0L;

    /**
     * 资源引用前缀（对齐 Go types.ResourceScheme）
     */
    private static final String RESOURCE_REF_PREFIX = "resource://";

    /**
     * 资源 handle 长度（对齐 Go types.ResourceHandleLength：16 字节 base64url 无填充）
     */
    private static final int RESOURCE_HANDLE_LENGTH = 22;

    /**
     * bundle zip 下载/上传大小上限（字节，对齐 Go MAX_SKILL_BUNDLE_SIZE_MB 默认 256）
     */
    private static final long MAX_BUNDLE_BYTES = 256L * 1024 * 1024;

    /**
     * zip 条目总数上限（对齐 Go maxSkillBundleZipEntries）
     */
    private static final int MAX_ZIP_ENTRIES = 100_000;

    /**
     * 技能文件数上限（对齐 Go maxSkillBundleFiles）
     */
    private static final int MAX_FILES = 20_000;

    /**
     * 单文件大小上限（字节，对齐 Go 32MiB）
     */
    private static final long MAX_FILE_BYTES = 32L * 1024 * 1024;

    /**
     * 解压后文件总大小上限（字节，对齐 Go 512MiB）
     */
    private static final long MAX_TOTAL_BYTES = 512L * 1024 * 1024;

    /**
     * 远程拉取超时时间（毫秒，对齐 Go skillSourceFetchTimeout 简化为 60s）
     */
    private static final int FETCH_TIMEOUT_MILLIS = 60 * 1000;

    /**
     * registry handoff 最大跳数（对齐 Go skillSourceMaxHops）
     */
    private static final int MAX_HANDOFF_HOPS = 3;

    /**
     * 默认技能注册中心（对齐 Go defaultSkillRegistryOrigin）
     */
    private static final String DEFAULT_REGISTRY_ORIGIN = "https://clawhub.ai";

    /**
     * skills-sh 定位器前缀（对齐 Go skillsShRefPrefix）
     */
    private static final String SKILLS_SH_REF_PREFIX = "skills-sh:";

    /**
     * 可读取的文本文件后缀白名单（SKILL.md 恒可读取）
     */
    private static final Set<String> TEXT_FILE_EXTENSIONS = Set.of(
            ".md", ".txt", ".py", ".js", ".ts", ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
            ".xml", ".html", ".css", ".sql", ".sh", ".bat", ".ps1", ".env", ".csv", ".tsv", ".rst", ".ipynb",
            ".vue", ".jsx", ".tsx"
    );

    /**
     * SKILL.md frontmatter 解析正则
     */
    private static final Pattern FRONTMATTER_PATTERN = Pattern.compile(
            "^---\\s*\\n(.*?)\\n---\\s*\\n", Pattern.DOTALL);

    /**
     * 技能名称长度上限
     */
    private static final int MAX_NAME_LENGTH = 64;

    /**
     * 技能描述长度上限
     */
    private static final int MAX_DESCRIPTION_LENGTH = 1024;

    /**
     * 技能名称语义化版本判断（对齐 Go semverLike）
     */
    private static final Pattern SEMVER_LIKE = Pattern.compile("^v?\\d+\\.\\d+(\\.\\d+)?([.-][0-9A-Za-z.-]+)?$");

    /**
     * 技能名称校验（对齐 Go frontmatter name：字母数字连字符，含中文）
     */
    private static final Pattern SKILL_NAME_PATTERN = Pattern.compile("^[\\p{L}\\p{N}-]+$");

    /**
     * 技能名称保留字
     */
    private static final List<String> RESERVED_WORDS = List.of("anthropic", "claude", "assistant", "help");

    /**
     * 技能来源类型
     */
    private enum SourceKind {REGISTRY, SKILLS_SH, GITHUB, GITLAB, DIRECT}

    /**
     * 解析后的技能来源（对齐 Go parsedSkillSource）
     */
    private record ParsedSource(SourceKind kind, String registry, String slug, String version,
                                String owner, String repo, String ref, String subdir, String directUrl) {
    }

    /**
     * 技能 bundle 解析结果（对齐 Go SkillBundle）
     */
    private record SkillBundle(String name, String version, String description, String instructions,
                               Map<String, byte[]> files) {
    }

    /**
     * bundle 引用解析结果：backend 为存储后端配置，objectKey 为可直读的对象键，resource 为资源记录（旧格式引用时为 null）
     */
    private record BundleLocation(StorageBackends backend, String objectKey, Resources resource) {
    }

    // ==================================================================
    // 查询类
    // ==================================================================

    @Override
    public TableDataInfo<SkillCatalogVO> queryPage(@Nonnull SkillCatalogPageDTO dto, PageDTO pg) {
        Page<SkillCatalog> page = PageUtils.toPage(pg);
        List<SkillCatalog> list = skillCatalogMapper.queryPage(dto, page);
        // 批量查询租户信息，避免列表逐行点查（N+1）
        Map<Integer, Tenants> tenantMap = new HashMap<>();
        Set<Long> tenantIds = list.stream()
                .map(SkillCatalog::getTenantId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (!tenantIds.isEmpty()) {
            List<Integer> ids = tenantIds.stream().map(Long::intValue).collect(Collectors.toList());
            for (Tenants tenant : tenantsMapper.selectBatchIds(ids)) {
                if (tenant.getDeletedAt() == null) {
                    tenantMap.put(tenant.getId(), tenant);
                }
            }
        }
        List<SkillCatalogVO> voList = new ArrayList<>();
        for (SkillCatalog entity : list) {
            voList.add(toVO(entity, false, tenantMap));
        }
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public SkillCatalogVO detail(@Nonnull String id) {
        SkillCatalog entity = getRequiredCatalog(id);
        return toVO(entity, true);
    }

    @Override
    public Map<String, Object> readFile(@Nonnull String id, @Nonnull String path) {
        SkillCatalog entity = getRequiredCatalog(id);
        String rel = normalizeRelativePath(path);
        Map<String, byte[]> files = loadBundleFiles(entity);
        byte[] content = files.get(rel);
        if (content == null) {
            throw new ServiceException("文件不存在: " + rel);
        }
        if (!isTextPath(rel)) {
            throw new ServiceException("仅支持读取文本文件");
        }
        Map<String, Object> result = new HashMap<>();
        result.put("path", rel);
        result.put("content", new String(content, StandardCharsets.UTF_8));
        return result;
    }

    // ==================================================================
    // 上传 / 远程拉取
    // ==================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SkillCatalogVO upload(@Nonnull MultipartFile file) {
        String filename = StrUtil.nullToEmpty(file.getOriginalFilename()).toLowerCase();
        boolean isZip = filename.endsWith(".zip");
        boolean isSkillMd = filename.endsWith("skill.md");
        if (!isZip && !isSkillMd) {
            throw new ServiceException("仅支持上传 .zip 或 SKILL.md 文件");
        }
        if (file.getSize() > MAX_BUNDLE_BYTES) {
            throw new ServiceException("技能包大小不能超过 " + MAX_BUNDLE_BYTES / 1024 / 1024 + "MB");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ServiceException("读取上传文件失败: " + e.getMessage());
        }
        // SKILL.md 文本上传时先归一化为单文件 zip（对齐 Go normalizeFetchedSkill 文本分支）
        if (isSkillMd) {
            bytes = zipSkillFiles(new LinkedHashMap<>(Map.of("SKILL.md", bytes)));
        }
        SkillBundle bundle = parseSkillBundle(bytes);
        return upsertCatalog(bundle, bytes);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SkillCatalogVO pullFromSource(@Nonnull SkillCatalogSourceDTO dto) {
        ParsedSource parsed = parseSkillSource(dto.getSource());
        FetchedSource fetched = fetchWithHandoff(parsed, 0, StrUtil.nullToEmpty(parsed.registry()));
        SkillBundle bundle = normalizeToBundle(fetched.body(), fetched.contentType(), fetched.subdir());
        byte[] archive = zipSkillFiles(bundle.files());
        return upsertCatalog(bundle, archive);
    }

    // ==================================================================
    // SKILL.md 修改 / 删除
    // ==================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveSkillMd(@Nonnull SkillCatalogFileSaveDTO dto) {
        SkillCatalog entity = getRequiredCatalog(dto.getId());
        String rel = normalizeRelativePath(dto.getPath());
        if (!"SKILL.md".equals(rel)) {
            throw new ServiceException("当前仅支持保存根级 SKILL.md");
        }
        Map<String, byte[]> files = loadBundleFiles(entity);
        if (!files.containsKey("SKILL.md")) {
            throw new ServiceException("技能 bundle 缺少 SKILL.md");
        }
        // frontmatter name 必须与技能名称一致，避免重打包后目录名漂移
        Map<String, Object> metadata = parseFrontmatter(dto.getContent());
        String name = getStringValue(metadata, "name");
        if (!StrUtil.equals(name, entity.getName())) {
            throw new ServiceException("SKILL.md frontmatter name 必须与技能名称一致: " + entity.getName());
        }
        files.put("SKILL.md", dto.getContent().getBytes(StandardCharsets.UTF_8));
        byte[] archive = zipSkillFiles(files);
        SkillBundle bundle = new SkillBundle(
                entity.getName(),
                StrUtil.blankToDefault(getStringValue(metadata, "version"), entity.getVersion()),
                StrUtil.blankToDefault(getStringValue(metadata, "description"), entity.getDescription()),
                extractInstructions(dto.getContent()),
                files);
        updateCatalogBundle(entity, bundle, archive);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(@Nonnull String id) {
        SkillCatalog entity = getRequiredCatalog(id);
        // 存在安装引用时拒绝删除（与 Go DeleteCatalog 行为一致）
        long refs = skillCatalogMapper.countInstallRefs(entity.getId());
        if (refs > 0) {
            throw new ServiceException("请先从所有沙箱卸载该技能后再删除");
        }
        skillCatalogMapper.deleteById(id);
        // 尽力清理 bundle 对象与资源记录（失败仅告警）
        purgeBundleRef(entity.getBundleRef());
    }

    // ==================================================================
    // upsert 与存储
    // ==================================================================

    /**
     * 按名称 upsert 技能目录定义；
     * 管理后台新增均为内置技能书（tenant_id=0），bundle_ref 直连存储；
     * tenant_id≠0 时走 resource:// 资源注册逻辑
     */
    private SkillCatalogVO upsertCatalog(SkillBundle bundle, byte[] archive) {
        SkillCatalog existing = skillCatalogMapper.selectOne(new LambdaQueryWrapper<SkillCatalog>()
                .eq(SkillCatalog::getName, bundle.name())
                .eq(SkillCatalog::getTenantId, BUILTIN_TENANT_ID)
                .isNull(SkillCatalog::getDeletedAt)
                .last("limit 1"));
        if (existing != null) {
            updateCatalogBundle(existing, bundle, archive);
            return toVO(existing, false);
        }
        SkillCatalog entity = new SkillCatalog();
        entity.setId(UUID.randomUUID().toString());
        entity.setTenantId(BUILTIN_TENANT_ID);
        entity.setName(bundle.name());
        entity.setVersion(bundle.version());
        entity.setDescription(bundle.description());
        entity.setInstructions(bundle.instructions());
        entity.setCreatedAt(new Date());
        entity.setUpdatedAt(new Date());
        // 先存对象再写库；插入失败时回滚已写入的对象（资源记录随事务回滚）
        StorageBackends backend = resolveBuiltinBackend();
        String objectKey = builtinObjectKey(bundle.name());
        String providerPath = storageBackendFileServiceFactory.saveBytes(backend, objectKey, archive);
        // 内置直连格式：saveBytes 返回值即 minio://{bucket}/{key} 或 local://{key}
        entity.setBundleRef(providerPath);
        entity.setBundleSha256(DigestUtil.sha256Hex(archive));
        try {
            skillCatalogMapper.insert(entity);
        } catch (Exception e) {
            storageBackendFileServiceFactory.deleteObject(backend, objectKey);
            // 并发上传同名技能触发 (tenant_id, name) 唯一索引冲突时给出业务提示
            if (isDuplicateKeyError(e)) {
                throw new ServiceException("技能已存在，请刷新列表后编辑已有技能");
            }
            throw e;
        }
        return toVO(entity, false);
    }

    /**
     * 判断异常链中是否为唯一键冲突（并发插入同名技能等场景）
     */
    private boolean isDuplicateKeyError(Throwable e) {
        Throwable cause = e;
        while (cause != null) {
            if (cause instanceof org.springframework.dao.DuplicateKeyException) {
                return true;
            }
            String message = StrUtil.nullToEmpty(cause.getMessage()).toLowerCase();
            if (message.contains("duplicate key") || message.contains("unique constraint")) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }

    /**
     * 同名更新：写入新 bundle 对象并更新元数据；无安装引用时清理旧对象与资源记录。
     * 内置技能书（tenant_id=0）直连存储且对象键含技能名（同键覆盖）；tenant_id≠0 走 resource:// 注册
     */
    private void updateCatalogBundle(SkillCatalog existing, SkillBundle bundle, byte[] archive) {
        long tenantId = existing.getTenantId() == null ? BUILTIN_TENANT_ID : existing.getTenantId();
        String oldRef = StrUtil.trimToEmpty(existing.getBundleRef());
        String newRef;
        StorageBackends backend;
        String newObjectKey;
        if (tenantId == BUILTIN_TENANT_ID) {
            // 内置直连格式：saveBytes 返回值即 minio://{bucket}/{key}；同键覆盖，oldRef 相同时不清理
            backend = resolveBuiltinBackend();
            newObjectKey = builtinObjectKey(existing.getName());
            newRef = storageBackendFileServiceFactory.saveBytes(backend, newObjectKey, archive);
        } else {
            backend = resolveTenantBackend(tenantId);
            newObjectKey = builtinObjectKey();
            String providerPath = storageBackendFileServiceFactory.saveBytes(backend, newObjectKey, archive);
            newRef = registerBundleResource(backend, providerPath, archive, tenantId, bundle.name());
        }
        existing.setVersion(bundle.version());
        existing.setDescription(bundle.description());
        existing.setInstructions(bundle.instructions());
        existing.setBundleRef(newRef);
        existing.setBundleSha256(DigestUtil.sha256Hex(archive));
        existing.setUpdatedAt(new Date());
        skillCatalogMapper.updateById(existing);
        // Java 侧不写 tenant_skills：仅当无安装引用且引用变化时才清理旧对象，
        // 有引用时保留旧包（对齐 Go keep 路径），避免破坏已装沙箱读取
        if (StrUtil.isNotBlank(oldRef) && !StrUtil.equals(oldRef, newRef)
                && skillCatalogMapper.countInstallRefs(existing.getId()) == 0) {
            purgeBundleRef(oldRef);
        }
    }

    /**
     * 注册 bundle 资源记录并返回 resource://handle 引用（对齐 Go resourceCatalog.Register）：
     * physical_path = storage://{backendId}/{providerPath}，handle 为 22 字符 base64url 随机串
     */
    private String registerBundleResource(StorageBackends backend, String providerPath, byte[] archive,
                                          long tenantId, String skillName) {
        String physicalPath = StrUtil.isNotBlank(backend.getId())
                ? "storage://" + backend.getId() + "/" + providerPath
                : providerPath;
        String handle = newBundleHandle();
        Resources resource = new Resources();
        resource.setId(UUID.randomUUID().toString());
        resource.setHandle(handle);
        resource.setTenantId(tenantId);
        resource.setStorageBackendId(StrUtil.emptyToNull(backend.getId()));
        resource.setProvider(StrUtil.blankToDefault(backend.getProvider(), "local").toLowerCase());
        resource.setPhysicalPath(physicalPath);
        resource.setLocationHash(DigestUtil.sha256Hex(physicalPath));
        resource.setKind("file");
        resource.setMimeType("application/zip");
        resource.setOriginalName(skillName + ".zip");
        resource.setSize((long) archive.length);
        resource.setContentHash(DigestUtil.sha256Hex(archive));
        resource.setLifecycle("persistent");
        resource.setState("active");
        resource.setCreatedAt(new Date());
        resource.setUpdatedAt(new Date());
        resourcesMapper.insert(resource);
        return RESOURCE_REF_PREFIX + handle;
    }

    /**
     * 生成 22 字符资源 handle（16 随机字节 base64url 无填充，对齐 Go randomResourceToken）
     */
    private String newBundleHandle() {
        byte[] buf = new byte[16];
        new SecureRandom().nextBytes(buf);
        String handle = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
        if (handle.length() != RESOURCE_HANDLE_LENGTH) {
            throw new ServiceException("生成资源句柄失败");
        }
        return handle;
    }

    /**
     * 清理 bundle 引用指向的物理对象与资源记录（尽力而为，失败仅告警）
     */
    private void purgeBundleRef(String ref) {
        BundleLocation location;
        try {
            location = resolveBundleLocation(ref);
        } catch (Exception e) {
            log.warn("解析技能 bundle 引用失败(忽略清理), ref={}: {}", ref, e.getMessage());
            return;
        }
        if (location == null) {
            return;
        }
        storageBackendFileServiceFactory.deleteObject(location.backend(), location.objectKey());
        if (location.resource() != null) {
            try {
                resourcesMapper.update(null, new LambdaUpdateWrapper<Resources>()
                        .eq(Resources::getId, location.resource().getId())
                        .set(Resources::getState, "deleted")
                        .set(Resources::getDeletedAt, new Date()));
            } catch (Exception e) {
                log.warn("标记资源记录删除失败(忽略), handle={}: {}", location.resource().getHandle(), e.getMessage());
            }
        }
    }

    /**
     * 内置技能书直连对象键（对齐 Go SaveBytes：{tenantId}/tenant-skills/catalog/{name}.zip）；
     * 同名技能更新时同键覆盖
     */
    private String builtinObjectKey(String skillName) {
        return BUILTIN_TENANT_ID + "/tenant-skills/catalog/" + skillName + ".zip";
    }

    /**
     * 非内置租户的 bundle 对象键（对齐 Go SaveBytes：{tenantId}/exports/{uuid}.zip）
     */
    private String builtinObjectKey() {
        return BUILTIN_TENANT_ID + "/exports/" + UUID.randomUUID() + ".zip";
    }

    /**
     * 解析 bundle 引用为可读取位置，两种格式：
     * 1. tenant_id=0 内置技能书直连格式 minio://{bucket}/{key}（或历史 local://{key}、裸 key）→ 直接取 tenant_id=0 的 StorageBackends；
     * 2. tenant_id≠0 的 resource://handle → resources 表 → physical_path（storage://{backendId}/{providerPath}）→ storage_backends 配置
     */
    private BundleLocation resolveBundleLocation(String ref) {
        String value = StrUtil.trimToEmpty(ref);
        if (StrUtil.isBlank(value)) {
            return null;
        }
        if (value.startsWith(RESOURCE_REF_PREFIX)) {
            String handle = value.substring(RESOURCE_REF_PREFIX.length());
            Resources resource = resourcesMapper.selectOne(new LambdaQueryWrapper<Resources>()
                    .eq(Resources::getHandle, handle)
                    .last("limit 1"));
            if (resource == null) {
                throw new ServiceException("技能 bundle 资源不存在: " + handle);
            }
            StorageBackends backend = null;
            if (StrUtil.isNotBlank(resource.getStorageBackendId())) {
                backend = storageBackendsMapper.selectById(resource.getStorageBackendId());
            }
            if (backend == null) {
                throw new ServiceException("技能 bundle 存储后端不存在: " + resource.getStorageBackendId());
            }
            return new BundleLocation(backend, objectKeyFromPhysicalPath(resource.getPhysicalPath(), backend), resource);
        }
        // 内置直连格式（minio://{bucket}/{key} 等）：直接取 tenant_id=0 的存储后端读取
        return new BundleLocation(resolveBuiltinBackend(), objectKeyFromRef(value), null);
    }

    /**
     * 从 physical_path 提取可直读对象键：剥 storage://{backendId}/ 前缀，再剥 provider:// 前缀；
     * minio 场景进一步剥掉 bucket 前缀（factory 读取会自动剥，删除需精确对象键）
     */
    private String objectKeyFromPhysicalPath(String physicalPath, StorageBackends backend) {
        String value = StrUtil.trimToEmpty(physicalPath);
        if (value.startsWith("storage://")) {
            String afterStorage = value.substring("storage://".length());
            int slash = afterStorage.indexOf('/');
            value = slash > 0 ? afterStorage.substring(slash + 1) : afterStorage;
        }
        int scheme = value.indexOf("://");
        String provider = scheme > 0 ? value.substring(0, scheme).toLowerCase() : StrUtil.blankToDefault(backend.getProvider(), "");
        String rest = scheme > 0 ? value.substring(scheme + 3) : value;
        if ("minio".equals(provider)) {
            String bucket = parseBucketName(backend);
            if (StrUtil.isNotBlank(bucket) && rest.startsWith(bucket + "/")) {
                rest = rest.substring(bucket.length() + 1);
            }
        }
        return rest;
    }

    /**
     * 从存储后端配置解析 minio bucket 名称
     */
    private String parseBucketName(StorageBackends backend) {
        try {
            return JSONUtil.parseObj(backend.getConfig()).getStr("bucket_name");
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 从历史 bundle_ref 提取对象键（去掉 minio://{bucket}/ 或 local:// 前缀）
     */
    private String objectKeyFromRef(String ref) {
        String value = StrUtil.trimToEmpty(ref);
        if (StrUtil.isBlank(value)) {
            return null;
        }
        if (value.startsWith("local://")) {
            return value.substring("local://".length());
        }
        if (value.startsWith("minio://")) {
            String rest = value.substring("minio://".length());
            int slash = rest.indexOf('/');
            return slash > 0 ? rest.substring(slash + 1) : null;
        }
        return value;
    }

    /**
     * 解析内置技能书的存储后端（tenant_id=0，直连格式读写共用）
     */
    private StorageBackends resolveBuiltinBackend() {
        return resolveTenantBackend(BUILTIN_TENANT_ID);
    }

    /**
     * 解析指定租户的存储后端（取该租户下第一个 active 且未删除的 StorageBackends）
     */
    private StorageBackends resolveTenantBackend(long tenantId) {
        StorageBackends backend = storageBackendsMapper.selectOne(new LambdaQueryWrapper<StorageBackends>()
                .eq(StorageBackends::getTenantId, tenantId)
                .eq(StorageBackends::getStatus, "active")
                .isNull(StorageBackends::getDeletedAt)
                .last("limit 1"));
        if (BeanUtil.isNotEmpty(backend)) {
            return backend;
        }
        throw new ServiceException("未配置可用的存储后端（tenant_id=" + tenantId + "）");
    }

    /**
     * 加载技能目录定义的 bundle zip 字节（经 resource:// 引用解析到存储后端与对象键）
     */
    private byte[] loadBundleArchive(SkillCatalog entity) {
        BundleLocation location = resolveBundleLocation(entity.getBundleRef());
        if (location == null || StrUtil.isBlank(location.objectKey())) {
            throw new ServiceException("技能 bundle 引用为空");
        }
        try (InputStream in = storageBackendFileServiceFactory.getFileStream(location.backend(), location.objectKey())) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new ServiceException("读取技能 bundle 失败: " + e.getMessage());
        }
    }

    /**
     * 加载并解析 bundle 内全部文件（详情/文件读取共用）
     */
    private Map<String, byte[]> loadBundleFiles(SkillCatalog entity) {
        return parseSkillBundle(loadBundleArchive(entity)).files();
    }

    // ==================================================================
    // bundle 解析与打包（对齐 Go tenant_skill_bundle.go）
    // ==================================================================

    /**
     * 解析技能 bundle zip（上传路径，严格模式，对齐 Go ParseSkillBundle 默认选项）
     */
    private SkillBundle parseSkillBundle(byte[] archive) {
        return parseSkillBundle(archive, "", false, false);
    }

    /**
     * 解析技能 bundle zip：限额校验 → 路径安全校验 → 技能根定位与目录剥离 → frontmatter 提取
     *
     * @param archive          zip 字节
     * @param subdir           技能根子目录（GitHub/GitLab tree 子目录或 registry handoff path，上传时为空）
     * @param allowNestedSkill 远程包允许 SKILL.md 位于嵌套目录（对齐 Go AllowNestedSkill）
     * @param allowExtraFiles  技能目录之外的文件：true 丢弃，false 报错（对齐 Go AllowExtraFiles）
     */
    private SkillBundle parseSkillBundle(byte[] archive, String subdir, boolean allowNestedSkill,
                                         boolean allowExtraFiles) {
        Map<String, byte[]> raw = readZipEntries(archive);
        String prefix = skillRootPrefix(raw, subdir, allowNestedSkill);
        Map<String, byte[]> files = stripSkillRootPrefix(raw, prefix, allowExtraFiles);
        if (!files.containsKey("SKILL.md")) {
            throw new ServiceException("技能包缺少 SKILL.md");
        }
        if (files.size() > MAX_FILES) {
            throw new ServiceException("技能文件数超过上限 " + MAX_FILES);
        }
        String manifest = new String(files.get("SKILL.md"), StandardCharsets.UTF_8);
        Map<String, Object> metadata = parseFrontmatter(manifest);
        String name = getStringValue(metadata, "name");
        String description = getStringValue(metadata, "description");
        if (StrUtil.isBlank(name)) {
            throw new ServiceException("SKILL.md frontmatter 缺少 name");
        }
        if (name.length() > MAX_NAME_LENGTH || !SKILL_NAME_PATTERN.matcher(name).matches()) {
            throw new ServiceException("无效的技能名称: " + name);
        }
        for (String reserved : RESERVED_WORDS) {
            if (name.toLowerCase().contains(reserved)) {
                throw new ServiceException("技能名称包含保留字: " + reserved);
            }
        }
        if (StrUtil.isBlank(description)) {
            throw new ServiceException("SKILL.md frontmatter 缺少 description");
        }
        if (description.length() > MAX_DESCRIPTION_LENGTH) {
            throw new ServiceException("技能描述长度不能超过 " + MAX_DESCRIPTION_LENGTH + " 个字符");
        }
        return new SkillBundle(name, getStringValue(metadata, "version"), description,
                extractInstructions(manifest), files);
    }

    /**
     * 读取 zip 全部条目（限额与路径安全校验）
     */
    private Map<String, byte[]> readZipEntries(byte[] archive) {
        Map<String, byte[]> entries = new LinkedHashMap<>();
        long totalBytes = 0;
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(archive))) {
            ZipEntry entry;
            int count = 0;
            while ((entry = zis.getNextEntry()) != null) {
                if (++count > MAX_ZIP_ENTRIES) {
                    throw new ServiceException("压缩包条目数超过上限 " + MAX_ZIP_ENTRIES);
                }
                String name = entry.getName().replace('\\', '/');
                if (name.startsWith("/") || name.contains(":\\") || name.equals("..")
                        || name.startsWith("../") || name.contains("/../")) {
                    throw new ServiceException("压缩包包含不安全路径: " + entry.getName());
                }
                if (entry.isDirectory()) {
                    continue;
                }
                byte[] content = zis.readAllBytes();
                if (content.length > MAX_FILE_BYTES) {
                    throw new ServiceException("压缩包内单文件超过 32MB 上限: " + name);
                }
                totalBytes += content.length;
                if (totalBytes > MAX_TOTAL_BYTES) {
                    throw new ServiceException("压缩包解压后总大小超过 512MB 上限");
                }
                if (entries.put(name, content) != null) {
                    throw new ServiceException("压缩包包含重复条目: " + name);
                }
                zis.closeEntry();
            }
        } catch (IOException e) {
            throw new ServiceException("解析技能压缩包失败: " + e.getMessage());
        }
        if (CollUtil.isEmpty(entries)) {
            throw new ServiceException("技能压缩包为空");
        }
        return entries;
    }

    /**
     * 定位技能根目录（对齐 Go skillRootPrefix）：
     * 无 subdir 时根下 SKILL.md 即技能根；否则收集全部 SKILL.md 所在目录候选——
     * 上传仅接受根/单层目录，远程包允许嵌套；subdir 非空时只接受等于或以 /{subdir} 结尾的目录；
     * 候选唯一才通过，多个即"包含多个技能"
     */
    private String skillRootPrefix(Map<String, byte[]> raw, String subdir, boolean allowNestedSkill) {
        String clean = StrUtil.trimToEmpty(subdir).replace('\\', '/');
        clean = StrUtil.removePrefix(clean, "/");
        clean = StrUtil.removeSuffix(clean, "/");
        if (StrUtil.isBlank(clean) && raw.containsKey("SKILL.md")) {
            return "";
        }
        Set<String> matches = new LinkedHashSet<>();
        for (String name : raw.keySet()) {
            String base = name.substring(name.lastIndexOf('/') + 1);
            if (!"SKILL.md".equals(base)) {
                continue;
            }
            String dir = name.lastIndexOf('/') > 0 ? name.substring(0, name.lastIndexOf('/')) : "";
            if (StrUtil.isNotBlank(clean)) {
                if (dir.equals(clean) || dir.endsWith("/" + clean)) {
                    matches.add(dir);
                }
                continue;
            }
            if (StrUtil.isBlank(dir) || !dir.contains("/") || allowNestedSkill) {
                matches.add(dir);
            }
        }
        if (matches.isEmpty()) {
            throw new ServiceException(StrUtil.isNotBlank(clean)
                    ? "技能包在指定目录下缺少 SKILL.md: " + clean : "技能包缺少 SKILL.md");
        }
        if (matches.size() > 1) {
            throw new ServiceException("技能包包含多个技能（多处 SKILL.md）: " + String.join(", ", matches));
        }
        return matches.iterator().next();
    }

    /**
     * 按技能根前缀重定向文件路径（对齐 Go stripSkillRootPrefix）：
     * 前缀内条目剥掉前缀，前缀外条目按 allowExtraFiles 丢弃或报错
     */
    private Map<String, byte[]> stripSkillRootPrefix(Map<String, byte[]> raw, String prefix, boolean allowExtraFiles) {
        if (StrUtil.isBlank(prefix)) {
            return raw;
        }
        Map<String, byte[]> out = new LinkedHashMap<>();
        for (Map.Entry<String, byte[]> item : raw.entrySet()) {
            if (item.getKey().startsWith(prefix + "/")) {
                out.put(item.getKey().substring(prefix.length() + 1), item.getValue());
            } else if (!allowExtraFiles) {
                throw new ServiceException("压缩包内存在技能目录之外的文件: " + prefix);
            }
        }
        if (!out.containsKey("SKILL.md")) {
            throw new ServiceException("技能包缺少 SKILL.md");
        }
        return out;
    }

    /**
     * 将文件集合打包为归一化 zip（路径排序写入）
     */
    private byte[] zipSkillFiles(Map<String, byte[]> files) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(bos, StandardCharsets.UTF_8)) {
            for (Map.Entry<String, byte[]> item : new TreeMap<>(files).entrySet()) {
                zos.putNextEntry(new ZipEntry(item.getKey()));
                zos.write(item.getValue());
                zos.closeEntry();
            }
            zos.finish();
            return bos.toByteArray();
        } catch (IOException e) {
            throw new ServiceException("打包技能文件失败: " + e.getMessage());
        }
    }

    /**
     * 解析 SKILL.md YAML frontmatter，缺失或格式非法时抛出业务异常
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseFrontmatter(String content) {
        Matcher matcher = FRONTMATTER_PATTERN.matcher(StrUtil.nullToEmpty(content));
        if (!matcher.find()) {
            throw new ServiceException("SKILL.md 缺少有效 frontmatter（--- ... ---）");
        }
        Object loaded = new Yaml().load(matcher.group(1));
        if (!(loaded instanceof Map)) {
            throw new ServiceException("SKILL.md frontmatter 必须是对象");
        }
        return (Map<String, Object>) loaded;
    }

    /**
     * 从 Map 中获取字符串值
     */
    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    /**
     * 提取 SKILL.md frontmatter 之后的正文作为 instructions
     */
    private String extractInstructions(String content) {
        Matcher matcher = FRONTMATTER_PATTERN.matcher(StrUtil.nullToEmpty(content));
        if (matcher.find()) {
            return StrUtil.nullToEmpty(content).substring(matcher.end()).trim();
        }
        return StrUtil.nullToEmpty(content).trim();
    }

    // ==================================================================
    // 远程来源解析与拉取（对齐 Go tenant_skill_source.go）
    // ==================================================================

    /**
     * 拉取中间结果
     */
    private record FetchedSource(byte[] body, String contentType, String subdir) {
    }

    /**
     * 解析技能来源为唯一种类（对齐 Go parseSkillSource）
     */
    private ParsedSource parseSkillSource(String rawSource) {
        String input = StrUtil.trimToEmpty(rawSource);
        if (StrUtil.isBlank(input)) {
            throw new ServiceException("source 不能为空");
        }
        input = StrUtil.removeSuffix(input, "/");
        if (input.contains("://")) {
            return parseSkillSourceUrl(input);
        }
        // skills-sh: 前缀定位器
        String lower = input.toLowerCase();
        if (lower.startsWith(SKILLS_SH_REF_PREFIX)) {
            return parseSkillsShLocator(DEFAULT_REGISTRY_ORIGIN,
                    input.substring(SKILLS_SH_REF_PREFIX.length()));
        }
        if (lower.startsWith("skills-sh/")) {
            return parseSkillsShLocator(DEFAULT_REGISTRY_ORIGIN, input.substring("skills-sh/".length()));
        }
        // @owner/slug → ClawHub registry
        if (input.startsWith("@")) {
            return parseRegistrySlug(DEFAULT_REGISTRY_ORIGIN, StrUtil.removePrefix(input, "@"));
        }
        // 无协议裸 slug 含 / 视为歧义输入（既可能是 ClawHub 也可能是 GitHub）
        if (input.contains("/")) {
            throw new ServiceException("来源存在歧义，请使用 @slug 或粘贴 github.com / gitlab.com / skills.sh 完整 URL");
        }
        return parseRegistrySlug(DEFAULT_REGISTRY_ORIGIN, input);
    }

    /**
     * 按 URL host 分派解析（对齐 Go parseSkillSourceURL）
     */
    private ParsedSource parseSkillSourceUrl(String rawUrl) {
        URI uri;
        try {
            uri = URI.create(rawUrl);
        } catch (IllegalArgumentException e) {
            throw new ServiceException("无效的来源 URL: " + rawUrl);
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        if (!"http".equals(scheme) && !"https".equals(scheme)) {
            throw new ServiceException("仅允许 http(s) 来源");
        }
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        String path = StrUtil.nullToEmpty(uri.getPath());
        switch (host) {
            case "github.com", "www.github.com" -> {
                return parseGitHubUrl(uri);
            }
            case "codeload.github.com" -> {
                return new ParsedSource(SourceKind.DIRECT, null, null, null, null, null, null, null, rawUrl);
            }
            case "gitlab.com", "www.gitlab.com" -> {
                return parseGitLabUrl(uri);
            }
            case "skills.sh", "www.skills.sh" -> {
                return parseSkillsShUrl(uri);
            }
            case "clawhub.ai", "www.clawhub.ai", "clawhub.com", "www.clawhub.com" -> {
                return parseRegistryUrl(uri);
            }
            case "skillhub.cn", "www.skillhub.cn", "api.skillhub.cn" -> {
                return parseSkillHubCnUrl(uri);
            }
            default -> {
                String lowerPath = path.toLowerCase();
                if (lowerPath.endsWith(".zip") || lowerPath.endsWith(".tgz") || lowerPath.endsWith(".tar.gz")
                        || lowerPath.endsWith(".tar") || lowerPath.endsWith(".md")) {
                    return new ParsedSource(SourceKind.DIRECT, null, null, null, null, null, null, null, rawUrl);
                }
                return parseRegistryUrl(uri);
            }
        }
    }

    /**
     * 解析 GitHub URL（owner/repo[/tree|blob/{ref}[/subdir]]，对齐 Go parseGitHubURL）
     */
    private ParsedSource parseGitHubUrl(URI uri) {
        List<String> parts = splitPath(uri.getPath());
        if (parts.size() < 2) {
            throw new ServiceException("GitHub URL 必须为 owner/repo 形式");
        }
        String owner = parts.get(0);
        String repo = StrUtil.removeSuffix(parts.get(1), ".git");
        ParsedSource source = new ParsedSource(SourceKind.GITHUB, null, null, null,
                owner, repo, "HEAD", null, null);
        List<String> rest = parts.size() > 2 ? parts.subList(2, parts.size()) : List.of();
        if (rest.isEmpty()) {
            return source;
        }
        String head = rest.get(0);
        if ("tree".equals(head) || "blob".equals(head)) {
            if (rest.size() < 2) {
                throw new ServiceException("GitHub tree URL 缺少分支信息");
            }
            String subdir = String.join("/", rest.subList(2, rest.size()));
            if ("blob".equals(head) && subdir.toLowerCase().endsWith("/skill.md")) {
                subdir = subdir.substring(0, subdir.lastIndexOf('/'));
            }
            return new ParsedSource(SourceKind.GITHUB, null, null, null,
                    owner, repo, rest.get(1), StrUtil.emptyToNull(subdir), null);
        }
        if ("archive".equals(head) || "releases".equals(head)) {
            return new ParsedSource(SourceKind.DIRECT, null, null, null, null, null, null, null, uri.toString());
        }
        String subdir = String.join("/", rest);
        return new ParsedSource(SourceKind.GITHUB, null, null, null,
                owner, repo, "HEAD", StrUtil.emptyToNull(subdir), null);
    }

    /**
     * 解析 GitLab URL（group/project/-/tree/{ref}[/subdir]，对齐 Go parseGitLabURL）
     */
    private ParsedSource parseGitLabUrl(URI uri) {
        String trimmed = StrUtil.removePrefix(StrUtil.removeSuffix(uri.getPath(), "/"), "/");
        String project = trimmed;
        String extra = null;
        int marker = trimmed.indexOf("/-/");
        if (marker >= 0) {
            project = trimmed.substring(0, marker);
            extra = trimmed.substring(marker + 3);
        }
        List<String> parts = splitPath(project);
        if (parts.size() < 2) {
            throw new ServiceException("GitLab URL 必须为 group/project 形式");
        }
        String repo = StrUtil.removeSuffix(parts.get(parts.size() - 1), ".git");
        String owner = String.join("/", parts.subList(0, parts.size() - 1));
        ParsedSource source = new ParsedSource(SourceKind.GITLAB, null, null, null,
                owner, repo, "HEAD", null, null);
        if (StrUtil.isBlank(extra)) {
            return source;
        }
        List<String> extraParts = splitPath(extra);
        if (extraParts.isEmpty()) {
            return source;
        }
        String head = extraParts.get(0);
        if ("tree".equals(head) || "blob".equals(head)) {
            if (extraParts.size() < 2) {
                throw new ServiceException("GitLab tree URL 缺少分支信息");
            }
            String subdir = String.join("/", extraParts.subList(2, extraParts.size()));
            if ("blob".equals(head) && subdir.toLowerCase().endsWith("/skill.md")) {
                subdir = subdir.substring(0, subdir.lastIndexOf('/'));
            }
            return new ParsedSource(SourceKind.GITLAB, null, null, null,
                    owner, repo, extraParts.get(1), StrUtil.emptyToNull(subdir), null);
        }
        if ("archive".equals(head)) {
            return new ParsedSource(SourceKind.DIRECT, null, null, null, null, null, null, null, uri.toString());
        }
        return source;
    }

    /**
     * 解析 skills.sh URL（owner/repo 或 owner/repo/slug，对齐 Go parseSkillsShURL）
     */
    private ParsedSource parseSkillsShUrl(URI uri) {
        List<String> parts = splitPath(uri.getPath());
        if (parts.size() < 2) {
            throw new ServiceException("skills.sh URL 必须为 owner/repo 形式");
        }
        if (parts.size() >= 3) {
            return parseSkillsShLocator(DEFAULT_REGISTRY_ORIGIN, String.join("/", parts));
        }
        return new ParsedSource(SourceKind.GITHUB, null, null, null,
                parts.get(0), StrUtil.removeSuffix(parts.get(1), ".git"), "HEAD", null, null);
    }

    /**
     * 解析 skills.sh 定位器（必须为 owner/repo/slug 三段，对齐 Go parseSkillsShLocator）
     */
    private ParsedSource parseSkillsShLocator(String registry, String payload) {
        List<String> parts = splitPath(payload);
        if (parts.size() != 3) {
            throw new ServiceException("skills.sh 定位器必须为 owner/repo/slug 形式");
        }
        String owner = parts.get(0).toLowerCase();
        String repo = StrUtil.removeSuffix(parts.get(1).toLowerCase(), ".git");
        String slug = splitTrailingVersion(parts.get(2).toLowerCase())[0];
        if (StrUtil.hasBlank(owner, repo, slug)
                || owner.contains("..") || repo.contains("..") || slug.contains("..")) {
            throw new ServiceException("skills.sh 定位器必须为 owner/repo/slug 形式");
        }
        return new ParsedSource(SourceKind.SKILLS_SH, StrUtil.blankToDefault(registry, DEFAULT_REGISTRY_ORIGIN),
                slug, null, owner, repo, null, null, null);
    }

    /**
     * 解析 registry URL（对齐 Go parseRegistryURL）
     */
    private ParsedSource parseRegistryUrl(URI uri) {
        String origin = uri.getScheme() + "://" + uri.getHost();
        String trimmed = StrUtil.removePrefix(StrUtil.removeSuffix(uri.getPath(), "/"), "/");
        if (trimmed.startsWith("api/v1/download")) {
            return new ParsedSource(SourceKind.DIRECT, origin, null, null, null, null, null, null, uri.toString());
        }
        if (trimmed.startsWith("skills-sh")) {
            List<String> rest = splitPath(trimmed.substring("skills-sh".length()));
            return parseSkillsShLocator(origin, String.join("/", rest));
        }
        String slugVersion = trimmed;
        if (slugVersion.toLowerCase().startsWith("skills/")) {
            slugVersion = slugVersion.substring("skills/".length());
        } else if (slugVersion.contains("/skills/")) {
            int index = slugVersion.toLowerCase().indexOf("/skills/");
            slugVersion = slugVersion.substring(0, index) + "/" + slugVersion.substring(index + "/skills/".length() + 1);
        }
        String[] pair = splitTrailingVersion(slugVersion);
        String slug = pair[0];
        String version = StrUtil.blankToDefault(pair[1], StrUtil.emptyToNull(uri.getRawFragment()));
        String queryVersion = uri.getQuery() == null ? null : queryParam(uri, "version");
        if (StrUtil.isNotBlank(queryVersion)) {
            version = queryVersion;
        }
        if (StrUtil.isBlank(slug)) {
            throw new ServiceException("来源 URL 中缺少技能 slug");
        }
        // ClawHub 的 owner/slug 中 owner 是发布者句柄，下载 API 仅按 slug 取
        if (isClawHubHost(uri.getHost())) {
            List<String> parts = splitPath(slug);
            if (parts.size() == 2) {
                return new ParsedSource(SourceKind.REGISTRY, origin, parts.get(1), version, parts.get(0), null, null, null, null);
            }
            return new ParsedSource(SourceKind.REGISTRY, origin, slug, version, null, null, null, null, null);
        }
        return new ParsedSource(SourceKind.REGISTRY, origin, slug, version, null, null, null, null, null);
    }

    /**
     * 解析 SkillHub.cn URL（对齐 Go parseSkillHubCNURL）
     */
    private ParsedSource parseSkillHubCnUrl(URI uri) {
        String origin = "https://api.skillhub.cn";
        String trimmed = StrUtil.removePrefix(StrUtil.removeSuffix(uri.getPath(), "/"), "/");
        if (trimmed.startsWith("api/v1/download")) {
            String direct = origin + "/api/v1/download"
                    + (StrUtil.isBlank(uri.getRawQuery()) ? "" : "?" + uri.getRawQuery());
            return new ParsedSource(SourceKind.DIRECT, origin, null, null, null, null, null, null, direct);
        }
        List<String> parts = splitPath(trimmed);
        if (!parts.isEmpty() && "skills".equalsIgnoreCase(parts.get(0))) {
            parts = parts.subList(1, parts.size());
        }
        if (parts.isEmpty() || parts.size() > 2) {
            throw new ServiceException("无法识别的 registry 路径");
        }
        String[] pair = splitTrailingVersion(parts.get(parts.size() - 1));
        String version = StrUtil.blankToDefault(pair[1], StrUtil.emptyToNull(uri.getRawFragment()));
        String queryVersion = queryParam(uri, "version");
        if (StrUtil.isNotBlank(queryVersion)) {
            version = queryVersion;
        }
        if (StrUtil.isBlank(pair[0])) {
            throw new ServiceException("来源 URL 中缺少技能 slug");
        }
        return new ParsedSource(SourceKind.REGISTRY, origin, pair[0], version, null, null, null, null, null);
    }

    /**
     * 解析 registry slug（@owner/slug 或 slug[@version]，对齐 Go parseRegistrySlug）
     */
    private ParsedSource parseRegistrySlug(String origin, String spec) {
        String value = StrUtil.trimToEmpty(StrUtil.removePrefix(StrUtil.nullToEmpty(spec).trim(), "@"));
        String[] pair = splitTrailingVersion(value);
        if (StrUtil.isBlank(pair[0])) {
            throw new ServiceException("缺少技能 slug");
        }
        // ClawHub owner/slug：owner 是发布者句柄
        List<String> parts = splitPath(pair[0]);
        if (parts.size() == 2) {
            return new ParsedSource(SourceKind.REGISTRY, origin, parts.get(1), pair[1], parts.get(0), null, null, null, null);
        }
        return new ParsedSource(SourceKind.REGISTRY, origin, pair[0], pair[1], null, null, null, null, null);
    }

    /**
     * 判断是否为 ClawHub 域名（对齐 Go isClawHubHost）
     */
    private boolean isClawHubHost(String host) {
        return switch (StrUtil.nullToEmpty(host).toLowerCase()) {
            case "clawhub.ai", "www.clawhub.ai", "clawhub.com", "www.clawhub.com" -> true;
            default -> false;
        };
    }

    /**
     * 从 URL query 中取参数
     */
    private String queryParam(URI uri, String key) {
        String query = uri.getRawQuery();
        if (StrUtil.isBlank(query)) {
            return null;
        }
        for (String pair : query.split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0 && key.equals(pair.substring(0, eq))) {
                return pair.substring(eq + 1);
            }
        }
        return null;
    }

    /**
     * 拆分尾部的 @version（对齐 Go splitTrailingVersion，仅接受语义化版本或 latest）
     */
    private String[] splitTrailingVersion(String spec) {
        int index = spec.lastIndexOf('@');
        if (index <= 0) {
            return new String[]{spec, null};
        }
        String candidate = spec.substring(index + 1);
        if ("latest".equalsIgnoreCase(candidate) || SEMVER_LIKE.matcher(candidate).matches()) {
            return new String[]{spec.substring(0, index), candidate};
        }
        return new String[]{spec, null};
    }

    /**
     * 构建下载 URL（对齐 Go parsedSkillSource.fetchURL）
     */
    private String buildFetchUrl(ParsedSource source) {
        if (source.directUrl() != null) {
            return source.directUrl();
        }
        switch (source.kind()) {
            case REGISTRY -> {
                StringBuilder url = new StringBuilder(StrUtil.removeSuffix(source.registry(), "/"))
                        .append("/api/v1/download?slug=").append(urlEncode(source.slug()));
                if (StrUtil.isNotBlank(source.owner())) {
                    url.append("&ownerHandle=").append(urlEncode(source.owner()));
                }
                if (StrUtil.isNotBlank(source.version()) && !"latest".equalsIgnoreCase(source.version())) {
                    if (SEMVER_LIKE.matcher(source.version()).matches()) {
                        url.append("&version=").append(urlEncode(source.version()));
                    } else {
                        url.append("&tag=").append(urlEncode(source.version()));
                    }
                }
                return url.toString();
            }
            case SKILLS_SH -> {
                String registry = StrUtil.blankToDefault(source.registry(), DEFAULT_REGISTRY_ORIGIN);
                return StrUtil.removeSuffix(registry, "/") + "/api/v1/skills/" + urlEncode(source.slug())
                        + "/install?reference=" + urlEncode(
                        SKILLS_SH_REF_PREFIX + source.owner() + "/" + source.repo() + "/" + source.slug());
            }
            case GITHUB -> {
                String ref = StrUtil.blankToDefault(source.ref(), "HEAD");
                return "https://codeload.github.com/" + urlEncode(source.owner()) + "/"
                        + urlEncode(source.repo()) + "/zip/" + urlEncode(ref);
            }
            case GITLAB -> {
                String ref = StrUtil.blankToDefault(source.ref(), "HEAD");
                return "https://gitlab.com/" + urlEncode(source.owner()) + "/" + urlEncode(source.repo())
                        + "/-/archive/" + urlEncode(ref) + "/" + urlEncode(source.repo() + "-" + ref) + ".zip";
            }
            default -> throw new ServiceException("无法解析技能来源");
        }
    }

    /**
     * 带跳转的远程拉取：zip/SKILL.md 直接返回；JSON handoff 继续下一跳（对齐 Go fetchSkillSourceBytes）
     */
    private FetchedSource fetchWithHandoff(ParsedSource source, int hop, String registry) {
        if (hop > MAX_HANDOFF_HOPS) {
            throw new ServiceException("技能来源跳转次数超限");
        }
        String target = buildFetchUrl(source);
        String[] body = getSkillUrl(target);
        String contentType = body[0];
        byte[] content = decodeBase64Body(body[1]);
        // zip 魔数或 SKILL.md 文本：直接作为最终产物
        if (isZipMagic(content) || looksLikeSkillMarkdown(content)) {
            return new FetchedSource(content, contentType, source.subdir());
        }
        if (!looksLikeJson(contentType, content)) {
            // Content-Type 声明为 zip 但魔数不符（如带前置数据的 zip）也接受（对齐 Go isZipPayload 分支）
            if (StrUtil.containsIgnoreCase(StrUtil.nullToEmpty(contentType), "zip")) {
                return new FetchedSource(content, contentType, source.subdir());
            }
            throw new ServiceException("远程来源未返回技能压缩包");
        }
        JSONObject handoff;
        try {
            handoff = JSONUtil.parseObj(new String(content, StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new ServiceException("远程返回的 JSON 不是有效的技能描述");
        }
        ParsedSource next = parseHandoff(source, handoff, registry);
        return fetchWithHandoff(next, hop + 1, StrUtil.blankToDefault(next.registry(), registry));
    }

    /**
     * 解析 registry handoff 响应（对齐 Go sourceFromHandoff）
     */
    private ParsedSource parseHandoff(ParsedSource prev, JSONObject handoff, String registry) {
        Boolean ok = handoff.getBool("ok", true);
        if (!ok) {
            String message = StrUtil.blankToDefault(handoff.getStr("message"), handoff.getStr("reason"));
            throw new ServiceException("registry 拒绝该技能: " + StrUtil.blankToDefault(message, "未知原因"));
        }
        String archiveUrl = StrUtil.blankToDefault(handoff.getStr("archiveUrl"), handoff.getStr("downloadUrl"));
        JSONObject archive = handoff.getJSONObject("archive");
        if (StrUtil.isBlank(archiveUrl) && archive != null) {
            archiveUrl = archive.getStr("downloadUrl");
        }
        JSONObject github = handoff.getJSONObject("github");
        String path = StrUtil.trimToEmpty(handoff.getStr("path"));
        if (StrUtil.isBlank(path) && github != null) {
            path = StrUtil.trimToEmpty(github.getStr("path"));
        }
        if (StrUtil.isBlank(archiveUrl) && github == null) {
            // 对齐 Go handoffGitHub：installKind=github 且 repo/commit 任一非空即可
            if ("github".equalsIgnoreCase(StrUtil.trimToEmpty(handoff.getStr("installKind")))
                    && (StrUtil.isNotBlank(handoff.getStr("repo")) || StrUtil.isNotBlank(handoff.getStr("commit")))) {
                github = new JSONObject()
                        .set("repo", handoff.getStr("repo"))
                        .set("path", path)
                        .set("commit", handoff.getStr("commit"));
            } else {
                throw new ServiceException("registry 响应中缺少下载地址");
            }
        }
        if (StrUtil.isNotBlank(archiveUrl)) {
            // 相对路径先拼 registry，再走完整 URL 解析（避免 scheme 缺失被兜底成 https 而绕过校验）
            if (archiveUrl.startsWith("/")) {
                String origin = StrUtil.blankToDefault(prev.registry(), registry);
                if (StrUtil.isBlank(origin)) {
                    throw new ServiceException("registry 返回了相对下载地址但缺少来源域名");
                }
                archiveUrl = StrUtil.removeSuffix(origin, "/") + archiveUrl;
            }
            ParsedSource next = parseSkillSourceUrl(archiveUrl);
            String subdir = StrUtil.blankToDefault(next.subdir(), StrUtil.emptyToNull(path));
            String ref = next.ref();
            String commit = StrUtil.trimToEmpty(handoff.getStr("commit"));
            if (StrUtil.isBlank(commit) && github != null) {
                commit = StrUtil.trimToEmpty(github.getStr("commit"));
            }
            if (next.kind() == SourceKind.GITHUB && "HEAD".equals(ref) && StrUtil.isNotBlank(commit)) {
                ref = commit;
            }
            return new ParsedSource(next.kind(), StrUtil.blankToDefault(next.registry(), prev.registry()),
                    next.slug(), next.version(), next.owner(), next.repo(), ref, subdir, next.directUrl());
        }
        // github handoff
        String repo = github.getStr("repo");
        String sourceUrl = github.getStr("sourceUrl");
        if (StrUtil.isNotBlank(sourceUrl)) {
            try {
                ParsedSource next = parseSkillSourceUrl(sourceUrl);
                if (next.kind() == SourceKind.GITHUB) {
                    String commit = StrUtil.trimToEmpty(github.getStr("commit"));
                    String subdir = StrUtil.blankToDefault(next.subdir(), StrUtil.emptyToNull(github.getStr("path")));
                    String ref = StrUtil.isNotBlank(commit) ? commit : next.ref();
                    return new ParsedSource(SourceKind.GITHUB, next.registry(), next.slug(), next.version(),
                            next.owner(), next.repo(), ref, subdir, next.directUrl());
                }
            } catch (ServiceException ignored) {
                // 回退到 repo/path 解析
            }
        }
        List<String> parts = splitPath(StrUtil.removeSuffix(StrUtil.nullToEmpty(repo), ".git"));
        if (parts.size() != 2) {
            throw new ServiceException("registry github handoff 缺少 repo 信息");
        }
        String commit = StrUtil.trimToEmpty(github.getStr("commit"));
        return new ParsedSource(SourceKind.GITHUB, null, null, null,
                parts.get(0), parts.get(1), StrUtil.blankToDefault(commit, "HEAD"),
                StrUtil.emptyToNull(StrUtil.removePrefix(StrUtil.nullToEmpty(github.getStr("path")), "/")), null);
    }

    /**
     * 下载指定 URL（SSRF 防护 + 大小上限），返回 [contentType, base64(body)]；
     * 手动跟随重定向并对每一跳重新做 SSRF 校验（对齐 Go SSRFSafeHTTPClient，
     * 不能用自动跟随，否则重定向目标会绕过内网防护）
     */
    private String[] getSkillUrl(String url) {
        String current = url;
        for (int hop = 0; ; hop++) {
            ssrfGuard(current);
            try (HttpResponse response = HttpRequest.get(current)
                    .header("User-Agent", "Agent-Middle-Platform-SkillInstaller")
                    .header("Accept", "application/zip, application/octet-stream, application/json, text/plain;q=0.9, */*;q=0.8")
                    .timeout(FETCH_TIMEOUT_MILLIS)
                    .execute()) {
                int status = response.getStatus();
                if (isRedirectStatus(status)) {
                    if (hop >= MAX_REDIRECT_HOPS) {
                        throw new ServiceException("技能来源重定向次数超限");
                    }
                    String location = response.header("Location");
                    if (StrUtil.isBlank(location)) {
                        throw new ServiceException("远程来源返回重定向但缺少 Location");
                    }
                    current = resolveRedirectUrl(current, location);
                    continue;
                }
                if (status < 200 || status >= 300) {
                    throw new ServiceException("下载技能来源失败，HTTP " + status);
                }
                long contentLength = response.contentLength();
                if (contentLength > MAX_BUNDLE_BYTES) {
                    throw new ServiceException("技能包大小不能超过 " + MAX_BUNDLE_BYTES / 1024 / 1024 + "MB");
                }
                byte[] body;
                try {
                    InputStream in = response.bodyStream();
                    body = in.readNBytes((int) MAX_BUNDLE_BYTES + 1);
                } catch (IOException e) {
                    throw new ServiceException("读取远程技能来源失败: " + e.getMessage());
                }
                if (body.length > MAX_BUNDLE_BYTES) {
                    throw new ServiceException("技能包大小不能超过 " + MAX_BUNDLE_BYTES / 1024 / 1024 + "MB");
                }
                if (body.length == 0) {
                    throw new ServiceException("远程来源返回了空内容");
                }
                // base64 编码承载字节数组，避免二进制内容经字符串转码损坏
                return new String[]{response.header("Content-Type"), java.util.Base64.getEncoder().encodeToString(body)};
            }
        }
    }

    /**
     * 重定向跳数上限（对齐 Go DefaultSSRFSafeHTTPClientConfig MaxRedirects=10）
     */
    private static final int MAX_REDIRECT_HOPS = 10;

    /**
     * 判断是否为需要跟随的重定向状态码
     */
    private boolean isRedirectStatus(int status) {
        return status == 301 || status == 302 || status == 303 || status == 307 || status == 308;
    }

    /**
     * 将重定向 Location 解析为绝对地址（相对路径基于当前 URL 拼接，符合 HTTP 语义）
     */
    private String resolveRedirectUrl(String current, String location) {
        URI base;
        try {
            base = URI.create(current);
        } catch (IllegalArgumentException e) {
            throw new ServiceException("无效的下载地址: " + current);
        }
        URI resolved;
        try {
            resolved = base.resolve(location.trim());
        } catch (IllegalArgumentException e) {
            throw new ServiceException("无效的重定向地址: " + location);
        }
        if (StrUtil.isBlank(resolved.getScheme())) {
            throw new ServiceException("重定向地址缺少协议: " + location);
        }
        return resolved.toString();
    }

    /**
     * 解码 base64 承载的响应体
     */
    private byte[] decodeBase64Body(String encoded) {
        return java.util.Base64.getDecoder().decode(encoded);
    }

    /**
     * SSRF 基础防护：仅 http/https，拒绝回环/私网/链路本地/任意地址
     * （DNS rebinding 深度防护未实现，属简化项）
     */
    private void ssrfGuard(String url) {
        URI uri;
        try {
            uri = URI.create(url);
        } catch (IllegalArgumentException e) {
            throw new ServiceException("无效的下载地址: " + url);
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        if (!"http".equals(scheme) && !"https".equals(scheme)) {
            throw new ServiceException("仅允许 http(s) 下载地址");
        }
        String host = uri.getHost();
        if (StrUtil.isBlank(host)) {
            throw new ServiceException("下载地址缺少主机名");
        }
        try {
            for (InetAddress address : InetAddress.getAllByName(host)) {
                if (address.isLoopbackAddress() || address.isAnyLocalAddress()
                        || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                        || address.isMulticastAddress()) {
                    throw new ServiceException("下载地址指向内网或保留地址，已拒绝: " + host);
                }
            }
        } catch (IOException e) {
            throw new ServiceException("解析下载地址失败: " + host);
        }
    }

    /**
     * 将远程产物归一化为 SkillBundle（对齐 Go normalizeFetchedSkill）
     */
    private SkillBundle normalizeToBundle(byte[] body, String contentType, String subdir) {
        if (looksLikeSkillMarkdown(body)) {
            // 单文件 SKILL.md 文本：构造单文件 bundle 后统一打包
            Map<String, byte[]> files = new LinkedHashMap<>(Map.of("SKILL.md", body));
            return parseSkillBundle(zipSkillFiles(files));
        }
        if (!isZipMagic(body) && !StrUtil.containsIgnoreCase(StrUtil.nullToEmpty(contentType), "zip")) {
            throw new ServiceException("远程来源未返回 zip 技能包");
        }
        // 远程包放宽：支持子目录定位技能根、允许嵌套 SKILL.md、丢弃技能目录外文件
        // （对齐 Go ParseSkillBundleWithOptions{Subdir, AllowNestedSkill, AllowExtraFiles}）
        return parseSkillBundle(body, subdir, true, true);
    }

    /**
     * 判断是否为 zip 魔数
     */
    private boolean isZipMagic(byte[] body) {
        return body.length >= 4 && body[0] == 'P' && body[1] == 'K' && body[2] == 3 && body[3] == 4;
    }

    /**
     * 判断是否为 JSON 响应（对齐 Go looksLikeJSON）
     */
    private boolean looksLikeJson(String contentType, byte[] body) {
        if (StrUtil.containsIgnoreCase(StrUtil.nullToEmpty(contentType), "json")) {
            return true;
        }
        byte first = 0;
        for (byte item : body) {
            if (item != ' ' && item != '\t' && item != '\n' && item != '\r') {
                first = item;
                break;
            }
        }
        return body.length > 0 && first == '{';
    }

    /**
     * 判断是否为 SKILL.md 文本（--- 开头且含 name: 字段，对齐 Go looksLikeSkillMarkdown）
     */
    private boolean looksLikeSkillMarkdown(byte[] body) {
        String text = StrUtil.trimToEmpty(
                StrUtil.removePrefix(new String(body, StandardCharsets.UTF_8), "\ufeff"));
        if (!text.startsWith("---")) {
            return false;
        }
        return text.contains("\nname:") || text.contains("\nname :");
    }

    // ==================================================================
    // 通用辅助
    // ==================================================================

    /**
     * 规范化相对路径（拒绝空值与上级目录引用）
     */
    private String normalizeRelativePath(String path) {
        String rel = StrUtil.trimToEmpty(path).replace('\\', '/');
        if (rel.startsWith("/")) {
            rel = rel.substring(1);
        }
        if (StrUtil.isBlank(rel) || rel.equals("..") || rel.startsWith("../") || rel.contains("/../")) {
            throw new ServiceException("非法文件路径: " + path);
        }
        return rel;
    }

    /**
     * 判断是否为可读取的文本文件
     */
    private boolean isTextPath(String path) {
        String name = path.toLowerCase();
        if (name.endsWith("skill.md")) {
            return true;
        }
        int dotIndex = name.lastIndexOf('.');
        String suffix = dotIndex >= 0 ? name.substring(dotIndex) : "";
        return TEXT_FILE_EXTENSIONS.contains(suffix);
    }

    /**
     * 加载技能目录定义（软删除记录视为不存在）
     */
    private SkillCatalog getRequiredCatalog(String id) {
        SkillCatalog entity = skillCatalogMapper.selectOne(new LambdaQueryWrapper<SkillCatalog>()
                .eq(SkillCatalog::getId, StrUtil.trimToEmpty(id))
                .isNull(SkillCatalog::getDeletedAt)
                .last("limit 1"));
        if (entity == null) {
            throw new ServiceException("技能不存在: " + id);
        }
        return entity;
    }

    /**
     * 实体转 VO（附带租户信息；needTree 时附带 bundle 文件树；租户信息单查）
     */
    private SkillCatalogVO toVO(SkillCatalog entity, boolean needTree) {
        return toVO(entity, needTree, null);
    }

    /**
     * 实体转 VO（tenantMap 非空时从中取租户信息，为空时单查）
     */
    private SkillCatalogVO toVO(SkillCatalog entity, boolean needTree, Map<Integer, Tenants> tenantMap) {
        SkillCatalogVO vo = new SkillCatalogVO();
        vo.setId(entity.getId());
        vo.setTenantId(entity.getTenantId());
        vo.setName(entity.getName());
        vo.setVersion(entity.getVersion());
        vo.setDescription(entity.getDescription());
        vo.setInstructions(entity.getInstructions());
        vo.setBundleRef(entity.getBundleRef());
        vo.setBundleSha256(entity.getBundleSha256());
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());
        if (ObjectUtil.isNotEmpty(entity.getTenantId())) {
            Tenants tenant = tenantMap != null
                    ? tenantMap.get(entity.getTenantId().intValue())
                    : tenantsMapper.selectById(entity.getTenantId().intValue());
            if (tenant != null && tenant.getDeletedAt() == null) {
                vo.setTenant(tenant);
            }
        }
        if (needTree) {
            vo.setFileTree(buildTreeFromFiles(loadBundleFiles(entity).keySet()));
        }
        return vo;
    }

    /**
     * 由文件路径集合构建文件树（目录优先、名称排序，目录节点按出现顺序合并）
     */
    private List<SkillCatalogVO.FileNode> buildTreeFromFiles(Set<String> paths) {
        Map<String, SkillCatalogVO.FileNode> nodeIndex = new LinkedHashMap<>();
        List<SkillCatalogVO.FileNode> roots = new ArrayList<>();
        for (String path : paths.stream().sorted().collect(Collectors.toList())) {
            String[] segments = path.split("/");
            List<SkillCatalogVO.FileNode> current = roots;
            StringBuilder built = new StringBuilder();
            for (int i = 0; i < segments.length; i++) {
                if (built.length() > 0) {
                    built.append('/');
                }
                built.append(segments[i]);
                String nodePath = built.toString();
                boolean isDir = i < segments.length - 1;
                SkillCatalogVO.FileNode node = nodeIndex.get(nodePath);
                if (node == null) {
                    node = new SkillCatalogVO.FileNode();
                    node.setName(segments[i]);
                    node.setPath(nodePath);
                    node.setIsDir(isDir);
                    if (isDir) {
                        node.setChildren(new ArrayList<>());
                    }
                    nodeIndex.put(nodePath, node);
                    current.add(node);
                }
                if (isDir) {
                    current = node.getChildren();
                }
            }
        }
        sortTree(roots);
        return roots;
    }

    /**
     * 递归排序文件树（目录优先、名称不区分大小写）
     */
    private void sortTree(List<SkillCatalogVO.FileNode> nodes) {
        nodes.sort((a, b) -> {
            boolean dirA = Boolean.TRUE.equals(a.getIsDir());
            boolean dirB = Boolean.TRUE.equals(b.getIsDir());
            if (dirA != dirB) {
                return dirA ? -1 : 1;
            }
            return a.getName().compareToIgnoreCase(b.getName());
        });
        for (SkillCatalogVO.FileNode node : nodes) {
            if (CollUtil.isNotEmpty(node.getChildren())) {
                sortTree(node.getChildren());
            }
        }
    }

    /**
     * 拆分 URL 路径中的非空段
     */
    private List<String> splitPath(String path) {
        return java.util.Arrays.stream(StrUtil.nullToEmpty(path).split("/"))
                .map(StrUtil::trimToEmpty)
                .filter(StrUtil::isNotBlank)
                .filter(item -> !".".equals(item))
                .collect(Collectors.toList());
    }

    /**
     * URL 路径段编码
     */
    private String urlEncode(String value) {
        return java.net.URLEncoder.encode(StrUtil.nullToEmpty(value), StandardCharsets.UTF_8);
    }
}
