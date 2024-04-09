import type Storex from '@worldbrain/storex'
import type { Runtime, Storage, Tabs } from 'webextension-polyfill'
import type { URLNormalizer } from '@worldbrain/memex-common/lib/url-utils/normalize/types'

import * as utils from './utils'
import { makeRemotelyCallable, runInTab } from '../util/webextensionRPC'
import type { StorageChangesManager } from '../util/storage-changes'
import { migrations, MIGRATION_PREFIX } from './quick-and-dirty-migrations'
import { generateUserId } from 'src/analytics/utils'
import { STORAGE_KEYS } from 'src/analytics/constants'
import insertDefaultTemplates from 'src/copy-paster/background/default-templates'
import {
    OVERVIEW_URL,
    __OLD_INSTALL_TIME_KEY,
    OPTIONS_URL,
    LEARN_MORE_URL,
} from 'src/constants'
import analytics from 'src/analytics'
import { ONBOARDING_QUERY_PARAMS } from 'src/overview/onboarding/constants'
import type { BrowserSettingsStore } from 'src/util/settings'
import type {
    LocalExtensionSettings,
    RemoteBGScriptInterface,
    OpenTabParams,
} from './types'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import {
    READ_STORAGE_FLAG,
    LAST_UPDATE_TIME_STAMP,
} from 'src/common-ui/containers/UpdateNotifBanner/constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { MISSING_PDF_QUERY_PARAM } from 'src/dashboard-refactor/constants'
import type { BackgroundModules } from './setup'
import type { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import { captureException } from 'src/util/raven'
import { checkStripePlan } from 'src/util/subscriptions/storage'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { trackOnboardingPath } from '@worldbrain/memex-common/lib/analytics/events'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'

interface Dependencies {
    localExtSettingStore: BrowserSettingsStore<LocalExtensionSettings>
    syncSettingsStore: SyncSettingsStore<
        'pdfIntegration' | 'dashboard' | 'extension'
    >
    urlNormalizer: URLNormalizer
    storageChangesMan: StorageChangesManager
    storageAPI: Storage.Static
    runtimeAPI: Runtime.Static
    tabsAPI: Tabs.Static
    analyticsBG: AnalyticsCoreInterface
    storageManager: Storex
    bgModules: Pick<
        BackgroundModules,
        | 'pageActivityIndicator'
        | 'tabManagement'
        | 'notifications'
        | 'copyPaster'
        | 'customLists'
        | 'personalCloud'
        | 'readwise'
        | 'syncSettings'
        | 'summarizeBG'
        | 'auth'
        | 'customLists'
        | 'contentSharing'
        | 'pkmSyncBG'
    >
}

class BackgroundScript {
    remoteFunctions: RemoteBGScriptInterface

    constructor(public deps: Dependencies) {
        this.remoteFunctions = {
            openOptionsTab: this.openOptionsPage,
            openOverviewTab: this.openDashboardPage,
            openLearnMoreTab: this.openLearnMorePage,
            confirmBackgroundScriptLoaded: async () => {},
        }

        // window['___removeDupeSpaces'] = () =>
        // removeDupeSpaces({ storageManager: deps.storageManager })
    }

    get defaultUninstallURL() {
        return process.env.NODE_ENV === 'production'
            ? 'https://us-central1-worldbrain-1057.cloudfunctions.net/uninstall'
            : 'https://us-central1-worldbrain-staging.cloudfunctions.net/uninstall'
    }

    private async runOnboarding() {
        await this.deps.tabsAPI.create({
            url: `${OVERVIEW_URL}?${ONBOARDING_QUERY_PARAMS.NEW_USER}`,
        })
    }

    async handleInstallLogic(now = Date.now()) {
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

    private setOnboardingTutorialState = async () => {
        const tutorials = {
            ['@onboarding-dashboard-tutorials']: {
                pages: true,
                notes: true,
                videos: true,
                pdf: true,
                twitter: true,
            },
        }

        await this.deps.storageAPI.local.set(tutorials)
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
                    await this.setOnboardingTutorialState()
                    await this.trackInstallTime()
                    break
                case 'update':
                    this.runQuickAndDirtyMigrations()
                    await this.checkForUpdates()
                    await this.handleUnifiedLogic()
                    await this.checkForSubscriptionStatus()
                    break
                default:
            }
        })
    }

    private async trackInstallTime() {
        await trackOnboardingPath(this.deps.analyticsBG, {
            type: 'interactive',
        })
    }

    private async checkForUpdates() {
        const isStaging =
            process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
            process.env.NODE_ENV === 'development'
        const baseUrl = isStaging
            ? CLOUDFLARE_WORKER_URLS.staging
            : CLOUDFLARE_WORKER_URLS.production
        const url = `${baseUrl}/checkForUpdates`

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })

        const responseJSON = await response.json()
        const hasUpdate = parseFloat(responseJSON.hasUpdate)
        const lastUpdateTimeStamp = await getLocalStorage(
            LAST_UPDATE_TIME_STAMP,
        )
        if (
            hasUpdate > lastUpdateTimeStamp ||
            (hasUpdate && !lastUpdateTimeStamp)
        ) {
            await setLocalStorage(READ_STORAGE_FLAG, false)
            await setLocalStorage(LAST_UPDATE_TIME_STAMP, hasUpdate)
        }
    }

    private async checkForSubscriptionStatus() {
        await this.deps.bgModules.auth.authService
            .waitForAuthReady()
            .then(async () => {
                let currentUser = await this.deps.bgModules.auth.authService.getCurrentUser()
                if (currentUser) {
                    let emailAddresse = currentUser.email
                    checkStripePlan(emailAddresse)
                }
            })
    }

    private async ___runQnDMigration(name: string) {
        await migrations[MIGRATION_PREFIX + name]({
            bgModules: this.deps.bgModules,
            storex: this.deps.storageManager,
            db: this.deps.storageManager.backend['dexieInstance'],
            localStorage: this.deps.storageAPI.local,
            normalizeUrl: this.deps.urlNormalizer,
            syncSettingsStore: this.deps.syncSettingsStore,
            localExtSettingStore: this.deps.localExtSettingStore,
        })
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

    setupWebExtAPIHandlers() {
        this.setupInstallHooks()
        this.setupOnDemandContentScriptInjection()
        this.setupUninstallURL()
        this.deps.runtimeAPI.onUpdateAvailable.addListener(
            this.prepareAndUpdateExtension,
        )
    }

    private prepareAndUpdateExtension = async () => {
        const { runtimeAPI, bgModules } = this.deps
        try {
            await bgModules.tabManagement.mapTabChunks(
                async (tab) => {
                    if (!bgModules.tabManagement.canTabRunContentScripts(tab)) {
                        return
                    }

                    await runInTab<InPageUIContentScriptRemoteInterface>(
                        tab.id,
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
    }

    private chooseTabOpenFn = (params?: OpenTabParams) =>
        params?.openInSameTab
            ? this.deps.tabsAPI.update
            : this.deps.tabsAPI.create

    private openDashboardPage: RemoteBGScriptInterface['openOverviewTab'] = async (
        params,
    ) => {
        let addedQuery
        if (params?.selectedSpace) {
            addedQuery = `selectedSpace=${params.selectedSpace}`
        }

        const selectedSpacesString = addedQuery ?? null
        const missingPDFString = params?.missingPdf
            ? MISSING_PDF_QUERY_PARAM
            : null

        if (selectedSpacesString && missingPDFString) {
            await this.chooseTabOpenFn(params)({
                url:
                    OVERVIEW_URL +
                    '?' +
                    selectedSpacesString +
                    '&' +
                    missingPDFString,
            })
        } else if (selectedSpacesString) {
            await this.chooseTabOpenFn(params)({
                url: OVERVIEW_URL + '?' + selectedSpacesString,
            })
        } else if (missingPDFString) {
            await this.chooseTabOpenFn(params)({
                url: OVERVIEW_URL + '?' + missingPDFString,
            })
        } else {
            await this.chooseTabOpenFn(params)({
                url: OVERVIEW_URL,
            })
        }
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
