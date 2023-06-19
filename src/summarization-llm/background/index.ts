import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { SummarizationService } from '@worldbrain/memex-common/lib/summarization/index'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { makeRemotelyCallable, RemoteFunction } from 'src/util/webextensionRPC'
import type { RemoteEventEmitter } from '../../util/webextensionRPC'

export interface SummarizationInterface<Role extends 'provider' | 'caller'> {
    startPageSummaryStream: RemoteFunction<
        Role,
        {
            fullPageUrl?: string
            textToProcess?: string
            queryPrompt?: string
            apiKey?: string
            shortSummary?: boolean
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
}

export default class SummarizeBackground {
    remoteFunctions: SummarizationInterface<'provider'>
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
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions, { insertExtraArg: true })
    }

    startPageSummaryStream: SummarizationInterface<
        'provider'
    >['startPageSummaryStream'] = async (
        { tab },
        { fullPageUrl, textToProcess, queryPrompt, apiKey, shortSummary },
    ) => {
        this.options.remoteEventEmitter.emitToTab('startSummaryStream', tab.id)

        for await (const result of this.summarizationService.queryAI(
            fullPageUrl,
            textToProcess,
            queryPrompt,
            apiKey,
            undefined,
            shortSummary,
        )) {
            const token = result?.t
            if (token?.length > 0) {
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

    getTextSummary: SummarizationInterface<
        'provider'
    >['getTextSummary'] = async ({ tab }, { text, prompt }) => {
        const summary = await this.summarizationService.summarizeText(
            text,
            prompt,
        )
        return summary
    }
}
