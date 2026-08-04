# 通用智能体中台 — Backend

Java 微服务后端，基于 **Spring Boot 3 + Spring Cloud** 与 **通用智能体中台项目**业务定制。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Java | 17+ | LTS 版本 |
| Spring Boot | 3.5.11 | 微服务基础框架 |
| Spring Cloud | 2025.0.1 | 微服务治理 |
| Spring Cloud Alibaba | 2025.0.0.0 | Nacos / Sentinel / Seata |
| MyBatis-Plus | 3.5.7 | ORM 框架 |
| Druid | - | 数据库连接池 |
| SpringDoc OpenAPI | 2.8.16 | API 文档 (Swagger) |
| MinIO | - | 对象存储 |
| Hutool | - | 工具库 |

## 模块结构

```
apps/backend/ (com.iptv:agentic-cloud:3.6.7)
│
├── iptv-gateway                # API 网关 [端口 9206]
│   └── Spring Cloud Gateway (WebFlux) + Sentinel 限流 + 验证码
│
├── iptv-auth                   # 认证中心 [端口 9203]
│   └── 用户登录认证 + Token 管理
│
├── iptv-api/                   # Feign 远程调用接口
│   └── iptv-api-system             # 系统服务接口定义
│
├── iptv-common/                # 公共组件库
│   ├── iptv-common-core            # 核心工具类、通用常量、异常定义
│   ├── iptv-common-log             # 操作日志切面
│   ├── iptv-common-redis           # Redis 缓存封装
│   ├── iptv-common-security        # 安全认证组件
│   ├── iptv-common-swagger         # SpringDoc API 文档配置
│   ├── iptv-common-mybatisplus     # MyBatis-Plus 公共配置
│   ├── iptv-common-datasource      # 多数据源支持
│   ├── iptv-common-datascope       # 数据权限控制
│   ├── iptv-common-sensitive       # 数据脱敏
│   ├── iptv-common-seata           # Seata 分布式事务
│   └── iptv-common-task            # 定时任务相关公共能力
│
├── iptv-modules/               # 业务模块
│   ├── iptv-system                 # 系统管理 [端口 9205]
│   │   └── 用户/角色/菜单/部门/字典/日志等
│   ├── iptv-file                   # 文件服务 [端口 9201]
│   │   └── MinIO 文件上传/下载
│   ├── iptv-business               # 业务应用 [端口 9208]
│   │   └── 业务域核心功能
│   ├── iptv-websocket              # WebSocket [端口 9202]
│   ├── iptv-channel                # 渠道适配 + 运行时装配 [端口 9408]
│   └── iptv-harness                # AgentScope 智能体纯执行 [端口 9508]
│
└── iptv-generator              # 代码生成器
    └── Velocity 模板，生成 CRUD 代码
```

## 环境要求

- **JDK**: 17+
- **Maven**: 3.8+
- **Nacos**: 3.x（注册中心 + 配置中心）
- **Redis**: 6+
- **MySQL**: 8.0+
- **MinIO**: 对象存储服务

## 本地开发

### 1. 基础设施准备

确保以下服务已启动：
- Nacos（默认端口 8848）
- Redis（默认端口 6379）
- MySQL（默认端口 3306）
- MinIO（如需文件服务）

### 2. 数据库初始化

执行 `script/backend/db/` 下的 SQL 脚本（建议顺序）：
- `ry_20250523.sql` — 系统基础表
- `ry_config_20260310.sql` — 配置相关表
- `ry_seata_20210128.sql` — Seata 相关表
- `quartz.sql` — 定时任务表
- `sc_20260408.sql` / `sc_20260410.sql` — 业务表

### 3. Nacos 配置

各服务通过 `bootstrap.yml` 连接 Nacos，运行时配置由 Nacos 统一管理：
- `application.yml` — 全局公共配置
- `{service-name}.yml` — 各服务独立配置

### 4. 构建与启动

```bash
# 全量构建
mvn clean package -Dmaven.test.skip=true -P dev

# 启动顺序（推荐）：
# 1. iptv-gateway
# 2. iptv-auth
# 3. iptv-system
# 4. iptv-file
# 5. iptv-business
# 6. iptv-websocket
# 7. iptv-channel
# 8. iptv-harness
```

### Maven Profiles

| Profile | 说明 |
|---------|------|
| `dev` | 开发环境 |
| `test` | 测试环境 |
| `prod` | 生产环境 |

```bash
mvn clean package -Dmaven.test.skip=true -P test   # 测试环境构建
mvn clean package -Dmaven.test.skip=true -P prod   # 生产环境构建
```

## 开发规范

- **Controller**: 参数校验 + 结果封装，返回 `R<T>`
- **Service**: 接口与实现分离 (`IXxxService` / `XxxServiceImpl`)
- **Mapper**: 继承 `BaseMapper<T>`，复杂 SQL 使用 XML
- **包路径**: `com.iptv.{模块}.{层级}`
- 详细规范参见 `.cursor/rules/java-backend.mdc`

## 部署

使用 Jenkins CI/CD 自动化部署，支持按服务选择性发布：

```bash
# Jenkins 流水线支持参数：gateway / auth / file / system / business / websocket / channel / harness / all 等
```

流水线配置：`script/jenkins/backend/`
