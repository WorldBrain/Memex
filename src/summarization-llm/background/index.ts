import { SummarizationService } from '@worldbrain/memex-common/lib/summarization/index'
import * as Raven from 'src/util/raven'

import type { AuthServices, Services } from 'src/services/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import type { SyncSettingsStore } from 'src/sync-settings/util'

export interface SummarizationInterface {
    getPageSummary: (
        url,
    ) => Promise<
        | { status: 'success'; choices: { text: string }[] }
        | { status: 'prompt-too-long' }
        | { status: 'unknown-error' }
    >
    getTextSummary: (
        text,
        prompt,
    ) => Promise<
        | { status: 'success'; choices: { text: string }[] }
        | { status: 'prompt-too-long' }
        | { status: 'unknown-error' }
    >
}

export default class SummarizeBackground {
    // private service: SummarizationService
    remoteFunctions: SummarizationInterface

    constructor() {
        // }, //     syncSettings: SyncSettingsStore<'activityIndicator'> //     servicesPromise: Promise<Pick<Services, 'activityStreams'>> //     authServices: Pick<AuthServices, 'auth'> // private options: {
        // options.servicesPromise.then((services) => {
        //     this.service = new SummarizationService()
        // })
        this.remoteFunctions = {
            getPageSummary: (url) => this.getPageSummary(url),
            getTextSummary: (text, prompt) => this.getTextSummary(text, prompt),
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    getPageSummary: SummarizationInterface['getPageSummary'] = async (url) => {
        let newSummary = new SummarizationService()
        let summary = await newSummary.summarizeUrl(url)
        return summary
    }
    getTextSummary: SummarizationInterface['getTextSummary'] = async (
        text,
        prompt,
    ) => {
        let newSummary = new SummarizationService()
        let summary = await newSummary.summarizeText(text, prompt)
        return summary
    }
}
