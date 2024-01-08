export type BackendEnv = 'local' | 'staging' | 'production'
export type OnlineBackendEnv = Exclude<BackendEnv, 'local'>
export const getBackendEnv = (): BackendEnv =>
    process.env.NODE_ENV === 'production' ? 'production' : 'staging'
export const getOnlineBackendEnv = (): OnlineBackendEnv => {
    const backendEnv = getBackendEnv()
    assertOnlineBackendEnv(backendEnv)
    return backendEnv
}
export function isOnlineBackendEnv(
    backendEnv: BackendEnv,
): backendEnv is OnlineBackendEnv {
    return backendEnv !== 'local'
}
export function assertOnlineBackendEnv(
    backendEnv: BackendEnv,
): asserts backendEnv is OnlineBackendEnv {
    if (!isOnlineBackendEnv(backendEnv)) {
        throw new Error(`Expected online backend env`)
    }
}
