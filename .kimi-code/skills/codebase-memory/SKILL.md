---
name: codebase-memory
description: 用 codebase-memory-mcp 代码知识图谱回答代码结构问题（谁调用了 X、改 Y 影响什么、架构概览、死代码、跨包调用链），替代大量 grep/read 探索
type: prompt
whenToUse: 当需要理解本仓库（codark，OpenCode 系 monorepo）的代码结构、调用关系、依赖方向、影响面分析，或准备做跨包重构时
---

本仓库已配置 codebase-memory-mcp（DeusData 出品的代码知识图谱 MCP，索引在 `~/.cache/codebase-memory-mcp/`）。回答代码结构问题时**优先用图谱工具，再考虑 Grep/Read 逐文件探索**。

## 工具选择

MCP 工具（新会话生效，前缀 `mcp__codebase-memory__`）：

- `get_architecture` — 先拿全局概览：语言、包、入口、路由、热点、分层。探索陌生区域前第一步。
- `search_graph` — 按名字正则/标签（Function/Class/Method/Route）/文件模式找节点，用来拿精确限定名。
- `trace_path` — BFS 调用链：谁调用了它（inbound）/ 它调用了谁（outbound），深度 1-5。
- `detect_changes` — 把 git diff 映射到受影响符号，做改动影响面/风险评估。
- `query_graph` — 只读 openCypher 子集，如 `MATCH (f:Function)-[:CALLS]->(g) WHERE f.name = 'x' RETURN g.name`。
- `get_code_snippet` — 按限定名读源码（先用 search_graph 拿限定名）。
- `search_code` — 只在已索引文件内做文本搜索。
- `index_status` / `index_repository` — 检查/重建索引（`repo_path` 用绝对路径 `/data/dev/codark`）。

## 无 MCP 时的兜底

如果当前会话没有 `mcp__codebase-memory__*` 工具（比如 mcp.json 是后加的、会话未重启），用 CLI 兜底：

```bash
codebase-memory-mcp cli search_graph '{"project": "data-dev-codark", "name_pattern": ".*Session.*", "label": "Function"}'
codebase-memory-mcp cli trace_path '{"project": "data-dev-codark", "function_name": "SessionV2.prompt", "direction": "inbound"}'
codebase-memory-mcp cli index_status '{"repo_path": "/data/dev/codark"}'
```

## 与 codegraph 共存

本项目同时配置了 `codegraph`（npm 包，MCP 前缀 `mcp__codegraph__*`，45 个工具，侧重框架感知/PR 分析）和本图谱（前缀 `mcp__codebase-memory__*`，14 个工具，侧重极致性能/跨服务链接）。两者工具名不冲突，可以共存。默认优先用 codebase-memory；codegraph 的索引在其自带的 `.codegraph/` 目录，可用 `codegraph status` 查看。

## 使用约定

- **本项目在图谱里的名字是 `data-dev-codark`**（2026-07-27 目录从 opencraft 改名为 codark 后需重新索引生成；旧项目 `data-dev-opencraft` 可用 `delete_project` 清理）。SQLite store 里还索引了本机其他项目，查询时必须显式传 `"project": "data-dev-codark"`，否则报 `missing required argument: project`。可用 `list_projects` 查看全部已索引项目。
- 索引可能滞后于最新改动：改动较多时先 `index_status` 看新鲜度，必要时重新 `index_repository`（该工具索引后是增量 auto-sync）。
- 图谱结果与代码冲突时，以代码为准（Read 验证）。
- 本仓库关键结构：TUI 在 `packages/tui`（OpenTUI/Solid，非 Ink），后端 `packages/codark` + `packages/core` + `packages/server`，API 契约见 `packages/client`（生成代码，勿手改）。
