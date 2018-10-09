import { Searcher } from './searcher'
import { PageSearchParams, AnnotSearchParams, AnnotPage } from './types'
import {
    StorageManager,
    SearchParams as OldSearchParams,
    SearchResult as OldSearchResult,
} from '../types'
import { reshapeParamsForOldSearch } from './utils'

export type Search = (
    params: OldSearchParams,
) => Promise<{
    ids: OldSearchResult[]
    totalCount: number
}>

export class PageSearcher extends Searcher<PageSearchParams, AnnotPage> {
    private legacySearch: Search

    constructor({
        storageManager,
        legacySearch,
    }: {
        storageManager: StorageManager
        legacySearch: Search
    }) {
        super(storageManager)

        this.legacySearch = legacySearch
    }

    private async mapResultsToPages(
        results: OldSearchResult[],
    ): Promise<AnnotPage[]> {
        const pageUrls = new Set(results.map(([url]) => url))
        return this.findMatchingPages([...pageUrls])
    }

    async search(params: AnnotSearchParams) {
        const searchParams = reshapeParamsForOldSearch(params)
        const { ids } = await this.legacySearch(searchParams)
        return this.mapResultsToPages(ids)
    }
}
