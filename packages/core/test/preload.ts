import path from "path"

process.env.CODARK_DB = ":memory:"
process.env.CODARK_MODELS_PATH = path.join(import.meta.dir, "plugin", "fixtures", "models-dev.json")
process.env.CODARK_DISABLE_MODELS_FETCH = "true"
