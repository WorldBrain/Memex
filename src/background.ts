import browser from 'webextension-polyfill'

import { transformPageHTML } from '@worldbrain/memex-stemmer/lib/transform-page-html.service-worker'
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
import { setStorageMiddleware } from './storage/middleware'
import { getFirebase } from './util/firebase-app-initialized'
import setupDataSeeders from 'src/util/tests/seed-data'
import {
    createServerStorage,
    createServerStorageManager,
} from './storage/server'
import { createServices } from './services'
import initSentry, { captureException } from 'src/util/raven'
import { createSelfTests } from './tests/self-tests'
import { createPersistentStorageManager } from './storage/persistent-storage'
import { createAuthServices } from './services/local-services'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import { initFirestoreSyncTriggerListener } from '@worldbrain/memex-common/lib/personal-cloud/backend/utils-mv2'
import { setupOmnibar } from 'src/omnibar'
import delay from './util/delay'
import { fetchPageData } from '@worldbrain/memex-common/lib/page-indexing/fetch-page-data'
import fetchAndExtractPdfContent from '@worldbrain/memex-common/lib/page-indexing/fetch-page-data/fetch-pdf-data.browser'
import { CloudflareImageSupportBackend } from '@worldbrain/memex-common/lib/image-support/backend'

let __debugCounter = 0
let __BGInitAttemptCounter = 0
const __maxBGInitRetryAttempts = 20

export async function main(): Promise<void> {
    __debugCounter = 0

    const rpcManager = setupRpcConnection({
        browserAPIs: browser,
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

    const serverStorageManager = createServerStorageManager()
    const serverStorage = await createServerStorage(serverStorageManager, {
        autoPkType: 'string',
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
    })
    const services = createServices({
        backend: process.env.NODE_ENV === 'test' ? 'memory' : 'firebase',
        serverStorage,
        authService: authServices.auth,
    })
    __debugCounter++

    const fetch = globalThis.fetch.bind(
        globalThis,
    ) as typeof globalThis['fetch']

    const backgroundModules = createBackgroundModules({
        manifestVersion: '2',
        authServices,
        services,
        serverStorage,
        analyticsManager: analytics,
        localStorageChangesManager,
        fetchPageData: async (url) =>
            fetchPageData({
                url,
                fetch,
                transformPageHTML,
                domParser: (html) =>
                    new DOMParser().parseFromString(html, 'text/html'),
                opts: { includePageContent: true, includeFavIcon: true },
            }).run(),
        fetchPDFData: async (url) =>
            fetchAndExtractPdfContent(url, {
                fetch,
                pdfJSWorkerSrc: browser.runtime.getURL('/build/pdf.worker.js'),
            }),
        fetch,
        browserAPIs: browser,
        captureException,
        storageManager,
        persistentStorageManager,
        callFirebaseFunction: async <Returns>(name: string, ...args: any[]) => {
            const callable = firebase.functions().httpsCallable(name)
            try {
                const result = await callable(...args)
                return result.data as Promise<Returns>
            } catch (err) {
                captureException(err, {
                    extra: {
                        name,
                        ...args,
                    },
                })
                throw err
            }
        },
        setupSyncTriggerListener: initFirestoreSyncTriggerListener(firebase),
        imageSupportBackend: new CloudflareImageSupportBackend({
            env:
                process.env.NODE_ENV === 'production'
                    ? 'production'
                    : 'staging',
        }),
        backendEnv:
            process.env.NODE_ENV === 'production' ? 'production' : 'staging',
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

    const { setStorageLoggingEnabled } = setStorageMiddleware(
        storageManager,
        backgroundModules,
    )
    __debugCounter++
    await setupBackgroundModules(backgroundModules, storageManager, browser)
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

    setupOmnibar({
        bgModules: backgroundModules,
        browserAPIs: browser,
    })

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
        analyticsBG: backgroundModules.analyticsBG,
    })
    __debugCounter++

    services.contentSharing.preKeyGeneration = async (params) => {
        if (params.key.roleID > SharedListRoleID.Commenter) {
            await backgroundModules.personalCloud.waitForSync()
        }
    }

    __debugCounter++

    // Attach interesting features onto global globalThis scope for interested users
    globalThis['getDb'] = getDb
    globalThis['storageMan'] = storageManager
    globalThis['bgModules'] = backgroundModules
    globalThis['serverStorage'] = serverStorage
    globalThis['services'] = services
    globalThis['analytics'] = analytics
    globalThis['dataSeeders'] = setupDataSeeders(storageManager)
    globalThis['setStorageLoggingEnabled'] = setStorageLoggingEnabled

    if (process.env.NODE_ENV === 'development') {
        globalThis['selfTests'] = createSelfTests({
            serverStorage,
            storageManager,
            backgroundModules,
            persistentStorageManager,
            localStorage: browser.storage.local,
        })
    }

    rpcManager.unpause()
    __debugCounter++
}

const handleError = async (originalError: Error) => {
    const noMoreAttempts = __BGInitAttemptCounter++ >= __maxBGInitRetryAttempts

    const error = new Error(
        noMoreAttempts
            ? `BG INIT LOGIC RETRIES EXHAUSTED: `
            : `` +
              `Error occurred during background script setup: ${originalError.message} - debug counter: ${__debugCounter}`,
    )
    if (originalError.stack) {
        error.stack = originalError.stack
    }
    console.error('BG init logic encountered an error:', error)
    captureException(error)

    if (noMoreAttempts) {
        throw originalError
    }

    await delay(10000)
    await main().catch(handleError)
}

main().catch(handleError)
