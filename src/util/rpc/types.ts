import type { ErrorObject } from 'serialize-error'
import type { Browser } from 'webextension-polyfill'

export interface RPCManager {
    postMessageRequestToTab<Input = any, Output = any>(
        tabId: number,
        name: string,
        payload: Input,
        options?: { quietConsole?: boolean },
    ): Promise<Output>
    postMessageRequestToTabViaBackground<Input = any, Output = any>(
        tabId: number,
        name: string,
        payload: Input,
    ): Promise<Output>
    postMessageRequestToBackground<Input = any, Output = any>(
        name: string,
        payload: Input,
        options?: { skipEnsure?: boolean },
    ): Promise<Output>
    setup(): void
    unpause(): void
}

export interface RPCManagerDependencies {
    role: RpcRole
    sideName: RpcSideName
    browserAPIs: Browser
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
    originSide: RpcSideName
    type: 'RPC_RESPONSE' | 'RPC_REQUEST'
}
