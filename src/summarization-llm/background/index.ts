import { SummarizationService } from '@worldbrain/memex-common/lib/summarization/index'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import type { RemoteEventEmitter } from '../../util/webextensionRPC'

export interface SummarizationInterface {
    startPageSummaryStream: (url: string) => Promise<void>
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
    // private service: SummarizationService
    remoteFunctions: SummarizationInterface

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
        url,
    ) => {
        const newSummary = new SummarizationService()
        console.log('triggered', url)
        const readableStream = await newSummary.summarizeUrl(url)

        const reader = readableStream.getReader()

        const readChunk = async () => {
            const { done, value } = await reader.read()
            if (done) {
                console.log('Finished reading the stream')
                return
            }
            //console.log('Received chunk:', value)
            // Do something with the chunk...
            // Read the next chunk:

            try {
                let JSONchunk = JSON.parse(value)
                let partialText = JSONchunk.t
                if (partialText != null && partialText.length > 0) {
                    this.options.remoteEventEmitter.emit('newSummaryChunk', {
                        chunk: partialText,
                    })
                }
            } catch (e) {
                console.log('fault:', value)
            }

            await readChunk()
        }

        await readChunk()
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
