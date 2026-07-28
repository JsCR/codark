---
name: codegraph
description: 用 codegraph-mcp（LSP 级代码知识图谱，索引在本仓库 `.codegraph/`）回答代码结构问题——找符号定义、追调用链、评估改动爆炸半径。与 codebase-memory 互补：codegraph 侧重 LSP 精确符号级导航和框架感知，codebase-memory 侧重 BM25/语义搜索与架构簇。找定义、追调用、做影响面分析时优先使用，Grep/Read 仅兜底。
---

# CodeGraph 使用说明书

本机安装：`/root/.local/bin/codegraph`（v1.0.1 系列，自带 node 运行时）。项目级 MCP 已在 `.kimi-code/mcp.json` 注册，工具前缀 `mcp__codegraph__*`。索引数据在本仓库 `.codegraph/codegraph.db`。

## 定位

LSP 级的符号索引与调用图。查"X 在哪定义、谁调用了它、我改这个会影响谁"时**首选**；与 codebase-memory（`mcp__codebase-memory__*`，BM25/语义/架构簇）互补共存，两者都答不上再回退 Grep/Read。

## 工具选择（按意图）

- **勘察一片区域 / 准备改代码** → `codegraph_explore`（自然语言或符号包，返回相关符号源码 + 文件归属，最常用，一个调用顶几十次 grep+read）
- **找符号定义** → `codegraph_search`（按名模糊搜）→ `codegraph_node`（拿精确位置/源码/调用足迹）
- **追调用链** → `codegraph_callers`（谁调用 X）/ `codegraph_callees`（X 调用谁）
- **评估改动影响面** → `codegraph_impact`（爆炸半径分析）
- **看索引状态** → `codegraph_status`；索引滞后时 `codegraph sync`（CLI）或让 watcher 自动同步

## 无 MCP 时的 CLI 兜底

```bash
codegraph query "SessionV2" --path /data/dev/codark
codegraph callers "SessionV2.prompt" --path /data/dev/codark
codegraph status /data/dev/codark
codegraph sync /data/dev/codark
```

## 索引维护（本仓库的实战教训）

- **索引会滞后**：改动多时用 `codegraph sync` 增量同步；结构大改后 `codegraph init` 重建。
- **"database disk image is malformed"**：根因是多个 codegraph 版本/进程共享同一个 SQLite db（官方 [issue #1057](https://github.com/colbymchenry/codegraph/issues/1057)）。处理：清掉持有旧句柄的 stale serve 进程让宿主重拉，再删库 `codegraph init` 重建——不要一上来就删库。
- **版本统一**：本机有 npm 全局（v0.9.9）与版本管理器（v0.9.8/v0.9.9/v1.0.1）多套 codegraph，CLI 统一用 `/root/.local/bin/codegraph`（v1.0.1，与 MCP 服务同版），避免混写 db。

## 使用约定

- 图谱结果与代码冲突时，以代码为准（Read 验证）。
- 本项目关键结构：主 CLI 在 `packages/codark`，核心库 `packages/core`，TUI `packages/tui`（OpenTUI/Solid），契约 `packages/client`（生成代码勿手改），全部包名为 `@codark-ai/*` 或 `codark`。
