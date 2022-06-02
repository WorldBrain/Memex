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
import { makeRemotelyCallable, runInTab } from '../util/webextensionRPC'
import type { StorageChangesManager } from '../util/storage-changes'
import { migrations, MIGRATION_PREFIX } from './quick-and-dirty-migrations'
import type { AlarmsConfig } from './alarms'
import { generateUserId } from 'src/analytics/utils'
import { STORAGE_KEYS } from 'src/analytics/constants'
import insertDefaultTemplates from 'src/copy-paster/background/default-templates'
import {
    OVERVIEW_URL,
    __OLD_INSTALL_TIME_KEY,
    OPTIONS_URL,
    LEARN_MORE_URL,
} from 'src/constants'

// TODO: pass these deps down via constructor
import {
    constants as blacklistConsts,
    blacklist,
} from 'src/blacklist/background'
import analytics from 'src/analytics'
import { ONBOARDING_QUERY_PARAMS } from 'src/overview/onboarding/constants'
import type { BrowserSettingsStore } from 'src/util/settings'
import type {
    LocalExtensionSettings,
    RemoteBGScriptInterface,
    OpenTabParams,
} from './types'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import { READ_STORAGE_FLAG } from 'src/common-ui/containers/UpdateNotifBanner/constants'
import { setLocalStorage } from 'src/util/storage'
import { MISSING_PDF_QUERY_PARAM } from 'src/dashboard-refactor/constants'
import type { BackgroundModules } from './setup'
import type { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import { isExtensionTab, isBrowserPageTab } from 'src/tab-management/utils'
import { captureException } from 'src/util/raven'

interface Dependencies {
    localExtSettingStore: BrowserSettingsStore<LocalExtensionSettings>
    syncSettingsStore: SyncSettingsStore<
        'pdfIntegration' | 'dashboard' | 'extension'
    >
    urlNormalizer: URLNormalizer
    storageChangesMan: StorageChangesManager
    storageAPI: Storage.Static
    runtimeAPI: Runtime.Static
    commandsAPI: Commands.Static
    alarmsAPI: Alarms.Static
    tabsAPI: Tabs.Static
    storageManager: Storex
    bgModules: Pick<
        BackgroundModules,
        | 'tabManagement'
        | 'notifications'
        | 'copyPaster'
        | 'customLists'
        | 'personalCloud'
        | 'readwise'
        | 'syncSettings'
    >
}

class BackgroundScript {
    private alarmsListener: (alarm: Alarms.Alarm) => void
    private remoteFunctions: RemoteBGScriptInterface

    constructor(public deps: Dependencies) {
        this.remoteFunctions = {
            openOptionsTab: this.openOptionsPage,
            openOverviewTab: this.openDashboardPage,
            openLearnMoreTab: this.openLearnMorePage,
        }
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

        // Disable PDF integration by default
        await this.deps.syncSettingsStore.pdfIntegration.set(
            'shouldAutoOpen',
            false,
        )

        // Disable tags
        await this.deps.syncSettingsStore.extension.set(
            'areTagsMigratedToSpaces',
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
            copyPaster: this.deps.bgModules.copyPaster,
            localStorage: this.deps.storageAPI.local,
        })
    }

    /**
     * Runs on both extension update and install.
     */
    private async handleUnifiedLogic() {
        await this.deps.bgModules.customLists.createInboxListIfAbsent()
        // await this.deps.bgModules.notifications.deliverStaticNotifications()
        // await this.deps.bgModules.tabManagement.trackExistingTabs()
    }

    private setupOnDemandContentScriptInjection() {
        // NOTE: this code lacks automated test coverage.
        // ---Ensure you test manually upon change, as the content script injection won't work on ext install/update without it---
        this.deps.tabsAPI.onActivated.addListener(async ({ tabId }) => {
            await this.deps.bgModules.tabManagement.injectContentScriptsIfNeeded(
                tabId,
            )
        })
    }

    /**
     * Set up logic that will get run on ext install, update, browser update.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
     */
    private setupInstallHooks() {
        this.deps.runtimeAPI.onInstalled.addListener(async (details) => {
            switch (details.reason) {
                case 'install':
                    await this.handleInstallLogic()
                    await this.handleUnifiedLogic()
                    await setLocalStorage(READ_STORAGE_FLAG, true)
                    break
                case 'update':
                    await this.runQuickAndDirtyMigrations()
                    await setLocalStorage(READ_STORAGE_FLAG, false)
                    await this.handleUnifiedLogic()
                    break
                default:
            }
        })
    }

    private setupStartupHooks() {
        this.deps.runtimeAPI.onStartup.addListener(async () => {
            this.deps.bgModules.tabManagement.trackExistingTabs()
        })
    }

    private async ___runTagsMigration() {
        await migrations[MIGRATION_PREFIX + 'migrate-tags-to-spaces']({
            bgModules: this.deps.bgModules,
            storex: this.deps.storageManager,
            db: this.deps.storageManager.backend['dexieInstance'],
            localStorage: this.deps.storageAPI.local,
            normalizeUrl: this.deps.urlNormalizer,
            syncSettingsStore: this.deps.syncSettingsStore,
            localExtSettingStore: this.deps.localExtSettingStore,
        })
    }

    private async ___testContentScriptsTeardown(tabId: number) {
        await runInTab<InPageUIContentScriptRemoteInterface>(
            tabId,
        ).teardownContentScripts()
    }

    /**
     * Run all the quick and dirty migrations we have set up to run directly on Dexie.
     */
    private async runQuickAndDirtyMigrations(allowLegacyMigrations = false) {
        for (const [storageKey, migration] of Object.entries(migrations)) {
            const storage = await this.deps.storageAPI.local.get(storageKey)
            const isLegacyMigration = allowLegacyMigrations
                ? false
                : !storageKey.startsWith(MIGRATION_PREFIX)

            if (storage[storageKey] || isLegacyMigration) {
                continue
            }

            await migration({
                bgModules: this.deps.bgModules,
                storex: this.deps.storageManager,
                db: this.deps.storageManager.backend['dexieInstance'],
                localStorage: this.deps.storageAPI.local,
                normalizeUrl: this.deps.urlNormalizer,
                syncSettingsStore: this.deps.syncSettingsStore,
                localExtSettingStore: this.deps.localExtSettingStore,
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
        return this.deps.bgModules.notifications.dispatchNotification(notifId)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    private setupExtUpdateHandling() {
        const { runtimeAPI, bgModules } = this.deps
        runtimeAPI.onUpdateAvailable.addListener(async () => {
            try {
                await bgModules.tabManagement.mapTabChunks(
                    async ({ url, id }) => {
                        if (
                            !url ||
                            isExtensionTab({ url }) ||
                            isBrowserPageTab({ url })
                        ) {
                            return
                        }

                        await runInTab<InPageUIContentScriptRemoteInterface>(
                            id,
                        ).teardownContentScripts()
                    },
                    {
                        onError: (err, tab) => {
                            console.error(
                                `Error encountered attempting to teardown content scripts for extension update on tab "${tab.id}" - url "${tab.url}":`,
                                err.message,
                            )
                            captureException(err)
                        },
                    },
                )
            } catch (err) {
                console.error(
                    'Error encountered attempting to teardown content scripts for extension update:',
                    err.message,
                )
                captureException(err)
            }

            // This call prompts the extension to reload, updating the scripts to the newest versions
            runtimeAPI.reload()
        })
    }

    setupWebExtAPIHandlers() {
        this.setupInstallHooks()
        this.setupStartupHooks()
        this.setupOnDemandContentScriptInjection()
        this.setupCommands()
        this.setupUninstallURL()
        this.setupExtUpdateHandling()
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

    private chooseTabOpenFn = (params?: OpenTabParams) =>
        params?.openInSameTab
            ? this.deps.tabsAPI.update
            : this.deps.tabsAPI.create

    private openDashboardPage: RemoteBGScriptInterface['openOverviewTab'] = async (
        params,
    ) => {
        await this.chooseTabOpenFn(params)({
            url:
                OVERVIEW_URL +
                (params?.missingPdf ? `?${MISSING_PDF_QUERY_PARAM}` : ''),
        })
    }

    private openOptionsPage: RemoteBGScriptInterface['openOptionsTab'] = async (
        query,
        params,
    ) => {
        await this.chooseTabOpenFn(params)({
            url: `${OPTIONS_URL}#${query}`,
        })
    }

    private openLearnMorePage: RemoteBGScriptInterface['openLearnMoreTab'] = async (
        params,
    ) => {
        await this.chooseTabOpenFn(params)({
            url: LEARN_MORE_URL,
        })
    }
}

export { utils }
export default BackgroundScript
