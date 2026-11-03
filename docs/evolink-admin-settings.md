# EvoLink 后台配置模块

后台 → 系统设置 → AI 顶部新增 **EvoLink** 卡片，沿用 OpenAI、Anthropic 等平台的卡片布局、折叠、保存和测试交互。

## 使用

1. Base URL 默认 `https://api.evolink.ai`。也兼容填写 `https://api.evolink.ai/v1`。
2. 在 [EvoLink 控制台](https://evolink.ai/) 创建 API Key，在后台填写。
3. 点击测试并运行：服务器调用 `GET /v1/credits` 验证凭证，显示账户额度和密钥额度。测试不会提交生成任务；测试成功不等于保存。
4. 点击页面右上角的保存。重新打开页面后，密钥以遮罩形式显示。改变 Base URL 时需要重新输入密钥。

本模块只提供配置与凭证检查，没有接入图片/视频生成流程。没有真实 Key 时，可验证界面、保存与错误处理，不能宣称真实账户授权成功。

## 安全和兼容性

- 设置键为 `evolink_base_url`、`evolink_api_key`，复用现有 `config` 表、管理员权限、保存接口和测试接口。
- `evolink_api_key` 为 password 字段，通过 `saveConfigs` 保存。部署已有的 `CONFIG_ENCRYPTION_KEY` 后使用 AES-256-GCM 加密；未配置时沿用项目原有明文存储行为。请在生产环境配置并稳定保留该密钥。
- 测试仅允许官方 HTTPS 主机 `api.evolink.ai`，拒绝重定向，不回显上游响应中的密钥或错误原文。
- 无数据库迁移、无新增依赖、无新增付费接口。不需要修改生成或支付代码。
- 安装包适用于含 `src/modules/config/settings.ts`、`settings-test.ts`、`settings-test-specs.ts`、`service.ts` 和 `messages/{en,zh}.json` 的 **ShipAny TanStack 项目**，不保证直接兼容 Next.js 或其他框架。

## 安装到另一个项目

安装包解压后包含 `install.py`、`evolink.patch`、双语新增翻译、独立源码文件与本说明。需要 Python 3.9+、Git 以及目标项目已有的 Node/pnpm 环境。

先进入解压出的 `evolink-admin-settings` 目录：

```sh
python3 install.py "/你的项目绝对路径" --check
python3 install.py "/你的项目绝对路径" --apply
```

安装器先在临时副本检查补丁和翻译冲突，成功后将原文件备份到目标项目 `.evolink-backups/<时间>/`，再应用代码与合并新增翻译。原有其他翻译会保留。重复安装或不兼容版本会拒绝安装，不会强制覆盖文件。

然后在目标项目运行：

```sh
node --import tsx --test tests/evolink-settings.test.ts
pnpm build
```

重新启动或部署目标项目，在后台 AI 标签找到 EvoLink。安装脚本不会替你提交、发布、连接线上数据库或写入真实 API Key。

回滚命令（替换成安装器打印的实际备份目录）：

```sh
python3 install.py "/你的项目绝对路径" --rollback "/你的项目绝对路径/.evolink-backups/实际时间"
```

若相关文件在安装后又被修改，回滚会停止并提示手工合并，防止覆盖后续工作。回滚后需重新构建和发布。

## 不同版本的手工移植

补丁不匹配时按 `evolink.patch` 合并以下位置，不要用整个 Vikas 项目覆盖目标项目：

1. `src/modules/config/settings.ts`：AI 分组新增 EvoLink；字段新增 Base URL 和 password API Key。
2. `src/modules/config/service.ts`：在 `ENDPOINT_SECRETS` 加入 `evolink_base_url: ['evolink_api_key']`。
3. `src/modules/config/settings-test-specs.ts`：注册无额外输入的 `evolink` 测试。
4. `src/modules/config/settings-test.ts`：导入 `testEvoLinkConnection`，在 `runTest` 的 switch 增加 `evolink` 分支。
5. 复制 `files/src/lib/evolink-settings.ts` 和 `files/tests/evolink-settings.test.ts` 到对应路径。
6. 将 `translations/en.json`、`translations/zh.json` 中的键合并到目标项目的同语言文件，保留其他翻译。

如果目标项目没有密钥遮罩、加密、端点变更保护和管理员设置权限控制，需要先补齐这些基础能力，不能只搬一个输入框。

## 官方接口依据

- [EvoLink 快速接入文档](https://evolink.ai/docs/en/quickstart)：图片、视频等使用 `https://api.evolink.ai`。
- [账户额度查询](https://evolink.ai/docs/en/api-manual/account-management/get-credits)：`GET /v1/credits`，Bearer API Key 认证。
