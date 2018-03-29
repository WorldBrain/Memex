// A Remote Procedure Call abstraction around the message passing available to
// WebExtension scripts. Usable to call a function in the background script from
// a tab's content script, or vice versa.
//
// The calling side always gets a Promise of the return value. The executing
// (remote) function can be an async function (= it returns a Promise), whose
// completion then will then be waited for.

// Example use:
//
// === background.js ===
// function myFunc(arg) {
//     return arg*2
// }
// makeRemotelyCallable({myFunc})
//
// === content_script.js ===
// const myRemoteFunc = remoteFunction('myFunc')
// myRemoteFunc(21).then(result => { ... result is 42! ... })

import mapValues from 'lodash/fp/mapValues'

// Our secret tokens to recognise our messages
const RPC_CALL = '__RPC_CALL__'
const RPC_RESPONSE = '__RPC_RESPONSE__'

// === Initiating side ===

// Create a proxy function that invokes the specified remote function.
// Arguments
// - funcName (required): name of the function as registered on the remote side.
// - options (optional): {
//       tabId: The id of the tab whose content script is the remote side.
//              Leave undefined to call the background script (from a tab).
//   }
export function remoteFunction(funcName, { tabId } = {}) {
    const otherSide =
        tabId !== undefined
            ? "the tab's content script"
            : 'the background script'

    const f = async function(...args) {
        const message = {
            [RPC_CALL]: RPC_CALL,
            funcName,
            args,
            isFirefox: typeof browser.runtime.getBrowserInfo !== 'undefined',
        }

        // Try send the message and await the response.
        let response
        try {
            response =
                tabId != null
                    ? await browser.tabs.sendMessage(tabId, message)
                    : await browser.runtime.sendMessage(message)
        } catch (err) {
            const origErrMsg = err.message
                ? `\nError message: ${err.message}`
                : ''

            throw new Error(
                `Got no response when trying to call '${funcName}'. ` +
                    `Did you enable RPC in ${otherSide}?` +
                    origErrMsg,
            )
        }

        // Check if it was *our* listener that responded.
        if (!response || response[RPC_RESPONSE] !== RPC_RESPONSE) {
            throw new Error(`RPC got a response from an interfering listener.`)
        }

        // Return the value or throw the error we received from the other side.
        if (response.errorMessage) {
            throw new Error(response.errorMessage)
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

function incomingRPCListener(message, sender, sendResponse) {
    if (!message || message[RPC_CALL] !== RPC_CALL) {
        return false
    }

    function handleResponse(value) {
        // Chrome seems fine returning a Promise
        if (!message.isFirefox) {
            return Promise.resolve(value)
        }

        // Set up to call `sendResponse` callback on FF, and immediately return `true`
        Promise.resolve(value)
            .then(sendResponse)
            .catch(sendResponse)
        return true
    }

    const funcName = message.funcName
    const args = message.hasOwnProperty('args') ? message.args : []
    const func = remotelyCallableFunctions[funcName]
    if (func === undefined) {
        console.error(noSuchFunctionError, funcName)

        return handleResponse({
            error: `No such function registered for RPC: ${funcName}`,
            [RPC_RESPONSE]: RPC_RESPONSE,
        })
    }

    // Run the function, and await its value if it returns a promise.
    const returnValue = func({ tab: sender.tab }, ...args)
    return handleResponse(
        Promise.resolve(returnValue)
            .then(returnValue => ({
                returnValue,
                [RPC_RESPONSE]: RPC_RESPONSE,
            }))
            .catch(error => ({
                error: error.message,
                [RPC_RESPONSE]: RPC_RESPONSE,
            })),
    )
}

// A bit of global state to ensure we only attach the event listener once.
let enabled = false

// Register a function to allow remote scripts to call it.
// Arguments:
// - functions (required):
//     An object with a {functionName: function} mapping.
//     Each function will be callable with the given name.
// - options (optional): {
//       insertExtraArg:
//           If truthy, each executed function also receives, as its first
//           argument before the arguments it was invoked with, an object with
//           the details of the tab that sent the message.
//   }

export function makeRemotelyCallable(
    functions,
    { insertExtraArg = false } = {},
) {
    // Every function is passed an extra argument with sender information,
    // so remove this from the call if this was not desired.
    if (!insertExtraArg) {
        // Replace each func with...
        const wrapFunctions = mapValues(func =>
            // ...a function that calls func, but hides the inserted argument.
            (extraArg, ...args) => func(...args),
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
