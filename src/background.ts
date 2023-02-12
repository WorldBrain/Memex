import 'core-js'
import browser from 'webextension-polyfill'

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
// import './omnibar'
import analytics from './analytics'
import {
    createBackgroundModules,
    setupBackgroundModules,
    registerBackgroundModuleCollections,
} from './background-script/setup'
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
import { createAuthServices } from './services/local-services'
import {
    SharedListKey,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { initFirestoreSyncTriggerListener } from '@worldbrain/memex-common/lib/personal-cloud/backend/utils'

let __debugCounter = 0

export async function main() {
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
        firebase.firestore().settings({
            host: 'localhost:8080',
            ssl: false,
        })
        firebase.database().useEmulator('localhost', 9000)
        firebase.firestore().useEmulator('localhost', 8080)
        firebase.auth().useEmulator('http://localhost:9099/')
        firebase.functions().useEmulator('localhost', 5001)
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
    const persistentStorageManager = createPersistentStorageManager({
        idbImplementation: {
            factory: self.indexedDB,
            range: self.IDBKeyRange,
        },
    })
    const authServices = createAuthServices({
        backend: process.env.NODE_ENV === 'test' ? 'memory' : 'firebase',
        getServerStorage,
    })
    const servicesPromise = createServices({
        backend: process.env.NODE_ENV === 'test' ? 'memory' : 'firebase',
        getServerStorage,
        authService: authServices.auth,
    })
    __debugCounter++

    const backgroundModules = createBackgroundModules({
        manifestVersion: '2',
        authServices,
        servicesPromise,
        getServerStorage,
        analyticsManager: analytics,
        localStorageChangesManager,
        fetchPageDataProcessor,
        browserAPIs: browser,
        captureException,
        storageManager,
        persistentStorageManager,
        callFirebaseFunction: async <Returns>(name: string, ...args: any[]) => {
            const callable = firebase.functions().httpsCallable(name)
            const result = await callable(...args)
            return result.data as Promise<Returns>
        },
        setupSyncTriggerListener: initFirestoreSyncTriggerListener(firebase),
    })

    __debugCounter++
    registerBackgroundModuleCollections({
        storageManager,
        persistentStorageManager,
        backgroundModules,
    })

    await storageManager.finishInitialization()
    await persistentStorageManager.finishInitialization()
    __debugCounter++
    __debugCounter++

    const { setStorageLoggingEnabled } = setStorageMiddleware(storageManager, {
        storexHub: backgroundModules.storexHub,
        contentSharing: backgroundModules.contentSharing,
        personalCloud: backgroundModules.personalCloud,
    })
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
        // features: backgroundModules.features,
        featuresBeta: backgroundModules.featuresBeta,
        tags: backgroundModules.tags.remoteFunctions,
        collections: backgroundModules.customLists.remoteFunctions,
        pageActivityIndicator:
            backgroundModules.pageActivityIndicator.remoteFunctions,
        readablePageArchives: backgroundModules.readable.remoteFunctions,
        copyPaster: backgroundModules.copyPaster.remoteFunctions,
        contentSharing: backgroundModules.contentSharing.remoteFunctions,
        personalCloud: backgroundModules.personalCloud.remoteFunctions,
        pdf: backgroundModules.pdfBg.remoteFunctions,
    })
    __debugCounter++

    const services = await servicesPromise
    services.contentSharing.preKeyGeneration = async (params: {
        key: Pick<SharedListKey, 'roleID' | 'disabled'>
    }) => {
        if (params.key.roleID > SharedListRoleID.Commenter) {
            await backgroundModules.personalCloud.waitForSync()
        }
    }

    __debugCounter++

    // Attach interesting features onto global globalThis scope for interested users
    globalThis['getDb'] = getDb
    globalThis['storageMan'] = storageManager
    globalThis['bgModules'] = backgroundModules
    globalThis['analytics'] = analytics
    globalThis['dataSeeders'] = setupDataSeeders(storageManager)
    globalThis['setStorageLoggingEnabled'] = setStorageLoggingEnabled

    globalThis['selfTests'] = createSelfTests({
        backgroundModules,
        storageManager,
        persistentStorageManager,
        getServerStorage,
        localStorage: browser.storage.local,
    })

    rpcManager.unpause()
    __debugCounter++
}

main().catch((originalError) => {
    const error = new Error(
        `Error occurred during background script setup: ${originalError.message} - debug counter: ${__debugCounter}`,
    )
    if (originalError.stack) {
        error.stack = originalError.stack
    }
    captureException(error)
    throw originalError
})
