import uuid from 'uuid/v1'
import { Events } from 'webextension-polyfill-ts/src/generated/events'
import { Runtime } from 'webextension-polyfill-ts'

interface RPCObject {
    headers: {
        type: 'RPC_RESPONSE' | 'RPC_REQUEST'
        id: string
        name: string
        proxy?: 'background'
        tabId?: string
    }
    payload: any
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

export class PortBasedRPCManager {
    private ports = new Map<string, Runtime.Port>()
    private pendingRequests = new Map<string, PendingRequest>()

    static createRPCResponseObject = ({ packet, payload }): RPCObject => ({
        headers: {
            type: 'RPC_RESPONSE',
            id: packet.headers.id,
            name: packet.headers.name,
        },
        payload,
    })

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

    getPortIdForExtBg = () => `${this.sideName}-background`
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

    constructor(
        private sideName,
        private getRegisteredRemoteFunction,
        private connect: RuntimeConnect,
        private onConnect: RuntimeOnConnect,
        private debug: boolean = false,
    ) {}

    log = (msg: string, obj?: any) => {
        if (this.debug === true || window['memex-rpc-debug']) {
            console['log'](msg, obj ?? {})
        }
    }

    registerConnectionToBackground() {
        const pid = `${this.sideName}-bg`
        this.log(`RPC::registerConnectionToBackground::from ${this.sideName}`)
        const port = this.connect(undefined, { name: pid })
        this.ports.set(this.getPortIdForExtBg(), port)

        const RPCResponder = this.messageResponder
        port.onMessage.addListener(RPCResponder)
    }

    registerListenerForIncomingConnections() {
        const connected = (port: Runtime.Port) => {
            this.log(
                `RPC::onConnect::Side:${
                    this.sideName
                } got a connection from ${this.getPortId(port)}`,
            )
            this.ports.set(this.getPortId(port), port)
            port.onMessage.addListener(this.messageResponder)
            port.onDisconnect.addListener((_port) =>
                this.ports.delete(this.getPortId(_port)),
            )
        }

        this.onConnect.addListener(connected)
    }

    public postMessageRequestToExtension(name, payload) {
        const port = this.getExtensionPort(name)
        return this.postMessageToRPC(port, name, payload)
    }

    public postMessageRequestToTab(tabId, name, payload) {
        const port = this.getTabPort(tabId, name)
        return this.postMessageToRPC(port, name, payload)
    }

    // Since only the background script maintains a connection to all the other
    // content scripts and pages. To send a message from say the popup, to a tab,
    // the message is sent via the background script.
    public postMessageRequestToTabViaExtension(tabId, name, payload) {
        const port = this.getExtensionPort(name)
        const request = PortBasedRPCManager.createRPCRequestViaBGObject({
            tabId,
            name,
            payload,
        })
        return this.postMessageRequestToRPC(request, port, name)
    }

    private getExtensionPort(name) {
        const port = this.ports.get(this.getPortIdForExtBg())
        if (!port) {
            console.error({ ports: this.ports })
            throw new Error(
                `Could not get a port to message the extension [${this.getPortIdForExtBg()}] (when trying to call [${name}] )`,
            )
        }
        return port
    }

    private getTabPort(tabId, name) {
        const port = this.ports.get(this.getPortIdForTab(tabId))
        if (!port) {
            console.error({ ports: this.ports })
            throw new Error(
                `Could not get a port to ${this.getPortIdForTab(
                    tabId,
                )} (when trying to call [${name}]`,
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
            this.addPendingRequest(request.headers.id, {
                request,
                promise: { resolve, reject },
            })
        })

        port.postMessage(request)
        this.log(
            `RPC::messageRequester::to-PortName(${port.name}):: Requested for [${name}]`,
            { request },
        )
        const ret = await pendingRequest
        this.log(
            `RPC::messageRequester::to-PortName(${port.name}):: Response for [${name}]`,
            { ret },
        )
        return ret
    }

    private addPendingRequest = (id, request) => {
        this.pendingRequests.set(id, request)
    }

    private messageResponder = (packet, port) => {
        const { headers, payload } = packet
        const { id, name, type } = headers

        if (type === 'RPC_RESPONSE') {
            this.log(
                `RPC::messageResponder::PortName(${port.name}):: RESPONSE received for [${name}]`,
            )
            this.resolvePendingRequest(id, payload)
        } else if (type === 'RPC_REQUEST') {
            this.log(
                `RPC::messageResponder::PortName(${port.name}):: REQUEST received for [${name}]`,
            )

            let returnPromise
            // If the Request type was a proxy, the background shouldn't fullill this request itself
            // but pass it on to the specific tab to fullfill
            if (headers.proxy === 'background') {
                returnPromise = this.postMessageRequestToTab(
                    headers.tabId,
                    name,
                    payload,
                )
            } else {
                const f = this.getRegisteredRemoteFunction(name)

                if (!f) {
                    console.error({ side: this.sideName, packet, port })
                    throw Error(`No registered remote function called ${name}`)
                }
                Object.defineProperty(f, 'name', { value: name })

                this.log(
                    `RPC::messageResponder::PortName(${port.name}):: RUNNING Function [${name}]`,
                )
                returnPromise = Promise.resolve(
                    f({ tab: port?.sender?.tab }, ...payload),
                )
            }

            returnPromise.then((value) => {
                port.postMessage(
                    PortBasedRPCManager.createRPCResponseObject({
                        packet,
                        payload: value,
                    }),
                )
                this.log(
                    `RPC::messageResponder::PortName(${port.name}):: RETURNED Function [${name}]`,
                )
            })
        }
    }

    private resolvePendingRequest = (id, payload) => {
        const request = this.pendingRequests.get(id)

        if (!request) {
            console.error({ sideName: this.sideName, id, payload })
            throw new Error(
                `Tried to resolve a request that does not exist (may have already been resolved) id:${id}`,
            )
        }

        request.promise.resolve(payload)
        this.pendingRequests.delete(id)
    }
}
