import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["CODARK_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["CODARK_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("CODARK_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  CODARK_AUTO_HEAP_SNAPSHOT: truthy("CODARK_AUTO_HEAP_SNAPSHOT"),
  CODARK_GIT_BASH_PATH: process.env["CODARK_GIT_BASH_PATH"],
  CODARK_CONFIG: process.env["CODARK_CONFIG"],
  CODARK_CONFIG_CONTENT: process.env["CODARK_CONFIG_CONTENT"],
  CODARK_DISABLE_AUTOUPDATE: truthy("CODARK_DISABLE_AUTOUPDATE"),
  CODARK_ALWAYS_NOTIFY_UPDATE: truthy("CODARK_ALWAYS_NOTIFY_UPDATE"),
  CODARK_DISABLE_PRUNE: truthy("CODARK_DISABLE_PRUNE"),
  CODARK_DISABLE_TERMINAL_TITLE: truthy("CODARK_DISABLE_TERMINAL_TITLE"),
  CODARK_SHOW_TTFD: truthy("CODARK_SHOW_TTFD"),
  CODARK_DISABLE_AUTOCOMPACT: truthy("CODARK_DISABLE_AUTOCOMPACT"),
  CODARK_DISABLE_MODELS_FETCH: truthy("CODARK_DISABLE_MODELS_FETCH"),
  CODARK_DISABLE_MOUSE: truthy("CODARK_DISABLE_MOUSE"),
  CODARK_FAKE_VCS: process.env["CODARK_FAKE_VCS"],
  CODARK_SERVER_PASSWORD: process.env["CODARK_SERVER_PASSWORD"],
  CODARK_SERVER_USERNAME: process.env["CODARK_SERVER_USERNAME"],
  CODARK_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("CODARK_DISABLE_FFF"),

  // Experimental
  CODARK_EXPERIMENTAL_FILEWATCHER: Config.boolean("CODARK_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  CODARK_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("CODARK_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  CODARK_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("CODARK_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  CODARK_MODELS_URL: process.env["CODARK_MODELS_URL"],
  CODARK_MODELS_PATH: process.env["CODARK_MODELS_PATH"],
  CODARK_DB: process.env["CODARK_DB"],

  CODARK_WORKSPACE_ID: process.env["CODARK_WORKSPACE_ID"],
  CODARK_EXPERIMENTAL_WORKSPACES: enabledByExperimental("CODARK_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get CODARK_DISABLE_PROJECT_CONFIG() {
    return truthy("CODARK_DISABLE_PROJECT_CONFIG")
  },
  get CODARK_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("CODARK_EXPERIMENTAL_REFERENCES")
  },
  get CODARK_TUI_CONFIG() {
    return process.env["CODARK_TUI_CONFIG"]
  },
  get CODARK_CONFIG_DIR() {
    return process.env["CODARK_CONFIG_DIR"]
  },
  get CODARK_PURE() {
    return truthy("CODARK_PURE")
  },
  get CODARK_PERMISSION() {
    return process.env["CODARK_PERMISSION"]
  },
  get CODARK_PLUGIN_META_FILE() {
    return process.env["CODARK_PLUGIN_META_FILE"]
  },
  get CODARK_CLIENT() {
    return process.env["CODARK_CLIENT"] ?? "cli"
  },
}
