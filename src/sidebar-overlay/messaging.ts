
const remoteFunctions = {}

const _setupListener = ( messageHandler : function) : void => {
    window.addEventListener('message', messageHandler, false)
}

const _removeListener = ( messageHandler : function) : void => {
    window.removeEventListener('message', messageHandler)
}

const _listener = async (event) => {
    const message : Message = event.data

    // Small validation if it's a memex request
    if (!message.origin_memex){
        return false
    }
    
    const funcName = message.functionName
    const args = message.hasOwnProperty('args') ? message.args : []
    const func = remoteFunctions[funcName]

    if (func === undefined){
        return false
    }

    return await func(...args)
}

interface Message {
    functionName: string,
    origin_memex: boolean,
    args: any
}

const _postMessage = ( message: Message ) : void => {
    // Right now, message transfer is only from frame to parent
    let targetWindow = top
    targetWindow.postMessage(message, '*')
}


export const setUpRemoteFunctions = ( functionList ) => {
    Object.assign(remoteFunctions, functionList)
    _setupListener(_listener)
}


export const remoteExecute = ( functionName : string): any => (...args: any[]) => {
    const message : Message = {
        functionName,
        origin_memex: true,
        args,
    }
    _postMessage(message)
}
