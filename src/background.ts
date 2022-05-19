import 'core-js'
import { browser } from 'webextension-polyfill-ts'

import initStorex from './search/memex-storex'
import getDb, { setStorex } from './search/get-db'
import {
    setupRpcConnection,
    setupRemoteFunctionsImplementations,
} from 'src/util/webextensionRPC'
import { StorageChangesManager } from 'src/util/storage-changes'

// Features that require manual instantiation to setup
import createNotification from 'src/util/notifications'

// Features that auto-setup
import './analytics/background'
import './imports/background'
import './omnibar'
import analytics from './analytics'
import {
    createBackgroundModules,
    setupBackgroundModules,
    registerBackgroundModuleCollections,
} from './background-script/setup'
import { createFirebaseSignalTransport } from './sync/background/signalling'
import { FetchPageDataProcessor } from 'src/page-analysis/background/fetch-page-data-processor'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import pipeline from 'src/search/pipeline'
import { setStorageMiddleware } from './storage/middleware'
import { getFirebase } from './util/firebase-app-initialized'
import setupDataSeeders from 'src/util/tests/seed-data'
import {
    createLazyServerStorage,
    createServerStorageManager,
} from './storage/server'
import { createServices } from './services'
import initSentry, { captureException } from 'src/util/raven'
import { createSelfTests } from './tests/self-tests'
import { createPersistentStorageManager } from './storage/persistent-storage'

let __debugCounter = 0

export async function main() {
    const rpcManager = setupRpcConnection({
        sideName: 'background',
        role: 'background',
        paused: true,
    })

    const localStorageChangesManager = new StorageChangesManager({
        storage: browser.storage,
    })
    initSentry({ storageChangesManager: localStorageChangesManager })

    if (process.env.USE_FIREBASE_EMULATOR === 'true') {
        const firebase = getFirebase()
        firebase.firestore().settings({
            host: 'localhost:8080',
            ssl: false,
        })
        firebase.database().useEmulator('localhost', 9000)
        firebase.firestore().useEmulator('localhost', 8080)
        firebase.auth().useEmulator('http://localhost:9099/')
        firebase.functions().useFunctionsEmulator('http://localhost:5001')
        firebase.storage().useEmulator('localhost', 9199)
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
    const persistentStorageManager = createPersistentStorageManager()
    const services = await createServices({
        backend: process.env.NODE_ENV === 'test' ? 'memory' : 'firebase',
        getServerStorage,
    })
    __debugCounter++

    const backgroundModules = createBackgroundModules({
        services,
        getServerStorage,
        signalTransportFactory: createFirebaseSignalTransport,
        analyticsManager: analytics,
        localStorageChangesManager,
        fetchPageDataProcessor,
        browserAPIs: browser,
        captureException,
        storageManager,
        persistentStorageManager,
        getIceServers: async () => {
            const firebase = await getFirebase()
            const generateToken = firebase
                .functions()
                .httpsCallable('generateTwilioNTSToken')
            const response = await generateToken({})
            return response.data.iceServers
        },
        callFirebaseFunction: async <Returns>(name: string, ...args: any[]) => {
            const firebase = getFirebase()
            const callable = firebase.functions().httpsCallable(name)
            const result = await callable(...args)
            return result.data as Promise<Returns>
        },
    })
    __debugCounter++
    registerBackgroundModuleCollections({
        storageManager,
        persistentStorageManager,
        backgroundModules,
    })

    await storageManager.finishInitialization()
    __debugCounter++
    await persistentStorageManager.finishInitialization()
    __debugCounter++

    const { setStorageLoggingEnabled } = await setStorageMiddleware(
        storageManager,
        {
            storexHub: backgroundModules.storexHub,
            contentSharing: backgroundModules.contentSharing,
            personalCloud: backgroundModules.personalCloud,
        },
    )
    __debugCounter++
    await setupBackgroundModules(backgroundModules, storageManager)
    __debugCounter++

    navigator?.storage
        ?.persist?.()
        .catch((err) =>
            captureException(
                new Error(
                    `Error occurred on navigator.storage.persist() call: ${err.message}`,
                ),
            ),
        )
    __debugCounter++

    setStorex(storageManager)

    // Gradually moving all remote function registrations here
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
        sync: backgroundModules.sync.remoteFunctions,
        features: backgroundModules.features,
        featuresBeta: backgroundModules.featuresBeta,
        tags: backgroundModules.tags.remoteFunctions,
        collections: backgroundModules.customLists.remoteFunctions,
        readablePageArchives: backgroundModules.readable.remoteFunctions,
        copyPaster: backgroundModules.copyPaster.remoteFunctions,
        contentSharing: backgroundModules.contentSharing.remoteFunctions,
        personalCloud: backgroundModules.personalCloud.remoteFunctions,
        pdf: backgroundModules.pdfBg.remoteFunctions,
    })
    __debugCounter++

    // Attach interesting features onto global window scope for interested users
    window['getDb'] = getDb
    window['storageMan'] = storageManager
    window['bgModules'] = backgroundModules
    window['analytics'] = analytics
    window['dataSeeders'] = setupDataSeeders(storageManager)
    window['setStorageLoggingEnabled'] = setStorageLoggingEnabled

    window['selfTests'] = createSelfTests({
        backgroundModules,
        storageManager,
        persistentStorageManager,
        getServerStorage,
        localStorage: browser.storage.local,
    })

    rpcManager.unpause()
    __debugCounter++
}

main().catch((err) =>
    captureException(
        new Error(
            `Error occurred during background script setup: ${err.message} - debug counter: ${__debugCounter}`,
        ),
    ),
)
