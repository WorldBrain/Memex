import type { Runtime } from 'webextension-polyfill'

// Stolen from https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#keep_a_service_worker_alive_until_a_long-running_operation_is_finished
export async function keepWorkerAlive<T>(
    promise: Promise<T>,
    deps: {
        runtimeAPI: Runtime.Static
    },
): Promise<T> {
    const keepAlive = setInterval(deps.runtimeAPI.getPlatformInfo, 25 * 1000)
    try {
        const result = await promise
        return result
    } finally {
        clearInterval(keepAlive)
    }
}
