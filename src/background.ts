import 'babel-polyfill'
import 'core-js/es7/symbol'

import { browser } from 'webextension-polyfill-ts'
import initStorex from './search/memex-storex'
import getDb, { setStorexBackend } from './search/get-db'
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
import PdfViewerBackground from './pdf-viewer/background'
import { PDF_VIEWER_URL } from './pdf-viewer/constants'

// Features that auto-setup
import './analytics/background'
import './imports/background'
import './omnibar'
import analytics from './analytics'

initSentry()

const storageManager = initStorex()

const notifications = new NotificationBackground({ storageManager })
notifications.setupRemoteFunctions()

const pdfViewer = new PdfViewerBackground({})
pdfViewer.setupRemoteFunctions()

export const directLinking = new DirectLinkingBackground({
    storageManager,
    getDb,
    pdfBackground: pdfViewer,
})
directLinking.setupRemoteFunctions()
directLinking.setupRequestInterceptor()

const activityLogger = new ActivityLoggerBackground({
    storageManager,
    notifsBackground: notifications,
    pdfBackground: pdfViewer,
})
activityLogger.setupRemoteFunctions()
activityLogger.setupWebExtAPIHandlers()

const search = new SearchBackground({
    storageManager,
    getDb,
    tabMan: activityLogger.tabManager,
})
search.setupRemoteFunctions()

const eventLog = new EventLogBackground({ storageManager })
eventLog.setupRemoteFunctions()

export const customList = new CustomListBackground({
    storageManager,
    getDb,
    tabMan: activityLogger.tabManager,
    windows: browser.windows,
})
customList.setupRemoteFunctions()

export const tags = new TagsBackground({
    storageManager,
    getDb,
    tabMan: activityLogger.tabManager,
    windows: browser.windows,
})
tags.setupRemoteFunctions()

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

let bgScript: BackgroundScript

storageManager.finishInitialization().then(() => {
    setStorexBackend(storageManager.backend)
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
window['pdfViewer'] = pdfViewer

browser.runtime.onMessage.addListener((msg, sender) => {
    if (msg.request === 'open-pdf-viewer') {
        browser.tabs.update(sender.tab.id, {
            url: PDF_VIEWER_URL + encodeURI(sender.tab.url),
        })
    }
})
