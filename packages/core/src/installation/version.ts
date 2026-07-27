declare global {
  const CODARK_VERSION: string
  const CODARK_CHANNEL: string
}

export const InstallationVersion = typeof CODARK_VERSION === "string" ? CODARK_VERSION : "local"
export const InstallationChannel = typeof CODARK_CHANNEL === "string" ? CODARK_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
