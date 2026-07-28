- 重新生成旧版 JavaScript SDK：运行 `./packages/sdk/js/script/build.ts`。
- 修改公开的 Protocol 或 Server `HttpApi` 后，在 `packages/client` 下运行 `bun run generate`。禁止直接手改 `src/generated` 或 `src/generated-effect`。
- 运行时依赖方向必须保持：Schema → Core 和 Protocol → Server。Client 运行时可以依赖 Schema 和 Protocol，但绝不能依赖 Core 或 Server；`sdk-next` 组合 Client、Core、Server。
- 本仓库默认分支是 `dev`。
- 本地可能没有 `main` 引用；做 diff 请用 `dev` 或 `origin/dev`。

## 代码智能（MCP）

本仓库已被两个 MCP 服务索引。做代码探索时**优先用它们，而不是 `grep`/`find`**：

- `codegraph`（LSP 级）：用 `codegraph_search`/`codegraph_node` 找符号定义，`codegraph_callers`/`codegraph_callees` 追调用链，`codegraph_explore` 在改动前勘察一片区域，`codegraph_impact` 做爆炸半径分析。
- `codebase-memory`（知识图谱）：用 `search_graph`/`search_code` 做 BM25 与语义搜索，`get_architecture` 看模块全景，`trace_path` 追调用方/影响面/数据流，`query_graph` 跑多跳模式查询。

定位符号、追调用路径、评估改动影响时先用这些工具。只在以下情况回退到 Grep/Glob/Read：MCP 工具没有有用结果、需要原始文件内容而非结构、或工具不可用。注意索引可能落后于工作区，大型结构变更后请重建索引（`index_repository`）。

## 分支命名

使用不超过三个词的短横线分支名。不要用斜杠，也不要 `feat/`、`fix/` 这类类型前缀。

示例：`session-recovery`、`fix-scroll-state`、`regenerate-sdk`。

## 提交与 PR 标题

使用约定式提交格式：`type(scope): summary`。

合法类型：`feat`、`fix`、`docs`、`chore`、`refactor`、`test`。scope 可选，建议用受影响的包或区域，如 `core`、`codark`、`tui`、`app`、`desktop`、`sdk`、`plugin`。

示例：`fix(tui): simplify thinking toggle styling`、`docs: update contributing guide`、`chore(sdk): regenerate types`。

## 代码风格

### 一般原则

- 除非可组合或可复用，否则逻辑都写在一个函数里
- 不要预先抽取只用一次的辅助函数；除非该函数被复用、隐藏了真正复杂的边界、或有清晰独立的命名能改善调用方可读性，否则把逻辑内联在调用点
- 尽量避免 `try`/`catch`
- 避免使用 `any` 类型
- 能用 Bun API 就用，比如 `Bun.file()`
- 尽量依赖类型推断；避免显式类型注解或接口，除非是导出需要或有助于理解
- 优先用函数式数组方法（flatMap、filter、map）而不是 for 循环；在 filter 上使用类型守卫以保持下游类型推断
- 在 `src/config` 中新增配置模块时，遵循文件顶部既有的自导出模式（例如 `export * as ConfigAgent from "./agent"`）
- 在 Effect 生成器中，先把服务绑定到命名变量再调用方法；不要写嵌套 yield，如 `yield* (yield* Foo.Service).bar()`

只使用一次的值要内联，减少变量总数。

```ts
// 好
const journal = await Bun.file(path.join(dir, "journal.json")).json()

// 坏
const journalPath = path.join(dir, "journal.json")
const journal = await Bun.file(journalPath).json()
```

### 解构

避免不必要的解构。用点号访问以保留上下文。

```ts
// 好
obj.a
obj.b

// 坏
const { a, b } = obj
```

### 导入

- 禁止别名导入。不要 `import { foo as bar } from "..."`，也不要 `resolve as pathResolve` 这类重命名导入。
- 禁止星号导入。不要 `import * as Foo from "..."` 或 `import type * as Foo from "..."`。
- 需要命名空间式的值时，按名字导入模块自身导出的命名空间，例如 `import { Project } from "@codark-ai/core/project"`，然后引用 `Project.ID`。
- 只在特定路径才需要的重型模块优先用动态导入，尤其是启动敏感的入口。动态导入的绑定要在需要它的最小作用域顶部解构，读起来像普通导入。避免内联链式写法，如 `await import("./module").then((mod) => mod.value())` 或 `(await import("./module")).value()`。分支专用的导入要留在分支内部，保持懒加载。

### 变量

优先 `const` 而非 `let`。用三元或提前返回代替重新赋值。

```ts
// 好
const foo = condition ? 1 : 2

// 坏
let foo
if (condition) foo = 1
else foo = 2
```

### 控制流

避免 `else`，优先提前返回。

```ts
// 好
function foo() {
  if (condition) return 1
  return 2
}

// 坏
function foo() {
  if (condition) return 1
  else return 2
}
```

### 复杂逻辑

当函数有多个校验分支或支撑细节时，让主函数读起来像顺利路径（happy path），把支撑细节移到下方的小辅助函数里。

```ts
// 好
export function loadThing(input: unknown) {
  const config = requireConfig(input)
  const metadata = readMetadata(input)
  return createThing({ config, metadata })
}

function requireConfig(input: unknown) {
  ...
}
```

- 辅助函数贴近它支撑的代码，能改善可读性时放在主导出下方。
- 不要把简单表达式过度抽象成一堆一次性辅助函数；只有当它能命名一个真实概念时才抽取，比如 `requireConfig`、`readMetadata`。
- 辅助函数除非真的执行 effectful 工作，否则不要返回 `Effect`。同步的解析、校验、选项构建保持同步。
- 解析不可信 JSON 字符串时，优先用 Effect schema 辅助函数（如 `Schema.UnknownFromJsonString`、`Schema.decodeUnknownOption`），而不是手动 `JSON.parse` 包 `Effect.try`。
- 注释写给不显然的约束和反直觉行为，显而易见的赋值和控制流不写。

### Schema 定义（Drizzle）

字段名用 snake_case，这样列名就不用再写成字符串重定义。

```ts
// 好
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  created_at: integer().notNull(),
})

// 坏
const table = sqliteTable("session", {
  id: text("id").primaryKey(),
  projectID: text("project_id").notNull(),
  createdAt: integer("created_at").notNull(),
})
```

## 测试

- 尽量避免 mock；除非别无选择，不应使用 globalThis.\*。
- 测真实实现，不要把逻辑复制进测试。
- 测试不能从仓库根目录跑（守卫：`do-not-run-tests-from-root`）；到包目录里跑，比如 `packages/codark`。

## 类型检查

- 一律在包目录下运行 `bun typecheck`（如 `packages/codark`），绝不直接跑 `tsc`。

## V2 Session 核心

- 持久化 prompt 受理与模型执行保持分离。`SessionV2.prompt(...)` 先写入一条持久的 `session_input` 行，再调度建议性的 `SessionExecution.wake(sessionID)`；除非 `resume: false` 要求仅受理。串行化运行器在安全边界把受理的输入提升为可见的用户消息。
- 复用 Session ID 即采用既有 Session。复用 prompt 消息 ID 时，仅当 Session、prompt、投递模式全部一致才按精确重试调和；冲突的复用直接失败。历史投影 prompt 在精确重试时惰性合成提升后的收件箱记录。
- `SessionExecution` 保持进程全局、以 Session ID 为键。其本地实现持有进程内的 Session 协调器，仅在 drain 启动时通过 `SessionStore` 加 `LocationServiceMap.get(session.location)` 发现放置位置；任何 layer 都不应接收 Session ID。V2 中断针对该 Session 当前活跃的进程内持有链；空闲或缺失的中断是无操作。
- `SessionRunner`、模型解析、工具注册表、权限、文件系统保持 Location 作用域。省略 `Location.workspaceID` 表示隐式本地放置；显式 workspace 标识保留给未来的放置语义。
- 每个 provider 回合保留一次显式的 `llm.stream(request)` 调用，并在持久化续跑前重新加载投影历史。不要桥接回旧的 `SessionPrompt.loop(...)`，也不要把编排委托给内存里的工具循环。
- 本地 Session drain 在集群化实现前保持进程内。`SessionRunCoordinator` 合并同一 Session 的显式续跑、合并 prompt 唤醒，并允许不同 Session 并发运行。建议性唤醒只排空合格的持久收件箱行；崩溃后续跑恢复需要单独的显式设计，在此之前不得重试 provider 工作。drain 没有持久身份或 transcript 边界。
- 投递语义保持显式。prompt 默认 steer，在当前 drain 需要续跑时于下一个安全的 provider 回合边界提升；显式 `queue` 输入保持挂起，直到 Session 将要空闲；在该边界提升一个排队输入，然后重新评估续跑，再提升下一个。提升任何新的用户输入都会重置所选 agent 的 provider 回合配额；一批 steer 只重置一次。
- EventV2 回放的所有者声明与集群化 Session 执行所有权保持分离。
- System Context 代数、注册表与内置项留在 `src/system-context`；Context Source 生产者与其观察域放在一起；Session History 选择与 Context Epoch 持久化归 Session 所有。
