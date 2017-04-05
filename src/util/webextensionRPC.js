import mapValues from 'lodash/fp/mapValues'

// Our secret tokens to recognise our messages
const RPC_CALL = '__RPC_CALL__'


// === Initiating side ===

const sendMessageErrorMessage = ({funcName, otherSide}) =>
    `Got no response from RPC when calling '${funcName}'. `
    + `Did you enable RPC in ${otherSide}?`

export function remoteFunction(funcName, {tabId} = {}) {
    const sendMessage = (tabId !== undefined)
        ? message => {
            return browser.tabs.sendMessage(tabId, message).catch(
                err => {
                    throw new Error(sendMessageErrorMessage({
                        funcName,
                        otherSide: "the tab's content script",
                    }))
                }
            )
        }
        : message => {
            return browser.runtime.sendMessage(message).catch(
                err => {
                    throw new Error(sendMessageErrorMessage({
                        funcName,
                        otherSide: 'the background script',
                    }))
                }
            )
        }

    const f = function (...args) {
        const message = {
            [RPC_CALL]: RPC_CALL,
            funcName,
            args,
        }
        return sendMessage(message).then(response => {
            if (response.error) {
                throw new Error(response.error)
            } else {
                return response.returnValue
            }
        })
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
