import type Storex from '@worldbrain/storex'
import type {
    Alarms,
    Runtime,
    Commands,
    Storage,
    Tabs,
} from 'webextension-polyfill-ts'
import type { URLNormalizer } from '@worldbrain/memex-url-utils'

import * as utils from './utils'
import type NotifsBackground from '../notifications/background'
import { makeRemotelyCallable } from '../util/webextensionRPC'
import type { StorageChangesManager } from '../util/storage-changes'
import { migrations } from './quick-and-dirty-migrations'
import type { AlarmsConfig } from './alarms'
import { generateUserId } from 'src/analytics/utils'
import { STORAGE_KEYS } from 'src/analytics/constants'
import type CopyPasterBackground from 'src/copy-paster/background'
import insertDefaultTemplates from 'src/copy-paster/background/default-templates'
import { OVERVIEW_URL, __OLD_INSTALL_TIME_KEY } from 'src/constants'
import { READ_STORAGE_FLAG } from 'src/common-ui/containers/UpdateNotifBanner/constants'
import type { ReadwiseBackground } from 'src/readwise-integration/background'
import { migrateInstallTime } from 'src/personal-cloud/storage/migrate-install-time'

// TODO: pass these deps down via constructor
import {
    constants as blacklistConsts,
    blacklist,
} from 'src/blacklist/background'
import analytics from 'src/analytics'
import type TabManagementBackground from 'src/tab-management/background'
import type CustomListBackground from 'src/custom-lists/background'
import { ONBOARDING_QUERY_PARAMS } from 'src/overview/onboarding/constants'
import type { BrowserSettingsStore } from 'src/util/settings'
import type { LocalExtensionSettings } from './types'
import type { SyncSettingsBackground } from 'src/sync-settings/background'
import type { SyncSettingsStore } from 'src/sync-settings/util'

interface Dependencies {
    storageManager: Storex
    tabManagement: TabManagementBackground
    notifsBackground: NotifsBackground
    copyPasterBackground: CopyPasterBackground
    customListsBackground: CustomListBackground
    readwiseBG: ReadwiseBackground
    syncSettingsBG: SyncSettingsBackground
    localExtSettingStore: BrowserSettingsStore<LocalExtensionSettings>
    syncSettingsStore: SyncSettingsStore<'pdfIntegration' | 'dashboard'>
    urlNormalizer: URLNormalizer
    storageChangesMan: StorageChangesManager
    storageAPI: Storage.Static
    runtimeAPI: Runtime.Static
    commandsAPI: Commands.Static
    alarmsAPI: Alarms.Static
    tabsAPI: Tabs.Static
}

class BackgroundScript {
    private alarmsListener: (alarm: Alarms.Alarm) => void

    constructor(public deps: Dependencies) {}

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
        this.deps.commandsAPI.onCommand.addListener((command) => {
            switch (command) {
                case 'openOverview':
                    return utils.openOverview()
                default:
            }
        })
    }

    private async runOnboarding() {
        await this.deps.tabsAPI.create({
            url: `${OVERVIEW_URL}?${ONBOARDING_QUERY_PARAMS.NEW_USER}`,
        })
    }

    async handleInstallLogic(now = Date.now()) {
        // Ensure default blacklist entries are stored (before doing anything else)
        await blacklist.addToBlacklist(blacklistConsts.DEF_ENTRIES)

        analytics.trackEvent({ category: 'Global', action: 'installExtension' })

        await this.runOnboarding()

        // Store the timestamp of when the extension was installed
        await this.deps.localExtSettingStore.set('installTimestamp', Date.now())

        // Enable PDF integration by default
        await this.deps.syncSettingsStore.pdfIntegration.set(
            'shouldAutoOpen',
            true,
        )

        // TODO: Set up pioneer subscription banner to show up in 2 weeks
        // const fortnightFromNow = now + 1000 * 60 * 60 * 24 * 7 * 2
        // await this.deps.syncSettings.dashboard.set(
        //     'subscribeBannerShownAfter',
        //     fortnightFromNow,
        // )
        this.deps.syncSettingsStore.dashboard.set(
            'subscribeBannerShownAfter',
            now, // Instead, show it immediately
        )

        await insertDefaultTemplates({
            copyPaster: this.deps.copyPasterBackground,
            localStorage: this.deps.storageAPI.local,
        })
    }

    async handleUpdateLogic(prevVersion: string, now = Date.now()) {
        const {
            storageManager,
            localExtSettingStore,
            storageAPI,
            runtimeAPI,
            syncSettingsBG,
        } = this.deps

        if (process.env['SKIP_UPDATE_NOTIFICATION'] !== 'true') {
            await storageAPI.local.set({ [READ_STORAGE_FLAG]: false })
        }

        const { version: nextVersion } = runtimeAPI.getManifest()
        if (
            nextVersion === '3.0.0' ||
            (nextVersion === '3.0.1' && prevVersion !== '3.0.0')
        ) {
            await this.deps.syncSettingsStore.dashboard.set(
                'subscribeBannerShownAfter',
                now,
            )
            await syncSettingsBG.migrateLocalStorage()
            await migrateInstallTime({
                storageManager,
                getOldInstallTime: () =>
                    localExtSettingStore.__rawGet(__OLD_INSTALL_TIME_KEY),
                setInstallTime: (time) =>
                    localExtSettingStore.set('installTimestamp', time),
            })
        }
    }

    /**
     * Runs on both extension update and install.
     */
    private async handleUnifiedLogic() {
        await this.deps.customListsBackground.createInboxListIfAbsent()
        await this.deps.notifsBackground.deliverStaticNotifications()
        await this.deps.tabManagement.trackExistingTabs()
    }

    /**
     * Set up logic that will get run on ext install, update, browser update.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
     */
    private setupInstallHooks() {
        this.deps.runtimeAPI.onInstalled.addListener(async (details) => {
            switch (details.reason) {
                case 'install':
                    await this.handleUnifiedLogic()
                    return this.handleInstallLogic()
                case 'update':
                    await this.runQuickAndDirtyMigrations()
                    await this.handleUnifiedLogic()
                    return this.handleUpdateLogic(details.previousVersion!)
                default:
            }
        })
    }

    private setupStartupHooks() {
        this.deps.runtimeAPI.onStartup.addListener(async () => {
            this.deps.tabManagement.trackExistingTabs()
        })
    }

    /**
     * Run all the quick and dirty migrations we have set up to run directly on Dexie.
     */
    private async runQuickAndDirtyMigrations() {
        for (const [storageKey, migration] of Object.entries(migrations)) {
            const storage = await this.deps.storageAPI.local.get(storageKey)

            if (storage[storageKey]) {
                continue
            }

            await migration({
                storex: this.deps.storageManager,
                db: this.deps.storageManager.backend['dexieInstance'],
                localStorage: this.deps.storageAPI.local,
                normalizeUrl: this.deps.urlNormalizer,
                backgroundModules: {
                    readwise: this.deps.readwiseBG,
                    syncSettings: this.deps.syncSettingsBG,
                },
            })
            await this.deps.storageAPI.local.set({ [storageKey]: true })
        }
    }

    /**
     * Set up URL to open on extension uninstall.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/setUninstallURL
     */
    private setupUninstallURL() {
        this.deps.runtimeAPI.setUninstallURL(this.defaultUninstallURL)
        setTimeout(async () => {
            const userId = await generateUserId({
                storage: this.deps.storageAPI,
            })
            this.deps.runtimeAPI.setUninstallURL(
                `${this.defaultUninstallURL}?user=${userId}`,
            )
        }, 1000)

        this.deps.storageChangesMan.addListener(
            'local',
            STORAGE_KEYS.USER_ID,
            ({ newValue }) =>
                this.deps.runtimeAPI.setUninstallURL(
                    `${this.defaultUninstallURL}?user=${newValue}`,
                ),
        )
    }

    sendNotification(notifId: string) {
        return this.deps.notifsBackground.dispatchNotification(notifId)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            openOptionsTab: utils.openOptionsURL,
            openOverviewTab: utils.openOverviewURL,
            openLearnMoreTab: utils.openLearnMoreURL,
        })
    }

    setupWebExtAPIHandlers() {
        this.setupInstallHooks()
        this.setupStartupHooks()
        this.setupCommands()
        this.setupUninstallURL()
    }

    setupAlarms(alarms: AlarmsConfig) {
        const alarmListeners = new Map()

        for (const [name, { listener, ...alarmInfo }] of Object.entries(
            alarms,
        )) {
            this.deps.alarmsAPI.create(name, alarmInfo)
            alarmListeners.set(name, listener)
        }

        this.alarmsListener = ({ name }) => {
            const listener = alarmListeners.get(name)
            if (typeof listener === 'function') {
                listener(this)
            }
        }

        this.deps.alarmsAPI.onAlarm.addListener(this.alarmsListener)
    }

    clearAlarms() {
        this.deps.alarmsAPI.clearAll()
        this.deps.alarmsAPI.onAlarm.removeListener(this.alarmsListener)
    }
}

export { utils }
export default BackgroundScript
