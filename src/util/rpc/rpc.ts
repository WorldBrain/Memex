import createResolvable, { Resolvable } from '@josephg/resolvable'
import { serializeError, deserializeError, ErrorObject } from 'serialize-error'
import uuid from 'uuid/v1'
import type { Events } from 'webextension-polyfill-ts/src/generated/events'
import { Runtime } from 'webextension-polyfill'
import { filterTabUrl } from 'src/util/uri-utils'
import { sleepPromise } from '../promises'
import { RpcError } from '../webextensionRPC'

interface RPCObject {
    headers: {
        type: 'RPC_RESPONSE' | 'RPC_REQUEST'
        id: string
        name: string
        proxy?: 'background'
        tabId?: number
    }
    payload: any
    error?: any
    serializedError?: ErrorObject
}

interface PendingRequest {
    request: RPCObject
    promise: { resolve: any; reject: any }
}

type RuntimeConnect = (
    extensionId?: string,
    connectInfo?: { name?: string },
) => Runtime.Port
type RuntimeOnConnect = Events.Event<(port: Runtime.Port) => void>

export type RpcRole = 'content' | 'background'
export type RpcSideName =
    | 'background'
    | 'content-script-global'
    | 'content-script-popup'
    | 'extension-page-options'

export class PortBasedRPCManager {
    private ports = new Map<string, Runtime.Port>()
    private pendingRequests = new Map<string, PendingRequest>()

    static createRPCResponseObject = (
        params: Omit<RPCObject, 'headers'> & {
            packet: { headers: { id: string; name: string } }
        },
    ): RPCObject => {
        const {
            packet: { headers },
        } = params
        return {
            headers: {
                type: 'RPC_RESPONSE',
                id: headers.id,
                name: headers.name,
            },
            payload: params.payload,
            error: params.error,
            serializedError: params.serializedError,
        }
    }

    static createRPCRequestObject = ({ name, payload }): RPCObject => ({
        headers: {
            type: 'RPC_REQUEST',
            id: uuid(),
            name: `${name}`,
        },
        payload,
    })

    // A request that is sent from one content script to another, via the background script
    static createRPCRequestViaBGObject = ({
        tabId,
        name,
        payload,
    }): RPCObject => ({
        headers: {
            type: 'RPC_REQUEST',
            proxy: 'background',
            tabId,
            id: uuid(),
            name,
        },
        payload,
    })

    getPortIdForExtBg = () => `${this.options.sideName}-background`
    getPortIdForTab = (tabId: number) => `content-script-background|t:${tabId}`

    getPortId = (port: Runtime.Port) => {
        if (port.sender?.tab) {
            return this.getPortIdForTab(port.sender.tab.id)
        }

        if (port.sender?.url) {
            return `n:${port.name}|url:${port.sender?.url}`
        }

        if (port.name) {
            return `n:${port.name}`
        }

        console.error({ port })
        throw new Error(
            `Port has neither Sender or a name, something went wrong`,
        )
    }

    _paused?: Resolvable<void>
    _ensuredFirstConnection = false
    _ensuringConnection?: Resolvable<void>

    constructor(
        private options: {
            sideName: string
            role: 'content' | 'background'
            getRegisteredRemoteFunction: (
                name: string,
            ) => (...args: any[]) => Promise<any>
            connect: RuntimeConnect
            onConnect: RuntimeOnConnect
            debug?: boolean
            paused?: boolean
        },
    ) {
        if (options.paused) {
            this._paused = createResolvable()
        }
    }

    setup() {
        if (this.options.role === 'content') {
            this.registerConnectionToBackground()
        }

        if (this.options.role === 'background') {
            this.registerListenerForIncomingConnections()
        }
    }

    log = (msg: string, obj?: any) => {
        if (this.options.debug === true || globalThis['memex-rpc-debug']) {
            console['log'](msg, obj ?? {})
        }
    }

    unpause() {
        const paused = this._paused
        delete this._paused
        paused?.resolve()
    }

    async registerConnectionToBackground() {
        const pid = `${this.options.sideName}-bg`
        this.log(
            `RPC::registerConnectionToBackground::from ${this.options.sideName}`,
        )

        try {
            const port = this.options.connect(undefined, { name: pid })
            const portId = this.getPortIdForExtBg()
            this.ports.set(portId, port)
            port.onMessage.addListener(this.messageResponder)
        } catch (err) {
            throw new RpcError(err.message)
        }
    }

    unregisterConnectionToBackground() {
        const portId = this.getPortIdForExtBg()
        const port = this.ports.get(portId)
        if (!port) {
            return
        }

        this.ports.delete(portId)
        port.onMessage.removeListener(this.messageResponder)
        try {
            port.disconnect()
        } catch (err) {
            console.error(
                `Ignored error while disconnecting from background script`,
                err,
            )
        }
    }

    async ensureConnectionToBackground(options: {
        timeout: number
        reconnectOnTimeout?: boolean
    }) {
        if (this._ensuringConnection) {
            return this._ensuringConnection
        }

        const ensuringConnection = createResolvable()
        this._ensuringConnection = ensuringConnection
        while (true) {
            const sleeping = sleepPromise(options.timeout)
            const result = await Promise.race([
                this.postMessageRequestToExtension(
                    'confirmBackgroundScriptLoaded',
                    [],
                    { skipEnsure: true },
                ).then(() => 'success' as 'success'),
                sleeping.then(() => 'timeout' as 'timeout'),
            ]).catch(() => 'error' as 'error')

            if (result === 'success') {
                break
            }
            if (result === 'error') {
                await sleeping
            }
            if (result === 'error' || options.reconnectOnTimeout) {
                this.unregisterConnectionToBackground()
                await this.registerConnectionToBackground()
            }
        }
        delete this._ensuringConnection
        ensuringConnection.resolve()
    }

    registerListenerForIncomingConnections() {
        const connected = (port: Runtime.Port) => {
            this.log(
                `RPC::onConnect::Side:${
                    this.options.sideName
                } got a connection from ${this.getPortId(port)}`,
            )
            this.ports.set(this.getPortId(port), port)
            port.onMessage.addListener(this.messageResponder)
            port.onDisconnect.addListener((_port) =>
                this.ports.delete(this.getPortId(_port)),
            )
        }

        this.options.onConnect.addListener(connected)
    }

    async postMessageRequestToExtension(
        name: string,
        payload: any,
        options?: { skipEnsure?: boolean },
    ) {
        if (!options?.skipEnsure) {
            if (this._ensuredFirstConnection) {
                // await this._ensuringFirstConnection
                await this.ensureConnectionToBackground({
                    timeout: 1000,
                    reconnectOnTimeout: true,
                })
            } else {
                // this._ensuringFirstConnection = createResolvable()
                await this.ensureConnectionToBackground({
                    timeout: 300,
                    reconnectOnTimeout: false,
                })
                // this._ensuringFirstConnection.resolve()
            }
        }
        const port = this.getExtensionPort(name)
        return this.postMessageToRPC(port, name, payload)
    }

    public postMessageRequestToTab(
        tabId: number,
        name: string,
        payload: any,
        quietConsole?: boolean,
    ) {
        const port = this.getTabPort(tabId, name, quietConsole)
        return this.postMessageToRPC(port, name, payload)
    }

    // Since only the background script maintains a connection to all the other
    // content scripts and pages. To send a message from say the popup, to a tab,
    // the message is sent via the background script.
    public postMessageRequestToTabViaExtension(
        tabId: string,
        name: string,
        payload: any,
    ) {
        const port = this.getExtensionPort(name)
        const request = PortBasedRPCManager.createRPCRequestViaBGObject({
            tabId,
            name,
            payload,
        })
        return this.postMessageRequestToRPC(request, port, name)
    }

    private getExtensionPort(name: string) {
        const port = this.ports.get(this.getPortIdForExtBg())
        if (!port) {
            console.error('ports: ', [...this.ports.entries()])
            throw new Error(
                `Could not get a port to message the extension [${this.getPortIdForExtBg()}] (when trying to call [${name}] )`,
            )
        }
        return port
    }

    private getTabPort(tabId: number, name: string, quietConsole?: boolean) {
        const port = this.ports.get(this.getPortIdForTab(tabId))
        if (!port) {
            if (!quietConsole) {
                console.error('ports: ', [...this.ports.entries()])
            }

            throw new Error(
                `Could not get a port to ${this.getPortIdForTab(
                    tabId,
                )} (when trying to call [${name}] )`,
            )
        }
        return port
    }

    private postMessageToRPC = async (
        port: Runtime.Port,
        name: string,
        payload: any,
    ) => {
        const request = PortBasedRPCManager.createRPCRequestObject({
            name,
            payload,
        })
        return this.postMessageRequestToRPC(request, port, name)
    }

    private async postMessageRequestToRPC(
        request: RPCObject,
        port: Runtime.Port,
        name: string,
    ) {
        // Return the promise for to await for and allow the promise to be resolved by
        // incoming messages
        const pendingRequest = new Promise((resolve, reject) => {
            this.pendingRequests.set(request.headers.id, {
                request,
                promise: { resolve, reject },
            })
        })

        this.log(
            `RPC::messageRequester::to-PortName(${port.name}):: Requested for [${name}]`,
            { request },
        )

        let ret: any
        try {
            port.postMessage(request)
            ret = await pendingRequest
        } catch (err) {
            if (err.fromBgScript) {
                throw new RpcError(
                    'Error occurred in BG script: ' + err.message,
                )
            } else {
                throw new RpcError(err.message)
            }
        }
        this.log(
            `RPC::messageRequester::to-PortName(${port.name}):: Response for [${name}]`,
            { ret },
        )
        return ret
    }

    private messageResponder = async (
        packet: RPCObject,
        port: Runtime.Port,
    ) => {
        await this._paused

        const { headers, payload, error, serializedError } = packet
        const { id, name, type } = headers

        if (type === 'RPC_RESPONSE') {
            this.log(
                `RPC::messageResponder::PortName(${port.name}):: RESPONSE received for [${name}]`,
            )
            this.resolvePendingRequest(id, payload, error, serializedError)
        } else if (type === 'RPC_REQUEST') {
            this.log(
                `RPC::messageResponder::PortName(${port.name}):: REQUEST received for [${name}]`,
            )

            // If the Request type was a proxy, the background shouldn't fullill this request itself
            // but pass it on to the specific tab to fullfill
            if (headers.proxy === 'background') {
                await this.postMessageRequestToTab(headers.tabId, name, payload)
            } else {
                const f = this.options.getRegisteredRemoteFunction(name)

                if (!f) {
                    console.error({ side: this.options.sideName, packet, port })
                    throw Error(`No registered remote function called ${name}`)
                }
                Object.defineProperty(f, 'name', { value: name })

                this.log(
                    `RPC::messageResponder::PortName(${port.name}):: RUNNING Function [${name}]`,
                )

                const tab = filterTabUrl(port?.sender?.tab)
                const functionReturn = f({ tab }, ...payload)
                Promise.resolve(functionReturn)
                    .then((promiseReturn) => {
                        port.postMessage(
                            PortBasedRPCManager.createRPCResponseObject({
                                packet,
                                payload: promiseReturn,
                            }),
                        )
                        this.log(
                            `RPC::messageResponder::PortName(${port.name}):: RETURNED Function [${name}]`,
                        )
                    })
                    .catch((err) => {
                        console.error(err)
                        if (err.message.includes('disconnected port')) {
                            this.log(
                                `RPC::messageResponder::PortName(${port.name}):: ERRORED Function [${name}] -- Port Disconnected`,
                            )
                        } else {
                            port.postMessage(
                                PortBasedRPCManager.createRPCResponseObject({
                                    packet,
                                    payload: null,
                                    error: err.message,
                                    serializedError: serializeError(err),
                                }),
                            )
                            this.log(
                                `RPC::messageResponder::PortName(${port.name}):: ERRORED Function [${name}]`,
                            )
                        }
                        throw new RpcError(err.message)
                    })
            }
        }
    }

    private resolvePendingRequest = (id, payload, error, serializedError) => {
        const request = this.pendingRequests.get(id)

        if (!request) {
            console.error({ sideName: this.options.sideName, id, payload })
            throw new Error(
                `Tried to resolve a request that does not exist (may have already been resolved) id:${id}`,
            )
        }
        if (error) {
            const deserializedError = deserializeError(serializedError)
            deserializedError['fromBgScript'] = true
            console.error(
                `Calling ${request.request.headers.name} errored, bg stack trace below`,
            )
            console.error(deserializedError)

            request.promise.reject(deserializedError)
        } else {
            request.promise.resolve(payload)
        }
        this.pendingRequests.delete(id)
    }
}
