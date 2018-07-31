/* Typings */

interface RemoteFunction {
    (...args: any[]): any
}

interface RemoteFunctionsList {
    [propName: string]: RemoteFunction
}

interface Message {
    functionName: string
    origin_memex: boolean
    args: any
}

interface MessageEvent {
    data: Message
    [x: string]: any
}

export interface FCInterface {
    remoteFunctions: RemoteFunctionsList
    iframeWindow: Window
    setUpRemoteFunctions(functionList: RemoteFunctionsList): void
    removeMessageListener(): void
    remoteExecute(functionName: string, iframeWindow?: Window): any
}

/**
 * Class for abstracting the communication between a frame and it's parent website.
 * Enables executing function on both ends by creating a wrapper around the window.postMessage API.
 * Similar to the webextensionsRPC, we setup remote functions on both the sides by passing a list
 * of functions to the setupRemoteFunctions method.
 *
 * Inside the frame, we can setup remote functions and directly call remoteExecute.
 * While in the parent side, we need to pass in the iFrame's contentWindow object to
 * the constructor to call remoteExecute.
 *
 */

/*
<Example>
Frame:
fc = new FrameCommunication()
fc.setUpRemoteFunction({foo: something()}) // Sets up functions on the frame side
fc.remoteExecute(funcName)(args) // Executes function on the parent side

Parent:
f = <Frame Element>.contentWindow
fc = new FrameCommunication(f)
fc.setUpRemoteFunction({foo: something()}) // Sets up functions on the parent side
fc.remoteExecute(funcName)(args) // Executes function on the frame side

TODO: Any better name?
 */
class FrameCommunication implements FCInterface {
    remoteFunctions: RemoteFunctionsList = {}
    iframeWindow: Window = null

    constructor(iframeWindow?: Window) {
        this.iframeWindow = iframeWindow
    }

    /**
     * Sets up an object of function which can be called from either the parent or from the iFrame
     * @param {remoteFunctionsList} functionList An object of functions which needs to be remotely executed
     */
    setUpRemoteFunctions = (functionList: RemoteFunctionsList): void => {
        Object.assign(this.remoteFunctions, functionList)
        this._setupListener(this._listener)
    }

    /**
     * Removes iframe-parent messaing listener and clears remoteFunctions
     */
    removeMessageListener = (): void => {
        this._removeListener(this._listener)
        this.remoteFunctions = {}
    }

    /**
     * Executes a given function on the other side with the passed arguments
     * @param {string} functionName Name of the function to execute on the other side
     */
    remoteExecute = (functionName: string): any => (...args: any[]) => {
        const message: Message = {
            functionName,
            origin_memex: true,
            args,
        }
        this._postMessage(message)
    }

    private _setupListener = (messageHandler: any): void => {
        window.addEventListener('message', messageHandler, false)
    }

    private _removeListener = (messageHandler: any): void => {
        window.removeEventListener('message', messageHandler)
    }

    private _listener = async (event: MessageEvent) => {
        const message: Message = event.data

        // Todo: verify if request is coming from sidebar.html

        // Small validation if it's a memex request
        if (!message.origin_memex) {
            return false
        }

        const funcName: string = message.functionName
        const args: any[] = message.hasOwnProperty('args') ? message.args : []
        const func: RemoteFunction = this.remoteFunctions[funcName]

        if (func === undefined) {
            return false
        }

        return await func(...args)
    }

    private _postMessage = (message: Message): void => {
        const targetWindow = this.iframeWindow ? this.iframeWindow : top
        targetWindow.postMessage(message, '*')
    }
}

export default FrameCommunication
