import { $ } from "bun"

await $`bun run install-electron`

await $`bun ./scripts/copy-icons.ts ${process.env.CODARK_CHANNEL ?? "dev"}`

await $`cd ../codark && bun script/build-node.ts`
