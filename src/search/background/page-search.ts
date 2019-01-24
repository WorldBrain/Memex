import {
    PageSearchParams,
    AnnotSearchParams,
    AnnotPage,
    Searcher,
} from './types'
import {
    StorageManager,
    SearchParams as OldSearchParams,
    SearchResult as OldSearchResult,
} from '../types'
import { Page } from '..'
import { pageToAnnotPage, reshapeParamsForOldSearch } from './utils'

export type Search = (
    params: OldSearchParams,
) => Promise<{
    ids: OldSearchResult[]
    totalCount: number
}>

export class PageSearcher extends Searcher<PageSearchParams, AnnotPage> {
    private legacySearch: Search
    private pagesColl: string

    constructor({
        storageManager,
        legacySearch,
        pagesColl,
    }: {
        storageManager: StorageManager
        legacySearch: Search
        pagesColl: string
    }) {
        super(storageManager)

        this.legacySearch = legacySearch
        this.pagesColl = pagesColl
    }

    private async mapResultsToPages(
        results: OldSearchResult[],
    ): Promise<AnnotPage[]> {
        const urls = results.map(([url]) => url)

        const pages = await this.storageManager
            .collection(this.pagesColl)
            .findObjects<Page>({
                url: { $in: urls },
            })

        // Re-order based on original results order
        const urlPageMap = new Map<string, AnnotPage>()

        pages.forEach(page => urlPageMap.set(page.url, pageToAnnotPage(page)))

        return results.map(([url]) => urlPageMap.get(url))
    }

    async search(params: AnnotSearchParams) {
        const searchParams = reshapeParamsForOldSearch(params)
        const { ids } = await this.legacySearch(searchParams)
        return this.mapResultsToPages(ids)
    }
}
