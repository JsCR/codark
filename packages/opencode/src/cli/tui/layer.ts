import { run as runTui, type TuiInput } from "@opencode-ai/tui"
import { Global } from "@codark-ai/core/global"
import { AppNodeBuilder } from "@codark-ai/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
