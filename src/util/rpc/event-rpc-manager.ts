import createResolvable, { Resolvable } from '@josephg/resolvable'
import type { RPCManager, RPCManagerDependencies, RPCRequest } from './types'
import type { Runtime } from 'webextension-polyfill'
import { createRPCRequestObject, createRPCResponseObject } from './utils'
import { RpcError } from '../webextensionRPC'
import { resolveTabUrl } from '../uri-utils'

export class EventBasedRPCManager implements RPCManager {
    private paused?: Resolvable<void>

    constructor(private deps: RPCManagerDependencies) {
        if (deps.initPaused) {
            this.paused = createResolvable()
        }
    }

    private log = (msg: string, obj?: any) => {
        if (this.deps.debug === true || globalThis['memex-rpc-debug']) {
            console['log'](msg, obj ?? {})
        }
    }

    private async postMessageRequestToRPC<T, O>(
        request: RPCRequest<T>,
    ): Promise<O> {
        this.log(
            `RPC::messageRequester::from-${this.deps.sideName}:: Requested for [${request.headers.name}]`,
            { request },
        )

        let ret: RPCRequest<O>
        try {
            if (this.deps.sideName === 'background') {
                ret = await this.deps.browserAPIs.tabs.sendMessage(
                    request.headers.tabId,
                    request,
                )
            } else {
                ret = await this.deps.browserAPIs.runtime.sendMessage(request)
            }
        } catch (err) {
            throw new RpcError(err.message)
        }
        this.log(
            `RPC::messageRequester::from-${this.deps.sideName}:: Got response for [${request.headers.name}]`,
            ret.payload,
        )
        return ret.payload
    }

    postMessageRequestToBackground: RPCManager['postMessageRequestToBackground'] = async (
        name,
        payload,
    ) => {
        const request = createRPCRequestObject(
            { name, originSide: this.deps.sideName },
            payload,
        )
        return this.postMessageRequestToRPC(request)
    }

    postMessageRequestToTab: RPCManager['postMessageRequestToTab'] = async (
        tabId,
        name,
        payload,
    ) => {
        const request = createRPCRequestObject(
            { name, tabId, originSide: this.deps.sideName },
            payload,
        )
        return this.postMessageRequestToRPC(request)
    }

    postMessageRequestToTabViaBackground: RPCManager['postMessageRequestToTabViaBackground'] = async (
        tabId,
        name,
        payload,
    ) => {
        const request = createRPCRequestObject(
            {
                tabId,
                proxy: 'background',
                name,
                originSide: this.deps.sideName,
            },
            payload,
        )
        return this.postMessageRequestToRPC(request)
    }

    private messageResponder = async (
        request: RPCRequest,
        sender: Runtime.MessageSender,
    ) => {
        await this.paused

        const { headers, payload, error, serializedError } = request
        const { id, name, type } = headers

        if (type === 'RPC_REQUEST') {
            this.log(`RPC::messageResponder:: REQUEST received for [${name}]`)

            // If the Request type was a proxy, the background shouldn't fullill this request itself
            // but pass it on to the specific tab to fullfill
            if (headers.proxy === 'background') {
                await this.postMessageRequestToTab(headers.tabId, name, payload)
            } else {
                const f = this.deps.getRegisteredRemoteFunction(name)

                if (!f) {
                    console.error({ side: this.deps.sideName, packet: request })
                    throw Error(`No registered remote function called ${name}`)
                }
                Object.defineProperty(f, 'name', { value: name })

                this.log(`RPC::messageResponder:: RUNNING Function [${name}]`)

                const tabId = sender.tab?.id ?? request.headers.tabId
                let tab =
                    tabId != null
                        ? await this.deps.browserAPIs.tabs.get(tabId)
                        : undefined
                tab = resolveTabUrl(tab)

                try {
                    const functionReturn = await f({ tab }, ...payload)
                    this.log(
                        `RPC::messageResponder:: FINISHED Function [${name}]`,
                        functionReturn,
                    )
                    return createRPCResponseObject({
                        request,
                        payload: functionReturn,
                        originSide: this.deps.sideName,
                    })
                } catch (err) {
                    this.log(
                        `RPC::messageResponder:: ERRORED Function [${name}]`,
                    )
                    throw new RpcError(err.message)
                }
            }
        } else if (type === 'RPC_RESPONSE') {
            this.log(`RPC::messageResponder:: RESPONSE received for [${name}]`)
            // We don't need to do anything with the response - it's available directly from the `sendMessage` calls
        }
    }

    setup: RPCManager['setup'] = () => {
        this.deps.browserAPIs.runtime.onMessage.addListener(
            this.messageResponder,
        )
    }

    unpause: RPCManager['unpause'] = () => {
        const paused = this.paused
        delete this.paused
        paused?.resolve()
    }
}
