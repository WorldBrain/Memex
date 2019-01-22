import {
    PageSearchParams,
    AnnotSearchParams,
    AnnotPage,
    Searcher,
} from './types'

export class PageSearcher extends Searcher<PageSearchParams, AnnotPage> {
    private legacySearch

    private static shapePageSearchResults(results: any[]): AnnotPage[] {
        return results.map(res => ({
            ...res,
        }))
    }

    private static annotSearchToPageSearchParams = (
        params: AnnotSearchParams,
    ) => ({
        ...params,
    })

    constructor({ storageManager, legacySearch }) {
        super(storageManager)

        this.legacySearch = legacySearch
    }

    async search(params: AnnotSearchParams) {
        const pageSearchParams = PageSearcher.annotSearchToPageSearchParams(
            params,
        )
        const res = await this.legacySearch(pageSearchParams)
        return PageSearcher.shapePageSearchResults(res)
    }
}
