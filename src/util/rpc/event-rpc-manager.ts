import * as resolvable from '@josephg/resolvable'
import type { Resolvable } from '@josephg/resolvable'
import type { RPCManager, RPCManagerDependencies, RPCRequest } from './types'
import { createRPCRequestObject, createRPCResponseObject } from './utils'
import { RpcError, __REMOTE_EMITTER_EVENT__ } from '../webextensionRPC'
import { serializeError } from 'serialize-error'
import { resolveTabUrl } from '../uri-utils'

const createResolvable = () => resolvable.default()

export class EventBasedRPCManager implements RPCManager {
    private paused?: Resolvable<void>

    constructor(private deps: RPCManagerDependencies) {
        if (deps.initPaused) {
            this.paused = createResolvable()
        }
    }

    private log = (msg: string, obj?: any) => {
        if (this.deps.debug === true || globalThis['memex-rpc-debug']) {
            msg = `RPC::side=${this.deps.sideName}::` + msg
            console['log'](msg, obj ?? {})
        }
    }

    private async postMessageRequestToRPC<T, O>(
        request: RPCRequest<T>,
    ): Promise<O> {
        this.log(`messageRequester:: Requested for [${request.headers.name}]`, {
            request,
        })

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
            throw new RpcError(err)
        }
        this.log(
            `messageRequester:: Got response for [${request.headers.name}]`,
            ret.payload,
        )

        if (ret.error != null) {
            throw new RpcError(
                ret.error ??
                    ret.serializedError ??
                    new Error('Unknown RPC error'),
            )
        }

        return ret.payload
    }

    postMessageRequestToBackground: RPCManager['postMessageRequestToBackground'] =
        async (name, payload) => {
            const request = createRPCRequestObject(
                {
                    name,
                    originSide: this.deps.sideName,
                    recipientSide: 'background',
                },
                payload,
            )
            return this.postMessageRequestToRPC(request)
        }

    postMessageRequestToContentScript: RPCManager['postMessageRequestToContentScript'] =
        async (tabId, name, payload) => {
            const request = createRPCRequestObject(
                {
                    name,
                    tabId,
                    originSide: this.deps.sideName,
                    recipientSide: 'content-script-global',
                },
                payload,
            )
            return this.postMessageRequestToRPC(request)
        }

    postMessageRequestToCSViaBG: RPCManager['postMessageRequestToCSViaBG'] =
        async (tabId, name, payload) => {
            const request = createRPCRequestObject(
                {
                    tabId,
                    name,
                    proxy: 'background',
                    originSide: this.deps.sideName,
                    recipientSide: 'background',
                },
                payload,
            )
            return this.postMessageRequestToRPC(request)
        }

    // NOTE: in Chrome there's a bug which prevents this from being able to return a Promise, so instead
    //  we need to return true (synchronously) then call the `sendResponse` callback after the async stuff is
    //  done to be able to send back data to the `tabs/runtime.sendMessage` call.
    // see: https://issues.chromium.org/issues/40753031
    private messageResponder = (
        request: RPCRequest,
        sender: any,
        sendResponse: (res: any) => void,
    ): true => {
        // These are intended for remote event emitters, which are implemented separately
        if (request[__REMOTE_EMITTER_EVENT__]) {
            return true
        }
        const { headers, payload, error, serializedError } = request
        const { id, name, type } = headers

        const handleRPC = async () => {
            if (type === 'RPC_REQUEST') {
                this.log(
                    `messageResponder:: REQUEST received for [${name}]:`,
                    request,
                )

                if (this.deps.sideName !== request.headers.recipientSide) {
                    this.log(
                        `messageResponder:: REQUEST ignored for [${name}] - wrong recipient:`,
                        request,
                    )
                    return
                }

                let functionReturn: any
                try {
                    if (headers.proxy === 'background') {
                        functionReturn =
                            await this.postMessageRequestToContentScript(
                                headers.tabId!,
                                name,
                                payload,
                            )
                    } else {
                        const f = this.deps.getRegisteredRemoteFunction(name)

                        if (!f) {
                            console.error({
                                side: this.deps.sideName,
                                packet: request,
                            })
                            throw Error(
                                `No registered remote function called ${name}`,
                            )
                        }
                        Object.defineProperty(f, 'name', { value: name })

                        this.log(
                            `messageResponder:: RUNNING Function [${name}]`,
                        )

                        let tab =
                            sender.tab ??
                            (request.headers.tabId != null
                                ? await this.deps.browserAPIs.tabs?.get(
                                      request.headers.tabId,
                                  ) // Tabs API only available in non-CS
                                : undefined)
                        tab = resolveTabUrl(tab)

                        functionReturn = await f({ tab }, ...payload)
                        this.log(
                            `messageResponder:: FINISHED Function [${name}]`,
                            functionReturn,
                        )
                    }

                    const res = createRPCResponseObject({
                        request,
                        payload: functionReturn,
                        originSide: this.deps.sideName,
                        recipientSide: request.headers.originSide,
                    })
                    sendResponse(res)
                } catch (err: any) {
                    this.log(`messageResponder:: ERRORED Function [${name}]`)
                    const res = createRPCResponseObject({
                        request,
                        payload: undefined,
                        error: err,
                        serializedError: serializeError(err),
                        originSide: this.deps.sideName,
                        recipientSide: request.headers.originSide,
                    })
                    sendResponse(res)
                }
            } else if (type === 'RPC_RESPONSE') {
                this.log(`messageResponder:: RESPONSE received for [${name}]`)
                // We don't need to do anything with the response - it's available directly from the `sendMessage` calls
            }
        }

        if (this.paused) {
            this.paused.then(handleRPC)
        } else {
            handleRPC()
        }
        return true
    }

    setup: RPCManager['setup'] = () => {
        chrome.runtime.onMessage.addListener(this.messageResponder as any)
    }

    unpause: RPCManager['unpause'] = () => {
        const paused = this.paused
        delete this.paused
        paused?.resolve()
    }
}
