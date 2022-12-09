import {
    unpackMessage,
    validMessage,
    packMessage,
    ExtMessage,
    validGeneratedLoginToken,
} from '@worldbrain/memex-common/lib/authentication/auth-sync'
import { AuthService } from '@worldbrain/memex-common/lib/authentication/types'

function validSender(sender: any, expectedOrigin: string) {
    if (!(typeof sender === 'object' && typeof sender.origin === 'string')) {
        return false
    }
    return sender.origin === expectedOrigin
}

function getMessage(
    message: any,
    sender: any,
    expectedOrigin: string,
): null | ReturnType<typeof unpackMessage> {
    if (!validSender(sender, expectedOrigin) || !validMessage(message)) {
        return null
    }

    return unpackMessage(message)
}

function addListener(
    listener: (
        sendResponse: (obj: ReturnType<typeof packMessage>) => void,
        messageObj: ReturnType<typeof unpackMessage>,
    ) => void,
    expectedOrigin: string,
) {
    //@ts-ignore next-line
    chrome.runtime.onMessageExternal.addListener(
        (message, sender, runtimeSendResponse) => {
            const messageObj = getMessage(message, sender, expectedOrigin)
            if (!messageObj) {
                return
            }
            // console.log('Recieved: ' + JSON.stringify(messageObj, null, 2))
            // const sendResponse = (msg) => {
            //     console.log(
            //         'Sending: ' + JSON.stringify(unpackMessage(msg), null, 2),
            //     )
            //     runtimeSendResponse(msg)
            // }
            listener(runtimeSendResponse, messageObj)
        },
    )
}

async function sendTokenToAppHandler(
    authService: AuthService,
    sendResponse: (obj: ReturnType<typeof packMessage>) => void,
    messageObj: ReturnType<typeof unpackMessage>,
) {
    if (messageObj.message !== ExtMessage.TOKEN_REQUEST) {
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

export async function listenToWebAppMessage(authService: AuthService) {
    const expectedOrigin =
        process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : 'https://memex.social'

    await authService.waitForAuthReady()

    let reactingToMessage = false
    addListener((sendResponse, messageObj) => {
        //JS is mostly event-loop concurrent: https://stackoverflow.com/a/5347062
        //so we have a simple lock here to prevent multiple tabs of the app contacting the extension
        //this will not prevent multiple instances of the service worker to react
        if (reactingToMessage) {
            return
        }
        reactingToMessage = true

        //can not use a promise here, otherwise the listener will never resolve
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

        //indicates that we want to send an async response
        return true
    }, expectedOrigin)
}
