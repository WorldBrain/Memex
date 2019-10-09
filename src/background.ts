import 'babel-polyfill'
import 'core-js/es7/symbol'
import { browser } from 'webextension-polyfill-ts'

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
import { createServerStorageManager } from './storage/server'
import { createLazySharedSyncLog } from './sync/background/shared-sync-log'
import { createFirebaseSignalTransport } from './sync/background/signalling'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'
import { AuthService } from 'src/authentication/background/auth-service'
import { firebase } from 'src/util/firebase-app-initialized'
import { AuthFirebase } from 'src/authentication/background/auth-firebase'
import {
    FirebaseFunctionsAuth,
    FirebaseFunctionsSubscription,
} from 'src/authentication/background/firebase-functions-subscription'

export async function main() {
    const localStorageChangesManager = new StorageChangesManager({
        storage: browser.storage,
    })
    initSentry({ storageChangesManager: localStorageChangesManager })

    const getSharedSyncLog = createLazySharedSyncLog()

    const authBackground = new AuthBackground()
    const storageManager = initStorex()
    const backgroundModules = createBackgroundModules({
        storageManager,
        localStorageChangesManager,
        browserAPIs: browser,
        authBackground,
        signalTransportFactory: createFirebaseSignalTransport,
        getSharedSyncLog,
    })
    registerBackgroundModuleCollections(storageManager, backgroundModules)
    await storageManager.finishInitialization()

    storageManager.setMiddleware([
        await backgroundModules.sync.createSyncLoggingMiddleware(),
    ])

    setStorex(storageManager)

    await setupBackgroundModules(backgroundModules)

    // Gradually moving all remote function registrations here
    setupRemoteFunctionsImplementations({
        auth: {
            getUser: backgroundModules.auth.authService.getUser,
            refresh: backgroundModules.auth.authService.refresh,
            hasValidPlan: backgroundModules.auth.authService.hasValidPlan,
            isAuthorizedForFeature:
                backgroundModules.auth.authService.isAuthorizedForFeature,
            hasSubscribedBefore:
                backgroundModules.auth.authService.hasSubscribedBefore,
        },
        serverFunctions: {
            getCheckoutLink:
                backgroundModules.auth.subscriptionServerFunctions.getCheckoutLink,
            getManageLink:
                backgroundModules.auth.subscriptionServerFunctions.getManageLink,
            refreshUserClaims:
                backgroundModules.auth.authServerFunctions.refreshUserClaims,
        },
        notifications: { createNotification },
        bookmarks: {
            addPageBookmark:
                backgroundModules.search.remoteFunctions.bookmarks.addPageBookmark,
            delPageBookmark:
                backgroundModules.search.remoteFunctions.bookmarks.delPageBookmark,
        },
    })

    // Attach interesting features onto global window scope for interested users
    // TODO: prefix these with memex_ to avoid collisions?
    window['authService'] = backgroundModules.auth.authService
    window['authServerFunctions'] = backgroundModules.auth.authServerFunctions
    window['backup'] = backupModule
    window['getDb'] = getDb
    window['storageMan'] = storageManager
    window['bgScript'] = bgScript
    window['bgModules'] = backgroundModules
    window['analytics'] = analytics
    window['tabMan'] = backgroundModules.activityLogger.tabManager

    const selfTests = {
        clearDb: async () => {
            for (const collectionName of Object.keys(
                storageManager.registry.collections,
            )) {
                await storageManager
                    .collection(collectionName)
                    .deleteObjects({})
            }
        },
        insertTestList: async () => {
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
        initialSyncSend: async () => {
            await selfTests.clearDb()
            await selfTests.insertTestList()
            return backgroundModules.sync.remoteFunctions.requestInitialSync()
        },
        initialSyncReceive: async (options: { initialMessage: string }) => {
            await selfTests.clearDb()
            await backgroundModules.sync.remoteFunctions.answerInitialSync(
                options,
            )
            await backgroundModules.sync.remoteFunctions.waitForInitialSync()
            console['log'](
                'After initial Sync, got these lists',
                await storageManager.collection('customLists').findObjects({}),
            )
        },
        incrementalSyncSend: async (userId: string) => {
            await selfTests.clearDb()
            backgroundModules.auth.userId = userId
            await backgroundModules.sync.continuousSync.storeSetting(
                'deviceId',
                null,
            )

            // await serverStorageManager.collection('sharedSyncLogEntryBatch').deleteObjects({})
            await backgroundModules.sync.continuousSync.initDevice()
            await backgroundModules.sync.continuousSync.setupContinuousSync()
            await selfTests.insertTestList()
            await backgroundModules.sync.continuousSync.forceIncrementalSync()
        },
        incrementalSyncReceive: async (userId: string) => {
            await selfTests.clearDb()
            backgroundModules.auth.userId = userId
            await backgroundModules.sync.continuousSync.storeSetting(
                'deviceId',
                null,
            )
            // await serverStorageManager.collection('sharedSyncLogEntryBatch').deleteObjects({})

            await backgroundModules.sync.continuousSync.initDevice()
            await backgroundModules.sync.continuousSync.setupContinuousSync()
            await backgroundModules.sync.continuousSync.forceIncrementalSync()
            console['log'](
                'After incremental Sync, got these lists',
                await storageManager.collection('customLists').findObjects({}),
            )
        },
    }
    window['selfTests'] = selfTests
}

main()
