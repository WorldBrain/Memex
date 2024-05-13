import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { SummarizationService } from '@worldbrain/memex-common/lib/summarization/index'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { makeRemotelyCallable, RemoteFunction } from 'src/util/webextensionRPC'
import type { RemoteEventEmitter } from '../../util/webextensionRPC'
import { trackQueryAI } from '@worldbrain/memex-common/lib/analytics/events'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import {
    AImodels,
    PromptData,
} from '@worldbrain/memex-common/lib/summarization/types'
import { SidebarTab } from 'src/sidebar/annotations-sidebar/containers/types'
import browser, { Browser } from 'webextension-polyfill'
import { COUNTER_STORAGE_KEY } from '@worldbrain/memex-common/lib/subscriptions/constants'
import {
    AIActionAllowed,
    updateTabAISessions,
} from '@worldbrain/memex-common/lib/subscriptions/storage'

export interface SummarizationInterface<Role extends 'provider' | 'caller'> {
    startPageSummaryStream: RemoteFunction<
        Role,
        {
            fullPageUrl?: string
            textToProcess?: string
            queryPrompt?: string
            apiKey?: string
            outputLocation?: 'editor' | 'summaryContainer' | 'chapterSummary'
            chapterSummaryIndex?: number
            AImodel?: AImodels
            isContentSearch?: boolean
            promptData?: PromptData
        }
    >
    isApiKeyValid: RemoteFunction<
        Role,
        {
            apiKey?: string
        },
        { isValid: boolean }
    >
    setActiveSidebarTab: RemoteFunction<
        Role,
        {
            activeTab?: SidebarTab
        }
    >
}

export interface summarizePageBackgroundOptions {
    remoteEventEmitter: RemoteEventEmitter<'pageSummary'>
    browserAPIs: Browser
    analyticsBG?: AnalyticsCoreInterface
}

export default class SummarizeBackground {
    remoteFunctions: SummarizationInterface<'provider'>
    tabIDsWithRunningAISessions: Set<number> = new Set()

    private summarizationService = new SummarizationService({
        serviceURL:
            process.env.NODE_ENV === 'production'
                ? CLOUDFLARE_WORKER_URLS.production
                : CLOUDFLARE_WORKER_URLS.staging,
    })

    constructor(public options: summarizePageBackgroundOptions) {
        this.remoteFunctions = {
            startPageSummaryStream: this.startPageSummaryStream,
            isApiKeyValid: this.isApiKeyValid,
            setActiveSidebarTab: this.setActiveSidebarTab,
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions, { insertExtraArg: true })
    }

    async saveActiveTabId() {
        this.options.browserAPIs.tabs.onRemoved.removeListener(this.onTabClosed)
        const tabs = await this.options.browserAPIs.tabs.query({
            active: true,
            currentWindow: true,
        })
        if (tabs.length > 0) {
            const activeTabId = tabs[0].id
            console.log(`Active tab ID: ${activeTabId}`)
            if (activeTabId !== undefined) {
                this.tabIDsWithRunningAISessions.add(activeTabId)
                this.options.browserAPIs.tabs.onRemoved.addListener(
                    this.onTabClosed,
                )
            }
        }
    }

    onTabClosed = (tabId, removeInfo) => {
        if (this.tabIDsWithRunningAISessions.has(tabId)) {
            this.tabIDsWithRunningAISessions.delete(tabId)
            this.onTabClosedTriggerFunction(tabId) // Assuming this function exists
        }
    }

    // Example of a function triggered when a tab from the set is closed
    async onTabClosedTriggerFunction(tabId: number) {
        console.log(
            `Tab with ID ${tabId} was closed and had an active AI session.`,
        )

        await AIActionAllowed(
            this.options.browserAPIs,
            this.options.analyticsBG,
            false,
            true,
            'gpt-3',
        )

        // Additional logic here
    }

    startPageSummaryStream: SummarizationInterface<
        'provider'
    >['startPageSummaryStream'] = async (
        { tab },
        {
            fullPageUrl,
            textToProcess,
            queryPrompt,
            apiKey,
            outputLocation,
            chapterSummaryIndex,
            AImodel,
            promptData,
        },
    ) => {
        await this.saveActiveTabId()

        let isAllowed = null

        isAllowed = await AIActionAllowed(
            this.options.browserAPIs,
            this.options.analyticsBG,
            apiKey?.length > 0,
            false,
            AImodel,
        )

        if (!isAllowed) {
            return
        }

        // this is here to not scam our users that have the full subscription and add a key only for using GPT-4.
        let apiKeyToUse = apiKey ?? ''
        if (apiKeyToUse?.length > 0 && AImodel === 'gpt-3') {
            const subscriptionStorage = await this.options.browserAPIs.storage.local.get(
                COUNTER_STORAGE_KEY,
            )
            const subscriptionData = subscriptionStorage[COUNTER_STORAGE_KEY]
            const subscriptions = subscriptionData?.pU
            if (subscriptions && subscriptions?.AIpowerup) {
                apiKeyToUse = null
            }
        }

        this.options.remoteEventEmitter.emitToTab('startSummaryStream', tab.id)

        if (this.options.analyticsBG) {
            try {
                await trackQueryAI(this.options.analyticsBG)
            } catch (error) {
                console.error(`Error tracking space create event', ${error}`)
            }
        }

        for await (const result of this.summarizationService.queryAI(
            fullPageUrl,
            textToProcess,
            queryPrompt,
            apiKey,
            undefined,
            AImodel,
            promptData,
        )) {
            const token = result?.t
            if (token?.length > 0) {
                if (outputLocation === 'editor') {
                    this.options.remoteEventEmitter.emitToTab(
                        'newSummaryTokenEditor',
                        tab.id,
                        {
                            token: token,
                        },
                    )
                } else if (outputLocation === 'chapterSummary') {
                    this.options.remoteEventEmitter.emitToTab(
                        'newChapterSummaryToken',
                        tab.id,
                        {
                            token: token,
                            chapterSummaryIndex: chapterSummaryIndex,
                        },
                    )
                } else {
                    this.options.remoteEventEmitter.emitToTab(
                        'newSummaryToken',
                        tab.id,
                        {
                            token: token,
                        },
                    )
                }
            }
        }
    }

    isApiKeyValid: SummarizationInterface<'provider'>['isApiKeyValid'] = async (
        { tab },
        { apiKey },
    ) => {
        const isValid = await this.summarizationService.isApiKeyValid(apiKey)

        return { isValid }
    }

    setActiveSidebarTab: SummarizationInterface<
        'provider'
    >['setActiveSidebarTab'] = async ({ tab }, { activeTab }) => {
        this.options.remoteEventEmitter.emitToTab(
            'setActiveSidebarTab',
            tab.id,
            {
                activeTab: activeTab,
            },
        )
    }
}
