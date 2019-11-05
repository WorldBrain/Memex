import {
    MemexContinuousSync,
    MemexContinuousSyncDependencies,
} from '@worldbrain/memex-common/lib/sync'
import { SyncPostReceiveProcessor } from '@worldbrain/storex-sync'

import { PostReceiveProcessor } from './post-receive-processor'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { FetchPageDataProcessor } from 'src/page-analysis/background/fetch-page-data-processor'
import pipeline from 'src/search/pipeline'
import { PageFetchBacklogBackground } from 'src/page-fetch-backlog/background'

export class MemexExtContinuousSync extends MemexContinuousSync {
    private postReceiveProcessor: PostReceiveProcessor

    constructor(
        options: MemexContinuousSyncDependencies & {
            pageFetchBacklog?: PageFetchBacklogBackground
        },
    ) {
        super(options)

        this.postReceiveProcessor = new PostReceiveProcessor({
            pageFetchBacklog: options.pageFetchBacklog,
            fetchPageData: new FetchPageDataProcessor({
                fetchPageData,
                pagePipeline: pipeline,
            }),
        })
    }

    getPostReceiveProcessor(): SyncPostReceiveProcessor {
        return this.postReceiveProcessor.processor
    }
}
