import {
    unpackMessage,
    validMessage,
    packMessage,
    ExtMessage,
    validGeneratedLoginToken,
    SyncProps,
} from '@worldbrain/memex-common/lib/authentication/auth-sync'

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
        (message, sender, sendResponse) => {
            const messageObj = getMessage(message, sender, expectedOrigin)
            if (!messageObj) {
                return
            }
            // console.log(JSON.stringify(messageObj, null, 2))
            listener(sendResponse, messageObj)
        },
    )
}

function sendTokenToAppPath(
    generateLoginToken: () => Promise<string>,
    expectedOrigin: string,
) {
    addListener((sendResponse, messageObj) => {
        if (messageObj.message !== ExtMessage.TOKEN_REQUEST) {
            return
        }
        generateLoginToken().then((loginToken) => {
            if (!validGeneratedLoginToken(loginToken)) {
                return
            }
            sendResponse(packMessage(ExtMessage.TOKEN, loginToken))
        })
    }, expectedOrigin)
}

function loginWithAppTokenPath(
    loginWithToken: (token: string) => Promise<void>,
    expectedOrigin: string,
) {
    addListener((sendResponse, messageObj) => {
        // console.log(JSON.stringify(messageObj, null, 2))
        if (messageObj.message === ExtMessage.TOKEN) {
            if (messageObj.payload) {
                loginWithToken(messageObj.payload)
            }
        } else {
            sendResponse(packMessage(ExtMessage.TOKEN_REQUEST))
        }
    }, expectedOrigin)
}

export async function listenToWebAppMessage({
    awaitAuth,
    isLoggedIn,
    generateLoginToken,
    loginWithToken,
}: SyncProps) {
    const expectedOrigin = 'http://localhost:3000'

    await awaitAuth()
    if (await isLoggedIn()) {
        sendTokenToAppPath(generateLoginToken, expectedOrigin)
    } else {
        loginWithAppTokenPath(loginWithToken, expectedOrigin)
    }
}
