import 'src/activity-logger/background'
import 'src/search/background'
import 'src/analytics/background'
import 'src/imports/background'
import DirectLinkingBackground from 'src/direct-linking/background'
import EventLogBackground from 'src/analytics/internal/background'
import CustomListBackground from 'src/custom-lists/background'
import NotificationBackground from 'src/notifications/background'
import BackgroundScript from './background-script'
import 'src/omnibar'
import db, { storageManager } from 'src/search'
import initSentry from './util/raven'
import internalAnalytics from 'src/analytics/internal'

initSentry()

const notifications = new NotificationBackground({ storageManager })
notifications.setupRemoteFunctions()

const directLinking = new DirectLinkingBackground({ storageManager })
directLinking.setupRemoteFunctions()
directLinking.setupRequestInterceptor()

const eventLog = new EventLogBackground({ storageManager })
eventLog.setupRemoteFunctions()
internalAnalytics.registerOperations(eventLog)

const customList = new CustomListBackground({ storageManager })
customList.setupRemoteFunctions()

const bgScript = new BackgroundScript({ notifsBackground: notifications })
bgScript.setupRemoteFunctions()
bgScript.setupWebExtAPIHandlers()

// Attach interesting features onto global window scope for interested users
window.db = db
window.storageMan = storageManager
window.bgScript = bgScript
window.eventLog = eventLog
window.directLinking = directLinking
window.customList = customList
window.notifications = notifications
