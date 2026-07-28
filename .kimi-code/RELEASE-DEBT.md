# 首发流水线的屏蔽与降级清单（RELEASE DEBT）

> 2026-07-28，codark v2.0.0 首发流水线（.github/workflows/publish.yml）排障记录。
> 以下各项为"凭证/条件缺失时的屏蔽或降级"，**配齐对应凭证后应逐项恢复**。
> 恢复后请从本文件移除对应条目。

## 一、签名类（全部"无证透传"，产物未签名）

| # | 屏蔽了什么 | 位置 | 触发条件 | 恢复方式 |
|---|---|---|---|---|
| 1 | Windows CLI 的 Azure Trusted Signing（登录/签名/验签 3 步） | publish.yml `sign-cli-windows` job | `env.AZURE_CLIENT_ID != ''` 否则跳过 | 配 6 个 Azure secrets（CLIENT_ID/TENANT_ID/SUBSCRIPTION_ID/ACCOUNT_NAME/CERTIFICATE_PROFILE/ENDPOINT） |
| 2 | Windows Electron 安装包的 Azure 登录与验签 | publish.yml `build-electron` Azure login + `Verify signed Windows Electron artifacts` | 同上 | 同上 |
| 3 | macOS 代码签名（p12 证书导入、electron-builder identity、dmg.sign） | publish.yml `import-codesign-certs` 条件 + `electron-builder.config.ts` 的 `identity: null` / `dmg.sign` | `APPLE_CERTIFICATE`（CSC_LINK）存在与否 | 配 `APPLE_CERTIFICATE`（p12 base64）+ `APPLE_CERTIFICATE_PASSWORD` |
| 4 | macOS 公证（notarize）与 Apple API Key | publish.yml `Setup Apple API Key` 条件 + 配置文件 `notarize` 跟随 p8 文件存在 | `APPLE_API_KEY_PATH` + p8 文件真实存在 | 配 `APPLE_API_KEY_PATH` / `APPLE_API_KEY` / `APPLE_API_ISSUER` |

**未签名的代价**：Windows SmartScreen 提示"未知发布者"；macOS Gatekeeper 拦截未公证应用（用户需右键打开）。

## 二、流程降级类

| # | 屏蔽/降级了什么 | 位置 | 现状 | 恢复方式 |
|---|---|---|---|---|
| 5 | GitHub App 提交身份 | `.github/actions/setup-git-committer` | 无 `CODARK_APP_ID/SECRET` 时降级用内置 `GITHUB_TOKEN`（提交人为 github-actions[bot]） | 建 GitHub App 并配两个 secret；降级逻辑可保留 |
| 6 | AI 生成发布说明 | `script/version.ts` | `changelog.ts`（调 LLM）失败时容错，改用 `git log --oneline -30` | 在 CI 配可用的模型 provider 密钥（原 `OPENCODE_API_KEY` 是上游 Zen 付费服务，不可用） |
| 7 | changelog CLI 来源 | publish.yml version job | 不再 `bun i -g codark`（npm 无包），改用 shim 从源码跑 `packages/codark` | 首发后 codark 已上 npm，可恢复安装上一版稳定 CLI（也可保留现状） |
| 8 | macOS 窗口原生插件 `mac_window.node`（Swift） | `electron-builder.config.ts` extraResources | `packages/desktop/native` 不存在则跳过打包（fork 内无该插件源码） | 补上 Swift 插件的源码/构建链；目录出现后自动恢复 |

## 三、环境替换类（非屏蔽，是永久改动）

- GitHub Actions runner：Blacksmith 付费 runner → GitHub 官方 runner（`ubuntu-latest`/`windows-2025`/`ubuntu-24.04-arm`），publish.yml 全量替换。
- 版本 bump 由 package.json 推导（major → 2.0.0），不从 git tag 推导；重复触发产生重复 draft release，需人工清理多余草稿。

## 待办（首发收尾）

- [ ] publish 全绿后删除多余的 v2.0.0 draft releases
- [ ] 逐个 npm 包配置 Trusted Publisher（OIDC），删除 NPM_TOKEN
