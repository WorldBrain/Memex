import mapValues from 'lodash/fp/mapValues'


// Our secret tokens to recognise our messages
const RPC_CALL = '__RPC_CALL__'
const RPC_RESPONSE = '__RPC_RESPONSE__'


// === Initiating side ===

export function remoteFunction(funcName, {tabId} = {}) {
    const otherSide = (tabId !== undefined)
        ? "the tab's content script"
        : 'the background script'

    const f = async function (...args) {
        const message = {
            [RPC_CALL]: RPC_CALL,
            funcName,
            args,
        }

        // Try send the message and await the response.
        let response
        try {
            response = (tabId !== undefined)
                ? await browser.tabs.sendMessage(tabId, message)
                : await browser.runtime.sendMessage(message)
        } catch (err) {
            throw new Error(
                `Got no response when trying to call '${funcName}'. `
                + `Did you enable RPC in ${otherSide}?`
            )
        }

        // Check if it was *our* listener that responded.
        if (!response || response[RPC_RESPONSE] !== RPC_RESPONSE) {
            throw new Error(`RPC got a response from an interfering listener.`)
        }

        // Return the value or throw the error we received from the other side.
        if (response.error) {
            throw new Error(response.error)
        } else {
            return response.returnValue
        }
    }

    // Give it a name, could be helpful in debugging
    Object.defineProperty(f, 'name', { value: `${funcName}_RPC` })
    return f
}


// === Executing side ===

const noSuchFunctionError = 'Received RPC for unknown function: '

const remotelyCallableFunctions = {}

function incomingRPCListener(message, sender) {
    if (message && message[RPC_CALL] === RPC_CALL) {
        const funcName = message.funcName
        const args = message.hasOwnProperty('args') ? message.args : []
        const func = remotelyCallableFunctions[funcName]
        if (func === undefined) {
            console.error(noSuchFunctionError, funcName)
            return {
                error: `No such function registered for RPC: ${funcName}`,
            }
        }
        const extraArg = {
            tab: sender.tab,
        }
        const value = func(extraArg, ...args)
        return Promise.resolve(value).then(
            value => ({
                returnValue: value,
                [RPC_RESPONSE]: RPC_RESPONSE,
            })
        )
    }
}

let enabled = false
export function makeRemotelyCallable(functions, {insertExtraArg = false} = {}) {
    // Every function is passed an extra argument with sender information,
    // so remove this from the call if this was not desired.
    if (!insertExtraArg) {
        // Replace each func with...
        const wrapFunctions = mapValues(func =>
            // ...a function that calls func, but hides the inserted argument.
            (extraArg, ...args) => func(...args)
        )
        functions = wrapFunctions(functions)
    }

    // Add the functions to our global repetoir.
    Object.assign(remotelyCallableFunctions, functions)

    // Enable the listener if needed.
    if (!enabled) {
        browser.runtime.onMessage.addListener(incomingRPCListener)
        enabled = true
    }
}
