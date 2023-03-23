import { SummarizationService } from '@worldbrain/memex-common/lib/summarization/index'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import type { RemoteEventEmitter } from '../../util/webextensionRPC'

export interface SummarizationInterface {
    startPageSummaryStream: (fullPageUrl: string) => Promise<void>
    getTextSummary: (
        text: string,
        prompt: string,
    ) => Promise<
        | { status: 'success'; choices: { text: string }[] }
        | { status: 'prompt-too-long' }
        | { status: 'unknown-error' }
    >
}

export interface summarizePageBackgroundOptions {
    remoteEventEmitter: RemoteEventEmitter<'pageSummary'>
}

export default class SummarizeBackground {
    remoteFunctions: SummarizationInterface
    private summarizationService = new SummarizationService()

    constructor(public options: summarizePageBackgroundOptions) {
        this.remoteFunctions = {
            startPageSummaryStream: this.startPageSummaryStream,
            getTextSummary: this.getTextSummary,
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    startPageSummaryStream: SummarizationInterface['startPageSummaryStream'] = async (
        fullPageUrl,
    ) => {
        this.options.remoteEventEmitter.emit('startSummaryStream')

        for await (const result of this.summarizationService.summarizeUrl(
            fullPageUrl,
        )) {
            const token = result?.choices?.[0].delta?.content
            if (token?.length > 0) {
                this.options.remoteEventEmitter.emit('newSummaryToken', {
                    token: token,
                })
            }
        }
    }

    getTextSummary: SummarizationInterface['getTextSummary'] = async (
        text,
        prompt,
    ) => {
        const summary = await this.summarizationService.summarizeText(
            text,
            prompt,
        )
        return summary
    }
}
