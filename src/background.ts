import 'babel-polyfill'
import 'core-js/es7/symbol'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import { browser } from 'webextension-polyfill-ts'
import initStorex from './search/memex-storex'
import getDb, { setStorex } from './search/get-db'
import internalAnalytics from './analytics/internal'
import initSentry from './util/raven'

// Features that require manual instantiation to setup
import DirectLinkingBackground from './direct-linking/background'
import EventLogBackground from './analytics/internal/background'
import CustomListBackground from './custom-lists/background'
import NotificationBackground from './notifications/background'
import SearchBackground from './search/background'
import * as backup from './backup/background'
import * as backupStorage from './backup/background/storage'
import BackgroundScript from './background-script'
import alarms from './background-script/alarms'
import TagsBackground from './tags/background'
import ActivityLoggerBackground from './activity-logger/background'
import SocialBackground from './social-integration/background'
import BookmarksBackground from './bookmarks/background'

// Features that auto-setup
import './analytics/background'
import './imports/background'
import './omnibar'
import analytics from './analytics'

initSentry()

const storageManager = initStorex()

const notifications = new NotificationBackground({ storageManager })
notifications.setupRemoteFunctions()

const social = new SocialBackground({ storageManager })
social.setupRemoteFunctions()

export const directLinking = new DirectLinkingBackground({
    storageManager,
    socialBg: social,
})
directLinking.setupRemoteFunctions()
directLinking.setupRequestInterceptor()

const activityLogger = new ActivityLoggerBackground({
    storageManager,
})
activityLogger.setupRemoteFunctions()
activityLogger.setupWebExtAPIHandlers()

const search = new SearchBackground({
    storageManager,
    tabMan: activityLogger.tabManager,
})
search.setupRemoteFunctions()

const eventLog = new EventLogBackground({ storageManager })
eventLog.setupRemoteFunctions()

export const customList = new CustomListBackground({
    storageManager,
    tabMan: activityLogger.tabManager,
    windows: browser.windows,
})
customList.setupRemoteFunctions()

export const tags = new TagsBackground({
    storageManager,
    tabMan: activityLogger.tabManager,
    windows: browser.windows,
})
tags.setupRemoteFunctions()

export const bookmarks = new BookmarksBackground({
    storageManager,
})
bookmarks.setupRemoteFunctions()

const backupModule = new backup.BackupBackgroundModule({
    storageManager,
    lastBackupStorage: new backupStorage.LocalLastBackupStorage({
        key: 'lastBackup',
    }),
    notifications,
})

backupModule.setBackendFromStorage()
backupModule.setupRemoteFunctions()
backupModule.startRecordingChangesIfNeeded()

registerModuleMapCollections(storageManager.registry, {
    annotations: directLinking.annotationStorage,
    notifications: notifications.storage,
    customList: customList.storage,
    bookmarks: bookmarks.storage,
    backup: backupModule.storage,
    eventLog: eventLog.storage,
    search: search.storage,
    social: social.storage,
    tags: tags.storage,
})

let bgScript: BackgroundScript

storageManager.finishInitialization().then(() => {
    setStorex(storageManager)
    internalAnalytics.registerOperations(eventLog)
    backupModule.storage.setupChangeTracking()

    bgScript = new BackgroundScript({
        storageManager,
        notifsBackground: notifications,
        loggerBackground: activityLogger,
    })
    bgScript.setupRemoteFunctions()
    bgScript.setupWebExtAPIHandlers()
    bgScript.setupAlarms(alarms)
})

// Attach interesting features onto global window scope for interested users
window['backup'] = backupModule
window['getDb'] = getDb
window['storageMan'] = storageManager
window['bgScript'] = bgScript
window['eventLog'] = eventLog
window['directLinking'] = directLinking
window['search'] = search
window['customList'] = customList
window['notifications'] = notifications
window['analytics'] = analytics
window['logger'] = activityLogger
window['tabMan'] = activityLogger.tabManager
window['socialInt'] = social
