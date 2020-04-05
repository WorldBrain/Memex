import { SyncPostReceiveProcessor } from '@worldbrain/storex-sync'
import { COLLECTION_NAMES as PAGES_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/pages/constants'

import { FetchPageProcessor } from 'src/page-analysis/background/types'
import { SharedSyncLogEntry } from '@worldbrain/storex-sync/lib/shared-sync-log/types'
import { PageFetchBacklogBackground } from 'src/page-fetch-backlog/background'
import { PageIndexingBackground } from 'src/page-indexing/background'

export class PostReceiveProcessor {
    constructor(
        private props: {
            pages: PageIndexingBackground
            fetchPageData: FetchPageProcessor
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

        return (
            data.value.fullUrl != null &&
            data.value.fullUrl.length &&
            (data.value.fullTitle == null || !data.value.fullTitle.length)
        )
    }

    processor: SyncPostReceiveProcessor = async ({ entry, ...params }) => {
        if (this.shouldPostProcess(entry)) {
            try {
                const pageData = await this.props.fetchPageData.process(
                    entry.data.value.fullUrl,
                )

                let value: any
                if (pageData.favIconURI) {
                    const { favIconURI, ...rest } = pageData

                    await this.props.pages.addFavIconIfNeeded(
                        pageData.url,
                        favIconURI,
                    )
                    value = rest
                } else {
                    value = pageData
                }

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
