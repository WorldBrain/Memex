interface remoteFunction {
    (...args: any[]): any
}

interface remoteFunctionsList {
    [propName: string]: remoteFunction
}

let remoteFunctions: remoteFunctionsList = {}

const _setupListener = (messageHandler: any): void => {
    window.addEventListener('message', messageHandler, false)
}

const _removeListener = (messageHandler: any): void => {
    window.removeEventListener('message', messageHandler)
}

const _listener = async event => {
    const message: Message = event.data

    // Small validation if it's a memex request
    if (!message.origin_memex) {
        return false
    }

    const funcName: string = message.functionName
    const args: any[] = message.hasOwnProperty('args') ? message.args : []
    const func: remoteFunction = remoteFunctions[funcName]

    if (func === undefined) {
        return false
    }

    return await func(...args)
}

interface Message {
    functionName: string
    origin_memex: boolean
    args: any
}

const _postMessage = (message: Message, iframeWindow?: Window): void => {
    const targetWindow = iframeWindow ? iframeWindow : top
    targetWindow.postMessage(message, '*')
}

/**
 * Sets up an object of function which can be called from either the parent or from the iFrame
 * @param {remoteFunctionsList} functionList An object of functions which needs to be remotely executed
 */
export const setUpRemoteFunctions = (functionList: remoteFunctionsList) => {
    Object.assign(remoteFunctions, functionList)
    _setupListener(_listener)
}

export const removeMessageListener = () => {
    _removeListener(_listener)
    remoteFunctions = {}
}

export const remoteExecute = (
    functionName: string,
    iframeWindow?: Window,
): any => (...args: any[]) => {
    const message: Message = {
        functionName,
        origin_memex: true,
        args,
    }
    _postMessage(message, iframeWindow)
}
