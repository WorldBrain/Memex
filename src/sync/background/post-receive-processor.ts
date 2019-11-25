import { SyncPostReceiveProcessor } from '@worldbrain/storex-sync'
import { COLLECTION_NAMES as PAGES_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/pages/constants'

import { FetchPageDataProcessor } from 'src/page-analysis/background/fetch-page-data-processor'
import { SharedSyncLogEntry } from '@worldbrain/storex-sync/lib/shared-sync-log/types'
import { PageFetchBacklogBackground } from 'src/page-fetch-backlog/background'

export class PostReceiveProcessor {
    constructor(
        private props: {
            fetchPageData: FetchPageDataProcessor
            pageFetchBacklog?: PageFetchBacklogBackground
        },
    ) {}

    private async handleFailure(
        entry: SharedSyncLogEntry<'deserialized-data'>,
    ) {
        if (this.props.pageFetchBacklog) {
            await this.props.pageFetchBacklog.enqueueEntry({
                url: entry.data.pk,
            })
        }
    }

    private shouldPostProcess({
        data,
    }: SharedSyncLogEntry<'deserialized-data'>): boolean {
        if (
            data.collection !== PAGES_COLLECTION_NAMES.page ||
            data.operation !== 'create'
        ) {
            return false
        }

        return data.value.fullTitle == null || !data.value.fullTitle.length
    }

    processor: SyncPostReceiveProcessor = async ({ entry, ...params }) => {
        if (this.shouldPostProcess(entry)) {
            try {
                const value = await this.props.fetchPageData.process(
                    entry.data.pk,
                )

                return {
                    entry: { ...entry, data: { ...entry.data, value } },
                    ...params,
                }
            } catch (err) {
                await this.handleFailure(entry)

                // On any errors that bubble up to this stage, set the entry to `null` to filter it out of sync
                return { entry: null, ...params }
            }
        }

        return { entry, ...params }
    }
}
