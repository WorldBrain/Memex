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
import { createLazySharedSyncLog } from './sync/background/shared-sync-log'
import { createFirebaseSignalTransport } from './sync/background/signalling'
import { DevAuthState } from 'src/authentication/background/setup'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { FeatureOptIns } from 'src/feature-opt-in/background/feature-opt-ins'
import { FetchPageDataProcessor } from 'src/page-analysis/background/fetch-page-data-processor'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import pipeline from 'src/search/pipeline'
import { setStorageMiddleware } from './storage/middleware'
import { getFirebase } from './util/firebase-app-initialized'

export async function main() {
    const localStorageChangesManager = new StorageChangesManager({
        storage: browser.storage,
    })
    initSentry({ storageChangesManager: localStorageChangesManager })

    const getSharedSyncLog = createLazySharedSyncLog()
    const fetchPageDataProcessor = new FetchPageDataProcessor({
        fetchPageData,
        pagePipeline: pipeline,
    })

    const storageManager = initStorex()
    const backgroundModules = createBackgroundModules({
        signalTransportFactory: createFirebaseSignalTransport,
        includePostSyncProcessor: true,
        analyticsManager: analytics,
        localStorageChangesManager,
        fetchPageDataProcessor,
        browserAPIs: browser,
        getSharedSyncLog,
        storageManager,
        authOptions: {
            devAuthState: process.env.DEV_AUTH_STATE as DevAuthState,
        },
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

    await setStorageMiddleware(storageManager, {
        syncService: backgroundModules.sync,
        storexHub: backgroundModules.storexHub,
    })

    setStorex(storageManager)

    await setupBackgroundModules(backgroundModules, storageManager)

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
        bookmarks: {
            addPageBookmark:
                backgroundModules.search.remoteFunctions.bookmarks
                    .addPageBookmark,
            delPageBookmark:
                backgroundModules.search.remoteFunctions.bookmarks
                    .delPageBookmark,
        },
        sync: backgroundModules.sync.remoteFunctions,
        features: new FeatureOptIns(),
        tags: backgroundModules.tags.remoteFunctions,
        collections: backgroundModules.customLists.remoteFunctions,
    })

    // Attach interesting features onto global window scope for interested users
    window['getDb'] = getDb
    window['storageMan'] = storageManager
    window['bgModules'] = backgroundModules
    window['analytics'] = analytics
    window['tabMan'] = backgroundModules.activityLogger.tabManager

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
                await backgroundModules.search.searchIndex.addPage({
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
