import browser from 'webextension-polyfill'
import XMLHttpRequest from 'sw-xhr'
import {
    setupRpcConnection,
    setupRemoteFunctionsImplementations,
} from './util/webextensionRPC'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { StorageChangesManager } from './util/storage-changes'
import initSentry, { captureException } from './util/raven'
import {
    createLazyServerStorage,
    createServerStorageManager,
} from './storage/server'
import createNotification from 'src/util/notifications'
import { FetchPageDataProcessor } from './page-analysis/background/fetch-page-data-processor'
import pipeline from './search/pipeline'
import initStorex from './search/memex-storex'
import { createPersistentStorageManager } from './storage/persistent-storage'
import { getFirebase } from './util/firebase-app-initialized'
import { createServices } from './services'
import {
    createBackgroundModules,
    registerBackgroundModuleCollections,
    setupBackgroundModules,
} from './background-script/setup'
import analytics from './analytics'
import { setStorageMiddleware } from './storage/middleware'
import { setStorex } from './search/get-db'
import { createAuthServices } from './services/local-services'
import type { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

// declare var self: ServiceWorkerGlobalScope

// TODO mv3: remove this once firebase/storage is updated to use fetch API
global['XMLHttpRequest'] = XMLHttpRequest

async function main() {
    console.log('starting background worker')
    const rpcManager = setupRpcConnection({
        sideName: 'background',
        role: 'background',
        paused: true,
    })

    const firebase = getFirebase()

    const localStorageChangesManager = new StorageChangesManager({
        storage: browser.storage,
    })
    initSentry({})

    if (process.env.USE_FIREBASE_EMULATOR === 'true') {
        // TODO mv3: FB emulator setup
    }

    const getServerStorage = createLazyServerStorage(
        createServerStorageManager,
        {
            autoPkType: 'string',
        },
    )
    const fetchPageDataProcessor = new FetchPageDataProcessor({
        fetchPageData,
        pagePipeline: pipeline,
    })

    const storageManager = initStorex()
    const persistentStorageManager = createPersistentStorageManager({
        idbImplementation: {
            factory: self.indexedDB,
            range: self.IDBKeyRange,
        },
    })
    const authServices = createAuthServices({
        backend: process.env.NODE_ENV === 'test' ? 'memory' : 'firebase',
        getServerStorage,
        manifestVersion: '3',
    })
    const servicesPromise = createServices({
        backend: process.env.NODE_ENV === 'test' ? 'memory' : 'firebase',
        getServerStorage,
        authService: authServices.auth,
    })

    const backgroundModules = createBackgroundModules({
        servicesPromise,
        getServerStorage,
        analyticsManager: analytics,
        localStorageChangesManager,
        fetchPageDataProcessor,
        browserAPIs: browser,
        captureException,
        authServices,
        storageManager,
        persistentStorageManager,
        callFirebaseFunction: async <Returns>(name: string, ...args: any[]) => {
            const callable = firebase.functions().httpsCallable(name)
            const result = await callable(...args)
            return result.data as Promise<Returns>
        },
    })
    registerBackgroundModuleCollections({
        storageManager,
        persistentStorageManager,
        backgroundModules,
    })

    const { setStorageLoggingEnabled } = setStorageMiddleware(storageManager, {
        storexHub: backgroundModules.storexHub,
        contentSharing: backgroundModules.contentSharing,
        personalCloud: backgroundModules.personalCloud,
    })

    // NOTE: This is a hack to manually init Dexie, which is synchronous, before needing to do the async storex init calls.
    //  Doing this as all event listeners need to be set up synchronously, before any async logic happens. AND to avoid needing to update storex yet.
    ;(storageManager.backend as DexieStorageBackend)._onRegistryInitialized()

    await setupBackgroundModules(backgroundModules, storageManager)

    await storageManager.finishInitialization()
    await persistentStorageManager.finishInitialization()

    setStorex(storageManager)

    setupRemoteFunctionsImplementations({
        auth: backgroundModules.auth.remoteFunctions,
        analytics: backgroundModules.analytics.remoteFunctions,
        subscription: {
            getCheckoutLink:
                backgroundModules.auth.subscriptionService.getCheckoutLink,
            getManageLink:
                backgroundModules.auth.subscriptionService.getManageLink,
            getCurrentUserClaims:
                backgroundModules.auth.subscriptionService.getCurrentUserClaims,
        },
        notifications: { create: createNotification } as any,
        bookmarks: backgroundModules.bookmarks.remoteFunctions,
        featuresBeta: backgroundModules.featuresBeta,
        tags: backgroundModules.tags.remoteFunctions,
        collections: backgroundModules.customLists.remoteFunctions,
        readablePageArchives: backgroundModules.readable.remoteFunctions,
        copyPaster: backgroundModules.copyPaster.remoteFunctions,
        contentSharing: backgroundModules.contentSharing.remoteFunctions,
        personalCloud: backgroundModules.personalCloud.remoteFunctions,
        pdf: backgroundModules.pdfBg.remoteFunctions,
    })
    rpcManager.unpause()

    const services = await servicesPromise
    global['bgModules'] = backgroundModules
    global['bgServices'] = services
    global['storageManager'] = storageManager
    global['persistentStorageManager'] = persistentStorageManager

    // browser.runtime.onInstalled.addListener(async (details) => {
    //     console.log('ext install event fired:', details)

    //     const val = await getToken(messaging, {
    //         serviceWorkerRegistration: self.registration,
    //         vapidKey: '',
    //     })
    //     console.log('got token:', val)
    // })

    // self.addEventListener('install', async (event) => {
    //     console.log('install SW event fired:', event)
    // })

    // self.addEventListener('activate', (event) => {
    //     console.log('activation SW event fired:', event)
    // })

    // self.addEventListener('push', (event) => {
    //     console.log('push SW event fired:', event)
    // })

    // onBackgroundMessage(messaging, (payload) => {
    //     console.log(
    //         '[firebase-messaging-test] Received background message ',
    //         payload,
    //     )
    // })

    // let port: Runtime.Port
    // browser.runtime.onConnect.addListener((newPort) => {
    //     port = newPort
    //     console.log('get port for tab', port.sender?.id)
    //     port.postMessage('initial message')
    // })

    // let unregister = () => {}
    // onAuthStateChanged(auth, () => {
    //     console.log('auth changed!', auth.currentUser?.uid)
    //     if (!auth.currentUser?.uid) {
    //         unregister()
    //         unregister = () => {}
    //         return
    //     }
    //     unregister = onSnapshot(
    //         doc(firestore, 'homeFeedInfo', auth.currentUser.uid),
    //         (snapshot) => {
    //             console.log('got home feed info change', snapshot.data())
    //             if (port) {
    //                 console.log('port open, posting message')
    //                 port.postMessage('feed info changed!')
    //             } else {
    //                 console.log(
    //                     `but there's no port yet, so not sending message`,
    //                 )
    //             }
    //         },
    //     )
    // })
    // setupRpcConnection({ sideName: 'background', role: 'background' })

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

main().catch((err) => {
    captureException(err)
    throw err
})
