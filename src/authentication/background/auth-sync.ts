import {
    unpackMessage,
    validMessage,
    packMessage,
    ExtMessage,
    validGeneratedLoginToken,
    logUnpackedMessage,
    logPackedMessage,
} from '@worldbrain/memex-common/lib/authentication/auth-sync'
import type { AuthService } from '@worldbrain/memex-common/lib/authentication/types'
import type { Runtime } from 'webextension-polyfill'
import chrome from 'webextension-polyfill'

function validSender(sender: any, expectedOrigins: string[]) {
    if (!(typeof sender === 'object' && typeof sender.origin === 'string')) {
        return false
    }
    return expectedOrigins.includes(sender.origin)
}

function getMessage(
    message: any,
    sender: any,
    expectedOrigins: string[],
): null | ReturnType<typeof unpackMessage> {
    if (!validSender(sender, expectedOrigins) || !validMessage(message)) {
        return null
    }

    return unpackMessage(message)
}

const enableMessageLogging = false

function addListener(
    listener: (
        sendResponse: (obj: ReturnType<typeof packMessage>) => void,
        messageObj: ReturnType<typeof unpackMessage>,
    ) => void,
    expectedOrigins: string[],
    runtimeAPI: Runtime.Static,
) {
    runtimeAPI.onMessageExternal.addListener(
        //@ts-ignore next-line
        (message, sender, runtimeSendResponse) => {
            const messageObj = getMessage(message, sender, expectedOrigins)
            if (!messageObj) {
                return
            }
            logUnpackedMessage(messageObj, 'Recieved', enableMessageLogging)
            const sendResponse = (msg) => {
                logPackedMessage(msg, 'Sending', enableMessageLogging)
                runtimeSendResponse(msg)
            }
            return listener(sendResponse, messageObj)
        },
    )
}

async function sendTokenToAppHandler(
    authService: AuthService,
    sendResponse: (obj: ReturnType<typeof packMessage>) => void,
    messageObj: ReturnType<typeof unpackMessage>,
) {
    if (messageObj.message !== ExtMessage.TOKEN_REQUEST) {
        sendResponse(packMessage(ExtMessage.LOGGED_IN))
        return
    }
    await authService.generateLoginToken().then((tokenObj) => {
        const loginToken = tokenObj.token
        if (!validGeneratedLoginToken(loginToken)) {
            return
        }
        sendResponse(packMessage(ExtMessage.TOKEN, loginToken))
    })
}

async function loginWithAppTokenHandler(
    authService: AuthService,
    sendResponse: (obj: ReturnType<typeof packMessage>) => void,
    messageObj: ReturnType<typeof unpackMessage>,
) {
    if (messageObj.message === ExtMessage.TOKEN) {
        if (messageObj.payload) {
            await authService.loginWithToken(messageObj.payload)
        }
    } else {
        sendResponse(packMessage(ExtMessage.TOKEN_REQUEST))
    }
}

export async function listenToWebAppMessage(
    authService: AuthService,
    runtimeAPI: Runtime.Static,
) {
    const expectedOrigins =
        process.env.NODE_ENV === 'production'
            ? ['https://memex.social']
            : ['http://localhost:3000', 'https://staging.memex.social']

    await authService.waitForAuthReady()

    let reactingToMessage = false
    addListener(
        (sendResponse, messageObj) => {
            // JS is mostly event-loop concurrent: https://stackoverflow.com/a/5347062
            // So we have a simple lock here to prevent multiple tabs of the app contacting the extension, this works so-so
            // This will not prevent multiple instances of the service worker to react
            if (reactingToMessage) {
                return false
            }
            reactingToMessage = true

            if (messageObj.message === ExtMessage.EXT_IS_READY) {
                sendResponse(packMessage(ExtMessage.EXT_IS_READY_RESPONSE))
                reactingToMessage = false
                return true
            }
            if (messageObj.message === ExtMessage.URL_TO_OPEN) {
                storeURLtoOpenAfterLogin(messageObj.payload)
                sendResponse(packMessage(ExtMessage.URL_TO_OPEN))
                reactingToMessage = false
                return true
            }

            // Can not use a promise here, otherwise the listener will never resolve
            authService
                .getCurrentUser()
                .then((val) => {
                    const isLoggedIn = !!val
                    if (isLoggedIn) {
                        return sendTokenToAppHandler(
                            authService,
                            sendResponse,
                            messageObj,
                        )
                    } else {
                        return loginWithAppTokenHandler(
                            authService,
                            sendResponse,
                            messageObj,
                        )
                    }
                })
                .then(() => (reactingToMessage = false))

            // Indicates that we want to send an async response
            return true
        },
        expectedOrigins,
        runtimeAPI,
    )
}

async function storeURLtoOpenAfterLogin(message) {
    await chrome.storage.local.set({ '@URL_TO_OPEN': JSON.parse(message) })
}
