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
import { createSharedSyncLog } from './sync/background/shared-sync-log'
import AuthBackground from './auth/background'
import { createFirebaseSignalTransport } from './sync/background/signalling'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules';

export async function main() {
    const localStorageChangesManager = new StorageChangesManager({
        storage: browser.storage,
    })
    initSentry({ storageChangesManager: localStorageChangesManager })

    const serverStorageManager = createServerStorageManager({
        apiKey: 'AIzaSyDZhd-4XonvNk5jpg2a5F2_XmKb3G2jI9U',
        authDomain: 'worldbrain-1057.firebaseapp.com',
        databaseURL: 'https://worldbrain-1057.firebaseio.com',
        projectId: 'worldbrain-1057',
        storageBucket: 'worldbrain-1057.appspot.com',
        messagingSenderId: '455172385517',
        appId: '1:455172385517:web:ad25d7f0325f2ddc0c3ae4',
    })
    const sharedSyncLog = createSharedSyncLog(serverStorageManager)
    registerModuleMapCollections(serverStorageManager.registry, {
        sharedSyncLog,
    })
    await serverStorageManager.finishInitialization()

    const authBackground = new AuthBackground()
    const storageManager = initStorex()
    const backgroundModules = createBackgroundModules({
        storageManager,
        browserAPIs: browser,
        authBackground,
        signalTransportFactory: createFirebaseSignalTransport,
        sharedSyncLog,
    })
    registerBackgroundModuleCollections(storageManager, backgroundModules)
    await storageManager.finishInitialization()
    setStorex(storageManager)

    await setupBackgroundModules(backgroundModules)

    // Gradually moving all remote function registrations here
    setupRemoteFunctionsImplementations({
        notifications: { createNotification },
        bookmarks: {
            addPageBookmark:
                backgroundModules.search.remoteFunctions.bookmarks
                    .addPageBookmark,
            delPageBookmark:
                backgroundModules.search.remoteFunctions.bookmarks
                    .delPageBookmark,
        },
    })

    // Attach interesting features onto global window scope for interested users
    window['getDb'] = getDb
    window['storageMan'] = storageManager
    window['bgScript'] = backgroundModules.bgScript
    window['bgModules'] = backgroundModules
    window['analytics'] = analytics
    window['tabMan'] = backgroundModules.activityLogger.tabManager
}

main()
