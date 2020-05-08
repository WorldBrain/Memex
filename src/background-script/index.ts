import Storex from '@worldbrain/storex'
import {
    browser,
    Alarms,
    Runtime,
    Commands,
    Storage,
} from 'webextension-polyfill-ts'
import { URLNormalizer, normalizeUrl } from '@worldbrain/memex-url-utils'

import * as utils from './utils'
import ActivityLoggerBackground from 'src/activity-logger/background'
import NotifsBackground from '../notifications/background'
import { onInstall, onUpdate } from './on-install-hooks'
import { makeRemotelyCallable } from '../util/webextensionRPC'
import { StorageChangesManager } from '../util/storage-changes'
import { migrations } from './quick-and-dirty-migrations'
import { AlarmsConfig } from './alarms'
import { generateUserId } from 'src/analytics/utils'
import { STORAGE_KEYS } from 'src/analytics/constants'

class BackgroundScript {
    private utils: typeof utils
    private notifsBackground: NotifsBackground
    private activityLoggerBackground: ActivityLoggerBackground
    private storageChangesMan: StorageChangesManager
    private storageManager: Storex
    private urlNormalizer: URLNormalizer
    private storageAPI: Storage.Static
    private runtimeAPI: Runtime.Static
    private commandsAPI: Commands.Static
    private alarmsAPI: Alarms.Static
    private alarmsListener

    constructor({
        storageManager,
        notifsBackground,
        loggerBackground,
        utilFns = utils,
        storageChangesMan,
        urlNormalizer = normalizeUrl,
        storageAPI = browser.storage,
        runtimeAPI = browser.runtime,
        commandsAPI = browser.commands,
        alarmsAPI = browser.alarms,
    }: {
        storageManager: Storex
        notifsBackground: NotifsBackground
        loggerBackground: ActivityLoggerBackground
        urlNormalizer?: URLNormalizer
        utilFns?: typeof utils
        storageChangesMan: StorageChangesManager
        storageAPI?: Storage.Static
        runtimeAPI?: Runtime.Static
        commandsAPI?: Commands.Static
        alarmsAPI?: Alarms.Static
    }) {
        this.storageManager = storageManager
        this.notifsBackground = notifsBackground
        this.activityLoggerBackground = loggerBackground
        this.utils = utilFns
        this.storageChangesMan = storageChangesMan
        this.storageAPI = storageAPI
        this.runtimeAPI = runtimeAPI
        this.commandsAPI = commandsAPI
        this.alarmsAPI = alarmsAPI
        this.urlNormalizer = urlNormalizer
    }

    get defaultUninstallURL() {
        return process.env.NODE_ENV === 'production'
            ? 'https://us-central1-worldbrain-1057.cloudfunctions.net/uninstall'
            : 'https://us-central1-worldbrain-staging.cloudfunctions.net/uninstall'
    }

    /**
     * Set up custom commands defined in the manifest.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/commands
     */
    private setupCommands() {
        this.commandsAPI.onCommand.addListener(command => {
            switch (command) {
                case 'openOverview':
                    return this.utils.openOverview()
                default:
            }
        })
    }

    /**
     * Set up logic that will get run on ext install, update, browser update.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
     */
    private setupInstallHooks() {
        this.runtimeAPI.onInstalled.addListener(details => {
            this.notifsBackground.deliverStaticNotifications()
            this.activityLoggerBackground.trackExistingTabs()

            switch (details.reason) {
                case 'install':
                    return onInstall()
                case 'update':
                    this.runQuickAndDirtyMigrations()
                    return onUpdate()
                default:
            }
        })
    }

    /**
     * Run all the quick and dirty migrations we have set up to run directly on Dexie.
     */
    private async runQuickAndDirtyMigrations() {
        for (const [storageKey, migration] of Object.entries(migrations)) {
            const storage = await this.storageAPI.local.get(storageKey)

            if (storage[storageKey]) {
                continue
            }

            await migration({
                db: this.storageManager.backend['dexieInstance'],
                normalizeUrl: this.urlNormalizer,
            })
            await this.storageAPI.local.set({ [storageKey]: true })
        }
    }

    /**
     * Set up URL to open on extension uninstall.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/setUninstallURL
     */
    private setupUninstallURL() {
        this.runtimeAPI.setUninstallURL(this.defaultUninstallURL)
        setTimeout(async () => {
            const userId = await generateUserId({})
            this.runtimeAPI.setUninstallURL(
                `${this.defaultUninstallURL}?user=${userId}`,
            )
        }, 1000)

        this.storageChangesMan.addListener(
            'local',
            STORAGE_KEYS.USER_ID,
            ({ newValue }) =>
                this.runtimeAPI.setUninstallURL(
                    `${this.defaultUninstallURL}?user=${newValue}`,
                ),
        )
    }

    sendNotification(notifId: string) {
        return this.notifsBackground.dispatchNotification(notifId)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            openOverviewTab: this.utils.openOverviewURL,
            openOptionsTab: this.utils.openOptionsURL,
            openLearnMoreTab: this.utils.openLearnMoreURL,
        })
    }

    setupWebExtAPIHandlers() {
        this.setupInstallHooks()
        this.setupCommands()
        this.setupUninstallURL()
    }

    setupAlarms(alarms: AlarmsConfig) {
        const alarmListeners = new Map()

        for (const [name, { listener, ...alarmInfo }] of Object.entries(
            alarms,
        )) {
            this.alarmsAPI.create(name, alarmInfo)
            alarmListeners.set(name, listener)
        }

        this.alarmsListener = ({ name }) => {
            const listener = alarmListeners.get(name)
            if (typeof listener === 'function') {
                listener(this)
            }
        }

        this.alarmsAPI.onAlarm.addListener(this.alarmsListener)
    }

    clearAlarms() {
        this.alarmsAPI.clearAll()
        this.alarmsAPI.onAlarm.removeListener(this.alarmsListener)
    }
}

export { utils }
export default BackgroundScript
