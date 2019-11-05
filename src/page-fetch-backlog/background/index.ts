import Storex from '@worldbrain/storex'
import { RecurringTask } from '@worldbrain/storex-sync/lib/utils/recurring-task'

import {
    FetchPageDataProcessor,
    PageContent,
} from 'src/page-analysis/background/fetch-page-data-processor'
import { FetchPageDataError } from 'src/page-analysis/background/fetch-page-data-error'
import { PageFetchBacklogStorage } from './storage'
import { BacklogEntry, BacklogEntryCreateArgs } from './types'

export class PageFetchBacklogBackground {
    static DEF_PROCESSING_INTERVAL = 600000
    static DEF_RETRY_LIMIT = 5

    private storage: PageFetchBacklogStorage
    private recurringTask: RecurringTask

    constructor(
        private props: {
            storageManager: Storex
            fetchPageData: FetchPageDataProcessor
            storePageContent: (content: PageContent) => Promise<void>
            processingInterval?: number
            retryLimit?: number
        },
    ) {
        this.props.processingInterval =
            props.processingInterval ||
            PageFetchBacklogBackground.DEF_PROCESSING_INTERVAL

        this.props.retryLimit =
            props.retryLimit || PageFetchBacklogBackground.DEF_RETRY_LIMIT

        this.storage = new PageFetchBacklogStorage({
            storageManager: props.storageManager,
        })
    }

    setupBacklogProcessing() {
        if (this.recurringTask != null) {
            return
        }

        this.recurringTask = new RecurringTask(this.processEntry, {
            intervalInMs: this.props.processingInterval,
            onError: this.handleProcessingError,
        })
    }

    private async storeProcessedPageContent(content: PageContent) {
        return this.props.storePageContent(content)
    }

    private handleProcessingError = async (err: Error) => {
        // TODO: Think about this... we're already handling errors inside the recurring task
    }

    private processEntry = async () => {
        const backlogEntry = await this.dequeueEntry()

        if (
            backlogEntry === null ||
            backlogEntry.timesRetried >= this.props.retryLimit
        ) {
            return
        }

        try {
            const processedData = await this.props.fetchPageData.process(
                backlogEntry.url,
            )

            await this.storeProcessedPageContent(processedData)
        } catch (err) {
            // If the processing error is another temporary failure, put it back on the backlog
            if (err instanceof FetchPageDataError && err.isTempFailure) {
                await this.enqueueEntry({
                    ...backlogEntry,
                    timesRetried: backlogEntry.timesRetried + 1,
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
}
