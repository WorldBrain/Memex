import browser, { Runtime } from 'webextension-polyfill'
import { initializeApp } from 'firebase-new/app'
import { getAuth, onAuthStateChanged } from 'firebase-new/auth'
import { getFirestore, doc, onSnapshot } from 'firebase-new/firestore'
import { getToken } from 'firebase-new/messaging'
import { onBackgroundMessage, getMessaging } from 'firebase-new/messaging/sw'
import {
    setupRpcConnection,
    makeRemotelyCallable,
    remoteFunction,
} from './util/webextensionRPC'
// import { getFirebase } from './util/firebase-app-initialized'
declare var self: ServiceWorkerGlobalScope

const firebaseConfig = {
    apiKey: process.env.FIREBASE_MEMEX_API_KEY,
    authDomain: process.env.FIREBASE_MEMEX_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_MEMEX_DATABSE_URL,
    projectId: process.env.FIREBASE_MEMEX_PROJECT_ID,
    messagingSenderId: process.env.FIREBASE_MEMEX_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_MEMEX_APP_ID,
    measurementId: process.env.FIREBASE_MEMEX_MEASUREMENT_ID,
    storageBucket: process.env.FIREBASE_MEMEX_STORAGE_BUCKET,
}

// we have to register all event listeners (including RPC handlers)
// in the first tick, meaning before awaiting any async functions
function main() {
    console.log('starting background worker')
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const firestore = getFirestore(app)
    const messaging = getMessaging(app)

    browser.runtime.onInstalled.addListener(async (details) => {
        console.log('ext install event fired:', details)

        const val = await getToken(messaging, {
            serviceWorkerRegistration: self.registration,
            vapidKey: '',
        })
        console.log('got token:', val)
    })

    self.addEventListener('install', async (event) => {
        console.log('install SW event fired:', event)
    })

    self.addEventListener('activate', (event) => {
        console.log('activation SW event fired:', event)
    })

    self.addEventListener('push', (event) => {
        console.log('push SW event fired:', event)
    })

    onBackgroundMessage(messaging, (payload) => {
        console.log(
            '[firebase-messaging-test] Received background message ',
            payload,
        )
    })

    let port: Runtime.Port
    browser.runtime.onConnect.addListener((newPort) => {
        port = newPort
        console.log('get port for tab', port.sender?.id)
        port.postMessage('initial message')
    })

    let unregister = () => {}
    onAuthStateChanged(auth, () => {
        console.log('auth changed!', auth.currentUser?.uid)
        if (!auth.currentUser?.uid) {
            unregister()
            unregister = () => {}
            return
        }
        unregister = onSnapshot(
            doc(firestore, 'homeFeedInfo', auth.currentUser.uid),
            (snapshot) => {
                console.log('got home feed info change', snapshot.data())
                if (port) {
                    console.log('port open, posting message')
                    port.postMessage('feed info changed!')
                } else {
                    console.log(
                        `but there's no port yet, so not sending message`,
                    )
                }
            },
        )
    })
    setupRpcConnection({ sideName: 'background', role: 'background' })
    makeRemotelyCallable(
        {
            confirmBackgroundScriptLoaded: async () => {},
            testCallable: async ({ tab }) => {
                console.log('loaded', tab)
                if (!tab?.id) {
                    return
                }
                await browser.storage.local.set({ testLoadedTab: tab.id })
                console.log(auth.currentUser)
                // ;(globalThis as any)['firebase'] = firebase
            },
        },
        { insertExtraArg: true },
    )

    // browser.alarms.create('test', { periodInMinutes: 5 })
    // browser.alarms.onAlarm.addListener(async (alarm) => {
    //     console.log('on alarm')
    //     if (alarm.name !== 'test') {
    //         return
    //     }

    //     if (port) {
    //         console.log('sending alarm message to port')
    //         port.postMessage("still alive!")
    //     } else {
    //         console.log('alarm ran, but no open port found')
    //     }

    // const { testLoadedTab } = await browser.storage.local.get('testLoadedTab')
    // console.log('found tab ID', testLoadedTab)
    // if (!testLoadedTab) {
    //     return
    // }

    // console.log('calling test tab call')
    // remoteFunction('testTabCallable', testLoadedTab)(1, 2, 'hello')
    // })
}

async function setup() {}

main()
