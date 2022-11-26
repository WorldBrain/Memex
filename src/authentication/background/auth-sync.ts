function validMessage(messageObj: any) {
    return (
        typeof messageObj === 'object' &&
        typeof messageObj.message === 'string' &&
        (!messageObj.payload || typeof messageObj.payload === 'string')
    )
}

enum ExtMessage {
    LOGGED_IN = 'LOGGED_IN',
    TOKEN_REQUEST = 'TOKEN_REQUEST',
    TOKEN = 'TOKEN',
}

function unpackMessage(messageObj: any) {
    return {
        message: atob(messageObj.message) as ExtMessage,
        payload: messageObj.payload ? atob(messageObj.payload) : null,
    }
}

function packMessage(message: ExtMessage, payload?: string) {
    return {
        message: btoa(message),
        payload: payload ? btoa(payload) : null,
    }
}

function validGeneratedLoginToken(loginToken: any) {
    return loginToken && typeof loginToken === 'string'
}

interface SyncProps {
    awaitAuth: () => Promise<void>
    isLoggedIn: () => Promise<boolean>
    generateLoginToken: () => Promise<string>
    loginWithToken: (token: string) => Promise<void>
}

function validSender(sender: any) {
    if (!(typeof sender === 'object' && typeof sender.origin === 'string')) {
        return false
    }

    return sender.origin === 'http://localhost:3000'
}

function getMessage(
    message: any,
    sender: any,
): null | ReturnType<typeof unpackMessage> {
    if (!validSender(sender) || !validMessage(message)) {
        return null
    }

    return unpackMessage(message)
}

function addListener(
    listener: (
        sendResponse: (obj: ReturnType<typeof packMessage>) => void,
        messageObj: ReturnType<typeof unpackMessage>,
    ) => void,
) {
    //@ts-ignore next-line
    chrome.runtime.onMessageExternal.addListener(
        (message, sender, sendResponse) => {
            const messageObj = getMessage(message, sender)
            if (!messageObj) {
                return
            }
            console.log(JSON.stringify(messageObj, null, 2))
            listener(sendResponse, messageObj)
        },
    )
}

function sendTokenToAppPath(generateLoginToken: () => Promise<string>) {
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
    })
}

function loginWithAppTokenPath(
    loginWithToken: (token: string) => Promise<void>,
) {
    addListener((sendResponse, messageObj) => {
        console.log(JSON.stringify(messageObj, null, 2))
        if (messageObj.message === ExtMessage.TOKEN) {
            if (messageObj.payload) {
                loginWithToken(messageObj.payload)
            }
        } else {
            sendResponse(packMessage(ExtMessage.TOKEN_REQUEST))
        }
    })
}

export async function listenToWebAppMessage({
    awaitAuth,
    isLoggedIn,
    generateLoginToken,
    loginWithToken,
}: SyncProps) {
    await awaitAuth()
    console.log(await isLoggedIn())
    if (await isLoggedIn()) {
        sendTokenToAppPath(generateLoginToken)
    } else {
        loginWithAppTokenPath(loginWithToken)
    }
}
