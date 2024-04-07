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
import browser from 'webextension-polyfill'
import { COUNTER_STORAGE_KEY } from 'src/util/subscriptions/constants'
import { AIActionAllowed } from 'src/util/subscriptions/storage'

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
    getTextSummary: RemoteFunction<
        Role,
        {
            text: string
            prompt: string
        },
        | { status: 'success'; choices: { text: string }[] }
        | { status: 'prompt-too-long' }
        | { status: 'unknown-error' }
    >
}

export interface summarizePageBackgroundOptions {
    remoteEventEmitter: RemoteEventEmitter<'pageSummary'>
    analyticsBG?: AnalyticsCoreInterface
}

export default class SummarizeBackground {
    remoteFunctions: SummarizationInterface<'provider'>
    analyticsBG: AnalyticsCoreInterface

    private summarizationService = new SummarizationService({
        serviceURL:
            process.env.NODE_ENV === 'production'
                ? CLOUDFLARE_WORKER_URLS.production
                : CLOUDFLARE_WORKER_URLS.staging,
    })

    constructor(public options: summarizePageBackgroundOptions) {
        this.remoteFunctions = {
            startPageSummaryStream: this.startPageSummaryStream,
            getTextSummary: this.getTextSummary,
            isApiKeyValid: this.isApiKeyValid,
            setActiveSidebarTab: this.setActiveSidebarTab,
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions, { insertExtraArg: true })
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
        const isAllowed = await AIActionAllowed(
            this.analyticsBG,
            apiKey.length > 0 ? 'AIpowerupOwnKey' : 'AIpowerup',
            false,
        )

        if (!isAllowed) {
            return
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

    getTextSummary: SummarizationInterface<
        'provider'
    >['getTextSummary'] = async ({ tab }, { text, prompt }) => {
        const isAllowed = await AIActionAllowed(this.analyticsBG, 'AIpowerup')

        if (!isAllowed) {
            return
        }

        const summary = await this.summarizationService.summarizeText(
            text,
            prompt,
        )
        if (this.options.analyticsBG) {
            try {
                await trackQueryAI(this.options.analyticsBG)
            } catch (error) {
                console.error(`Error tracking space create event', ${error}`)
            }
        }

        return summary
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
