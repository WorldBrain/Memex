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
import browser from 'webextension-polyfill'
import { EventEmitter } from 'events'
import { EventBasedRPCManager } from 'src/util/rpc/event-rpc-manager'
import type { RpcSideName, RpcRole, RPCManager } from './rpc/types'
import type { RemoteFunctionImplementations } from 'src/util/remote-functions-background'
import type { Arguments, default as TypedEventEmitter } from 'typed-emitter'
import type { AuthRemoteEvents } from 'src/authentication/background/types'
import type { ContentSharingEvents } from 'src/content-sharing/background/types'
import type { PersonalCloudBackgroundEvents } from '../personal-cloud/background/types'
import type { PageSummaryBackgroundEvents } from 'src/summarization-llm/background/types'

export class RpcError extends Error {
    constructor(message: string) {
        super(message)
        this.name = this.constructor.name
    }
}

export type RemoteFunctionRole = 'provider' | 'caller'
export type RemoteFunction<
    Role extends RemoteFunctionRole,
    Params,
    Returns = void
> = Role extends 'provider'
    ? (info: { tab: { id: number } }, params: Params) => Promise<Returns>
    : (params: Params) => Promise<Returns>
export type RemotePositionalFunction<
    Role extends RemoteFunctionRole,
    Params extends Array<any>,
    Returns = void
> = Role extends 'provider'
    ? (info: { tab: { id: number } }, ...params: Params) => Promise<Returns>
    : (...params: Params) => Promise<Returns>
export type RemoteFunctionWithExtraArgs<
    Role extends RemoteFunctionRole,
    Params,
    Returns = void
> = Role extends 'provider'
    ? {
          withExtraArgs: true
          function: RemoteFunction<Role, Params, Returns>
      }
    : RemoteFunction<Role, Params, Returns>
export type RemoteFunctionWithoutExtraArgs<
    Role extends RemoteFunctionRole,
    Params,
    Returns = void
> = Role extends 'provider'
    ? {
          withExtraArgs: false
          function: (params: Params) => Promise<Returns>
      }
    : (params: Params) => Promise<Returns>
export function remoteFunctionWithExtraArgs<Params, Returns = void>(
    f: RemoteFunction<'provider', Params, Returns>,
): RemoteFunctionWithExtraArgs<'provider', Params, Returns> {
    return { withExtraArgs: true, function: f }
}
export function remoteFunctionWithoutExtraArgs<Params, Returns = void>(
    f: (params: Params) => Promise<Returns>,
): RemoteFunctionWithoutExtraArgs<'provider', Params, Returns> {
    return { withExtraArgs: false, function: f }
}
export function registerRemoteFunctions<Functions>(
    functions: {
        [Name in keyof Functions]:
            | RemoteFunctionWithExtraArgs<'provider', any, any>
            | RemoteFunctionWithoutExtraArgs<'provider', any, any>
    },
) {
    for (const [name, metadata] of Object.entries(functions)) {
        const typedMetadata = metadata as
            | RemoteFunctionWithExtraArgs<'provider', any, any>
            | RemoteFunctionWithoutExtraArgs<'provider', any, any>
        makeRemotelyCallable(
            { [name]: typedMetadata.function },
            { insertExtraArg: typedMetadata.withExtraArgs },
        )
    }
}

// === Initiating side ===

// runInBackground and runInTab create a Proxy object that look like the real interface but actually call remote functions
//
// When the Proxy is asked for a property (such as a method)
// return a function that executes the requested method over the RPC interface
//
// Example Usage:
//      interface AnalyticsInterface { trackEvent({}) => any }
//      const analytics = runInBackground<AnalyticsInterface>()
//      analytics.trackEvent(...)

// Runs a remoteFunction in the background script
export function runInBackground<T extends object>(): T {
    return new Proxy<T>({} as T, {
        get(target, property): (...args: any[]) => Promise<any> {
            return async (...args) => {
                if (!rpcConnection) {
                    throw new Error(
                        `runInBackground: RPC connection has not been setup.\nfn name: ${property.toString()}\nargs: ${args}\n\nIf you are calling direct from content-script code, instead pass it down from the global content-script.\n`,
                    )
                }
                return rpcConnection.postMessageRequestToBackground(
                    property.toString(),
                    args,
                )
            }
        },
    })
}

// Runs a remoteFunction in the content script on a certain tab
export function runInTab<T extends object>(
    tabId: number,
    opts?: { quietConsole?: boolean },
): T {
    return new Proxy<T>({} as T, {
        get(target, property): any {
            return (...args) =>
                rpcConnection.postMessageRequestToTab(
                    tabId,
                    property.toString(),
                    args,
                    opts,
                )
        },
    })
}

// Runs a remoteFunction in the content script on a certain tab by asking the background script to do so
export function runInTabViaBg<T extends object>(tabId): T {
    return new Proxy<T>({} as T, {
        get(target, property): any {
            return (...args) =>
                rpcConnection.postMessageRequestToTabViaBackground(
                    tabId,
                    property.toString(),
                    args,
                )
        },
    })
}

/**
 * @deprecated - Don't call this function directly. Instead use the typesafe versions `runInBackground` or `runInTab`
 */
export function remoteFunction(
    funcName: string,
    { tabId }: { tabId?: number } = {},
): any {
    // console.log(`depreciated: remoteFunction call for: ${funcName}`)
    if (tabId) {
        return (...args) =>
            rpcConnection.postMessageRequestToTab(tabId, funcName, args)
    } else {
        return (...args) =>
            rpcConnection.postMessageRequestToBackground(funcName, args)
    }
}

// === Executing side ===

const remotelyCallableFunctions =
    typeof globalThis !== 'undefined' ? globalThis['remoteFunctions'] || {} : {}
if (typeof globalThis !== 'undefined') {
    globalThis['remoteFunctions'] = remotelyCallableFunctions
}

export function setupRemoteFunctionsImplementations<T>(
    implementations: RemoteFunctionImplementations<'provider'>,
): void {
    for (const [group, functions] of Object.entries(implementations)) {
        makeRemotelyCallableType<typeof functions>(functions)
    }
}

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
export function makeRemotelyCallableType<T = never>(
    functions: { [P in keyof T]: T[P] },
    { insertExtraArg = false } = {},
) {
    return makeRemotelyCallable(functions, { insertExtraArg })
}
// @Depreciated to call this directly. Should use the above typesafe version
export function makeRemotelyCallable<T>(
    functions: { [P in keyof T]: T[P] },
    { insertExtraArg = false } = {},
) {
    // Every function is passed an extra argument with sender information,
    // so remove this from the call if this was not desired.
    if (!insertExtraArg) {
        // Replace each func with...
        // @ts-ignore
        const wrapFunctions = mapValues((func) =>
            // ...a function that calls func, but hides the inserted argument.
            // @ts-ignore
            (extraArg, ...args) => func(...args),
        )
        // @ts-ignore
        functions = wrapFunctions(functions)
    }

    for (const functionName of Object.keys(functions)) {
        if (remotelyCallableFunctions.hasOwnProperty(functionName)) {
            const error = `RPC function with name ${functionName} has already been registered `
            console.warn(error)
        }
    }
    // Add the functions to our global repetoir.
    Object.assign(remotelyCallableFunctions, functions)
}

export function clearRemotelyCallableFunctions() {
    for (const key of Object.keys(remotelyCallableFunctions)) {
        delete remotelyCallableFunctions[key]
    }
}

export class RemoteFunctionRegistry {
    registerRemotelyCallable(functions, { insertExtraArg = false } = {}) {
        makeRemotelyCallable(functions, { insertExtraArg })
    }
}

export function fakeRemoteFunctions(functions: {
    [name: string]: (...args) => any
}) {
    return (name) => {
        if (!functions[name]) {
            throw new Error(
                `Tried to call fake remote function '${name}' for which no implementation was provided`,
            )
        }
        return (...args) => {
            return Promise.resolve(functions[name](...args))
        }
    }
}

export interface RemoteEventEmitter<T extends keyof RemoteEvents> {
    emitToTab<EventName extends keyof RemoteEvents[T]>(
        eventName: EventName,
        tabId: number,
        ...args: Arguments<RemoteEvents[T][EventName]>
    ): Promise<void>
    emit<EventName extends keyof RemoteEvents[T]>(
        eventName: EventName,
        ...args: Arguments<RemoteEvents[T][EventName]>
    ): Promise<void>
}
const __REMOTE_EVENT__ = '__REMOTE_EVENT__'
const __REMOTE_EVENT_TYPE__ = '__REMOTE_EVENT_TYPE__'
const __REMOTE_EVENT_NAME__ = '__REMOTE_EVENT_NAME__'

// Sending Side, (e.g. background script)
export function remoteEventEmitter<ModuleName extends keyof RemoteEvents>(
    moduleName: ModuleName,
    { broadcastToTabs = false, silenceBroadcastFailures = false } = {},
): RemoteEventEmitter<ModuleName> {
    const message = {
        __REMOTE_EVENT__,
        __REMOTE_EVENT_TYPE__: moduleName,
    }

    const emit: RemoteEventEmitter<ModuleName>['emit'] = broadcastToTabs
        ? async (eventName, ...args) => {
              const tabs = (await browser.tabs.query({})) ?? []
              for (const { id: tabId } of tabs) {
                  try {
                      await browser.tabs.sendMessage(tabId, {
                          ...message,
                          __REMOTE_EVENT_NAME__: eventName,
                          data: args[0],
                      })
                  } catch (err) {
                      if (!silenceBroadcastFailures) {
                          console.error(
                              `Remote event emitter "${moduleName}" failed to emit event "${String(
                                  eventName,
                              )}" to tab ${tabId}:\n\tError message: "${
                                  err.message
                              }"`,
                          )
                      }
                  }
              }
          }
        : async (eventName, ...args) => {
              try {
                  await browser.runtime.sendMessage({
                      ...message,
                      __REMOTE_EVENT_NAME__: eventName,
                      data: args[0],
                  })
              } catch (err) {
                  console.error(
                      `Remote event emitter "${moduleName}" failed to emit event "${String(
                          eventName,
                      )}":\n\tError message: "${err.message}"`,
                  )
              }
          }

    return {
        emit,
        emitToTab: async (eventName, tabId, ...args) => {
            try {
                await browser.tabs.sendMessage(tabId, {
                    ...message,
                    __REMOTE_EVENT_NAME__: eventName,
                    data: args[0],
                })
            } catch (err) {
                console.error(
                    `Remote event emitter "${moduleName}" failed to emit event "${String(
                        eventName,
                    )}" to tab ${tabId}:\n\tError message: "${err.message}"`,
                )
            }
        },
    }
}

// Receiving Side (e.g. content script, options page, etc)
const remoteEventEmitters: RemoteEventEmitters = {} as RemoteEventEmitters
type RemoteEventEmitters = {
    [K in keyof RemoteEvents]?: TypedRemoteEventEmitter<K>
}
export type TypedRemoteEventEmitter<
    T extends keyof RemoteEvents
> = TypedEventEmitter<RemoteEvents[T]>

// Statically defined types for now, move this to a registry
export interface RemoteEvents {
    auth: AuthRemoteEvents
    contentSharing: ContentSharingEvents
    personalCloud: PersonalCloudBackgroundEvents
    pageSummary: PageSummaryBackgroundEvents
}

function registerRemoteEventForwarder() {
    if (browser.runtime.onMessage.hasListener(remoteEventForwarder)) {
        return
    }
    browser.runtime.onMessage.addListener(remoteEventForwarder)
}

const remoteEventForwarder = (message, _) => {
    if (message == null || message[__REMOTE_EVENT__] !== __REMOTE_EVENT__) {
        return
    }

    const emitterType = message[__REMOTE_EVENT_TYPE__]
    const emitter = remoteEventEmitters[emitterType]

    if (emitter == null) {
        return
    }

    emitter.emit(message[__REMOTE_EVENT_NAME__], message.data)
}

export function getRemoteEventEmitter<EventType extends keyof RemoteEvents>(
    eventType: EventType,
): RemoteEventEmitters[EventType] {
    const existingEmitter = remoteEventEmitters[eventType]
    if (existingEmitter) {
        return existingEmitter
    }

    const newEmitter = new EventEmitter() as any
    remoteEventEmitters[eventType] = newEmitter
    registerRemoteEventForwarder()
    return newEmitter
}

// Containing the evil globals here
let rpcConnection: RPCManager
export const setupRpcConnection = (options: {
    sideName: RpcSideName
    role: RpcRole
    paused?: boolean
}) => {
    rpcConnection = new EventBasedRPCManager({
        getRegisteredRemoteFunction: (name) => remotelyCallableFunctions[name],
        browserAPIs: browser,
        initPaused: options.paused,
        sideName: options.sideName,
        role: options.role,
        debug: true,
    })
    rpcConnection.setup()

    return rpcConnection
}
