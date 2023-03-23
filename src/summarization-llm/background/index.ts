import { SummarizationService } from '@worldbrain/memex-common/lib/summarization/index'
import { makeRemotelyCallable, RemoteFunction } from 'src/util/webextensionRPC'
import type { RemoteEventEmitter } from '../../util/webextensionRPC'

export interface SummarizationInterface<Role extends 'provider' | 'caller'> {
    startPageSummaryStream: RemoteFunction<Role, { fullPageUrl: string }>
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
    private summarizationService = new SummarizationService()

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
    >['startPageSummaryStream'] = async ({ tab }, { fullPageUrl }) => {
        this.options.remoteEventEmitter.emitToTab('startSummaryStream', tab.id)

        for await (const result of this.summarizationService.summarizeUrl(
            fullPageUrl,
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
