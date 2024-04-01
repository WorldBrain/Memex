import type { ErrorObject } from 'serialize-error'
import type { Runtime } from 'webextension-polyfill'

export interface RPCManager {
    postMessageRequestToTab<ReturnVal = any, T = {}>(
        tabId: number,
        name: string,
        payload: T,
        options?: { quietConsole?: boolean },
    ): Promise<ReturnVal>
    postMessageRequestToTabViaBackground<ReturnVal = any>(
        tabId: number,
        name: string,
        payload: any,
    ): Promise<ReturnVal>
    postMessageRequestToBackground<ReturnVal = any>(
        name: string,
        payload: any,
        options?: { skipEnsure?: boolean },
    ): Promise<ReturnVal>
    setup(): void
    unpause(): void
}

export interface RPCManagerDependencies {
    role: RpcRole
    sideName: RpcSideName
    runtimeAPI: Runtime.Static
    initPaused?: boolean
    debug?: boolean
    getRegisteredRemoteFunction: (
        name: string,
    ) => (...args: any[]) => Promise<any>
}

export type RpcRole = 'content' | 'background'
export type RpcSideName =
    | 'background'
    | 'content-script-global'
    | 'content-script-popup'
    | 'extension-page-options'

export interface RPCRequest<T = any> {
    headers: RPCRequestHeaders
    payload: T
    error?: any
    serializedError?: ErrorObject
}

export interface RPCRequestHeaders {
    id: string
    name: string
    tabId?: number
    proxy?: 'background'
    type: 'RPC_RESPONSE' | 'RPC_REQUEST'
}
