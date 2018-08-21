import 'src/activity-logger/background'
import 'src/search/background'
import 'src/analytics/background'
import 'src/imports/background'
import DirectLinkingBackground from 'src/direct-linking/background'
import EventLogBackground from 'src/analytics/internal/background'
import CustomListBackground from 'src/custom-lists/background'
import NotificationBackground from 'src/notifications/background'
import 'src/omnibar'
import { INSTALL_TIME_KEY, OVERVIEW_URL } from './constants'
import {
    constants as blacklistConsts,
    blacklist,
} from 'src/blacklist/background'
import analytics from 'src/analytics'
import { SEARCH_INJECTION_KEY } from 'src/search-injection/constants'
import db, { storageManager } from 'src/search'
import initSentry from './util/raven'
import { USER_ID, generateTokenIfNot } from 'src/util/generate-token'
import { API_HOST } from 'src/analytics/internal/constants'
import { storageChangesManager } from 'src/util/storage-changes'
import internalAnalytics from 'src/analytics/internal'
import BackgroundScript, { utils } from './background-script'

window.db = db

window.storageMan = storageManager

initSentry()

const notifications = new NotificationBackground({ storageManager })
notifications.setupRemoteFunctions()

async function onInstall() {
    await notifications.deliverStaticNotifications()
    const now = Date.now()

    // Ensure default blacklist entries are stored (before doing anything else)
    await blacklist.addToBlacklist(blacklistConsts.DEF_ENTRIES)
    analytics.trackEvent({ category: 'Global', action: 'Install' }, true)
    // Open onboarding page
    browser.tabs.create({ url: `${OVERVIEW_URL}?install=true` })
    // Store the timestamp of when the extension was installed + default blacklist
    browser.storage.local.set({ [INSTALL_TIME_KEY]: now })

    await generateTokenIfNot({ installTime: now })
}

async function onUpdate() {
    await notifications.deliverStaticNotifications()

    // Check whether old Search Injection boolean exists and replace it with new object
    const searchInjectionKey = (await browser.storage.local.get(
        SEARCH_INJECTION_KEY,
    ))[SEARCH_INJECTION_KEY]

    if (typeof searchInjectionKey === 'boolean') {
        browser.storage.local.set({
            [SEARCH_INJECTION_KEY]: {
                google: searchInjectionKey,
                duckduckgo: true,
            },
        })
    }

    const installTime = (await browser.storage.local.get(INSTALL_TIME_KEY))[
        INSTALL_TIME_KEY
    ]

    await generateTokenIfNot({ installTime })
}

browser.commands.onCommand.addListener(command => {
    switch (command) {
        case 'openOverview':
            return utils.openOverview()
        default:
    }
})

browser.runtime.onInstalled.addListener(details => {
    switch (details.reason) {
        case 'install':
            return onInstall()
        case 'update':
            return onUpdate()
        default:
    }
})

storageChangesManager.addListener('local', USER_ID, ({ newValue }) => {
    browser.runtime.setUninstallURL(`${API_HOST}/uninstall?user=${newValue}`)
})

const bgScript = new BackgroundScript({})
bgScript.setupRemoteFunctions()
window.bgScript = bgScript

const directLinking = new DirectLinkingBackground({ storageManager })
directLinking.setupRemoteFunctions()
directLinking.setupRequestInterceptor()
window.directLinking = directLinking

const eventLog = new EventLogBackground({ storageManager })
eventLog.setupRemoteFunctions()
window.eventLog = eventLog
internalAnalytics.registerOperations(eventLog)

const customList = new CustomListBackground({ storageManager })
customList.setupRemoteFunctions()

window.notifications = notifications
