import 'babel-polyfill'
import 'core-js/es7/symbol'

import initStorex from './search/memex-storex'
import getDb, { setStorexBackend } from './search'
import internalAnalytics from './analytics/internal'
import initSentry from './util/raven'

// Features that require manual instantiation to setup
import DirectLinkingBackground from './direct-linking/background'
import EventLogBackground from './analytics/internal/background'
import CustomListBackground from './custom-lists/background'
import NotificationBackground from './notifications/background'
import * as backup from './backup/background'
import * as backupStorage from './backup/background/storage'
import * as driveBackup from './backup/background/backend/google-drive'
import setupChangeTracking from './backup/background/change-hooks'
import BackgroundScript from './background-script'

// Features that auto-setup
import './activity-logger/background'
import './search/background'
import './analytics/background'
import './imports/background'
import './omnibar'

initSentry()

const storageManager = initStorex()

const notifications = new NotificationBackground({ storageManager })
notifications.setupRemoteFunctions()

const directLinking = new DirectLinkingBackground({ storageManager, getDb })
directLinking.setupRemoteFunctions()
directLinking.setupRequestInterceptor()

const eventLog = new EventLogBackground({ storageManager })
eventLog.setupRemoteFunctions()

const customList = new CustomListBackground({ storageManager })
customList.setupRemoteFunctions()

const backupModule = new backup.BackupBackgroundModule({
    storageManager,
    backend:
        process.env.BACKUP_BACKEND === 'local'
            ? new (require('./backup/background/backend/simple-http')).default({
                  url: 'http://localhost:8000',
              })
            : new driveBackup.DriveBackupBackend({
                  tokenStore: new driveBackup.LocalStorageDriveTokenStore({
                      prefix: 'drive-token-',
                  }),
                  memexCloudOrigin: backup._getMemexCloudOrigin(),
              }),
    lastBackupStorage: new backupStorage.LocalLastBackupStorage({
        key: 'lastBackup',
    }),
})
backupModule.setupRemoteFunctions()
backupModule.setupRequestInterceptor()
backupModule.startRecordingChangesIfNeeded()

const bgScript = new BackgroundScript({ notifsBackground: notifications })
bgScript.setupRemoteFunctions()
bgScript.setupWebExtAPIHandlers()

storageManager.finishInitialization().then(() => {
    setStorexBackend(storageManager.backend)
    internalAnalytics.registerOperations(eventLog)
    backupModule.storage.setupChangeTracking()
})

// Attach interesting features onto global window scope for interested users
window['backup'] = backupModule
window['getDb'] = getDb
window['storageMan'] = storageManager
window['bgScript'] = bgScript
window['eventLog'] = eventLog
window['directLinking'] = directLinking
window['customList'] = customList
window['notifications'] = notifications

console.log('Background script initialized')
