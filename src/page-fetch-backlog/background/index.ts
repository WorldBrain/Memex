import Storex from '@worldbrain/storex'
import { RecurringTask } from '@worldbrain/storex-sync/lib/utils/recurring-task'

import {
    FetchPageProcessor,
    PageContent,
} from 'src/page-analysis/background/types'
import { ConnectivityCheckerBackground } from 'src/connectivity-checker/background'
import { FetchPageDataError } from 'src/page-analysis/background/fetch-page-data-error'
import { PageFetchBacklogStorage } from './storage'
import { BacklogEntry, BacklogEntryCreateArgs } from './types'

export class PageFetchBacklogBackground {
    static DEF_PROCESSING_INTERVAL = 300000
    static DEF_RETRY_LIMIT = 5
    static DEF_ENTRY_CHUNK = 5
    static DEF_RETRY_INTERVALS = [5, 15, 60, 180, 1440]

    storage: PageFetchBacklogStorage
    private recurringTask: RecurringTask
    private checkingConnection: Promise<void>

    constructor(
        private props: {
            storageManager: Storex
            fetchPageData: FetchPageProcessor
            storePageContent: (content: PageContent) => Promise<void>
            connectivityChecker: ConnectivityCheckerBackground
            retryIntervals?: number[]
            processingInterval?: number
            entryChunkSize?: number
            retryLimit?: number
        },
    ) {
        this.props.retryIntervals =
            props.retryIntervals ||
            PageFetchBacklogBackground.DEF_RETRY_INTERVALS

        this.props.processingInterval =
            props.processingInterval ||
            PageFetchBacklogBackground.DEF_PROCESSING_INTERVAL

        this.props.retryLimit =
            props.retryLimit || PageFetchBacklogBackground.DEF_RETRY_LIMIT

        this.props.entryChunkSize =
            props.entryChunkSize || PageFetchBacklogBackground.DEF_ENTRY_CHUNK

        this.storage = new PageFetchBacklogStorage({
            storageManager: props.storageManager,
        })
    }

    setupBacklogProcessing() {
        if (this.recurringTask != null) {
            return
        }

        this.recurringTask = new RecurringTask(this.processEntries, {
            intervalInMs: this.props.processingInterval,
            onError: this.handleProcessingError,
        })
    }

    async forceRun() {
        return this.processEntries()
    }

    private shouldRetry({ timesRetried, lastRetry }: BacklogEntry): boolean {
        if (timesRetried >= this.props.retryLimit) {
            return false
        }

        const nextRetry = new Date(
            lastRetry.getTime() +
                this.props.retryIntervals[timesRetried] * 60000,
        )
        if (nextRetry.getTime() > Date.now()) {
            return false
        }

        return true
    }

    private async storeProcessedPageContent(content: PageContent) {
        return this.props.storePageContent(content)
    }

    private handleProcessingError = async (err: Error) => {
        console.error('Page fetch backlog processing encountered an error:')
        console.error(err)
    }

    private async checkConnection() {
        if (this.checkingConnection) {
            return this.checkingConnection
        }

        this.checkingConnection = (async () => {
            await this.props.connectivityChecker.checkConnection()

            if (!this.props.connectivityChecker.isConnected) {
                this.recurringTask.stop()
                await this.props.connectivityChecker.waitUntilConnected()
                this.recurringTask['schedule']()
            }
        })()

        await this.checkingConnection
        this.checkingConnection = undefined
    }

    private processEntries = async () => {
        const backlogEntries = await this.dequeueEntries()

        if (backlogEntries == null) {
            return
        }

        await Promise.all(
            backlogEntries
                .filter(entry => this.shouldRetry(entry))
                .map(entry => this.processEntry(entry)),
        )
    }

    private async processEntry(entry: BacklogEntry) {
        try {
            const processedData = await this.props.fetchPageData.process(
                entry.url,
            )

            await this.storeProcessedPageContent(processedData)
        } catch (err) {
            await this.checkConnection()

            // If the processing error is another temporary failure, put it back on the backlog
            if (err instanceof FetchPageDataError && err.isTempFailure) {
                await this.enqueueEntry({
                    ...entry,
                    timesRetried: entry.timesRetried + 1,
                    lastRetry: new Date(),
                })
            }
        }
    }

    async enqueueEntry(backlogEntry: BacklogEntryCreateArgs): Promise<void> {
        return this.storage.createEntry(backlogEntry)
    }

    async dequeueEntry(): Promise<BacklogEntry | null> {
        return this.storage.removeOldestEntry()
    }

    async dequeueEntries(
        limit = this.props.entryChunkSize,
    ): Promise<BacklogEntry[] | null> {
        return this.storage.removeOldestEntries(limit)
    }
}
