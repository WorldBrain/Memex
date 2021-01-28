import 'core-js'
import { browser } from 'webextension-polyfill-ts'
import { createSelfTests } from '@worldbrain/memex-common/lib/self-tests'

import initStorex from './search/memex-storex'
import getDb, { setStorex } from './search/get-db'
import initSentry from './util/raven'
import { setupRemoteFunctionsImplementations } from 'src/util/webextensionRPC'
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

export async function main() {
    const localStorageChangesManager = new StorageChangesManager({
        storage: browser.storage,
    })
    initSentry({ storageChangesManager: localStorageChangesManager })

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
    const services = await createServices({
        backend: 'memory',
        getServerStorage,
    })

    const backgroundModules = createBackgroundModules({
        services,
        getServerStorage,
        signalTransportFactory: createFirebaseSignalTransport,
        analyticsManager: analytics,
        localStorageChangesManager,
        fetchPageDataProcessor,
        browserAPIs: browser,
        getSharedSyncLog: async () =>
            (await getServerStorage()).storageModules.sharedSyncLog,
        storageManager,
        getIceServers: async () => {
            const firebase = await getFirebase()
            const generateToken = firebase
                .functions()
                .httpsCallable('generateTwilioNTSToken')
            const response = await generateToken({})
            return response.data.iceServers
        },
    })
    registerBackgroundModuleCollections(storageManager, backgroundModules)

    await storageManager.finishInitialization()

    const { setStorageLoggingEnabled } = await setStorageMiddleware(
        storageManager,
        {
            syncService: backgroundModules.sync,
            storexHub: backgroundModules.storexHub,
            contentSharing: backgroundModules.contentSharing,
            readwise: backgroundModules.readwise,
        },
    )
    await setupBackgroundModules(backgroundModules, storageManager)

    navigator?.storage?.persist?.()

    setStorex(storageManager)

    // Gradually moving all remote function registrations here
    setupRemoteFunctionsImplementations({
        auth: backgroundModules.auth.remoteFunctions,
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
    })

    // Attach interesting features onto global window scope for interested users
    window['getDb'] = getDb
    window['storageMan'] = storageManager
    window['bgModules'] = backgroundModules
    window['analytics'] = analytics
    window['dataSeeders'] = setupDataSeeders(storageManager)
    window['setStorageLoggingEnabled'] = setStorageLoggingEnabled

    window['selfTests'] = await createSelfTests({
        storage: {
            manager: storageManager,
        },
        services: {
            sync: backgroundModules.sync,
        },
        // auth: {
        //     setUser: async ({ id }) => {
        //         ;(backgroundModules.auth
        //             .authService as MemoryAuthService).setUser({
        //             ...TEST_USER,
        //             id: id as string,
        //         })
        //     },
        // },
        intergrationTestData: {
            insert: async () => {
                console['log']('Inserting integration test data')
                const listId = await backgroundModules.customLists.createCustomList(
                    {
                        name: 'My list',
                    },
                )
                await backgroundModules.customLists.insertPageToList({
                    id: listId,
                    url:
                        'http://highscalability.com/blog/2019/7/19/stuff-the-internet-says-on-scalability-for-july-19th-2019.html',
                })
                await backgroundModules.pages.addPage({
                    pageDoc: {
                        url:
                            'http://highscalability.com/blog/2019/7/19/stuff-the-internet-says-on-scalability-for-july-19th-2019.html',
                        content: {
                            fullText: 'home page content',
                            title: 'bla.com title',
                        },
                    },
                    visits: [],
                })
            },
        },
    })
}

main()
