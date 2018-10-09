import { StorageManager, Page, FavIcon, Bookmark } from '..'
import { AnnotPage } from './types'

export abstract class Searcher<Params, Result> {
    static projectPageResults(results): AnnotPage[] {
        return results.map(page => ({
            url: page.url,
            title: page.fullTitle,
            hasBookmark: page.hasBookmark,
            screenshot: page.screenshot,
            favIcon: page.favIcon,
            annotations: [],
        }))
    }

    constructor(protected storageManager: StorageManager) {}

    /**
     * Goes through given input, finding all matching pages from the DB.
     * Then does further lookups to determine whether each matching page
     * has an associated bookmark and fav-icon.
     */
    protected async findMatchingPages(pageUrls: string[]) {
        const favIconMap = new Map<string, string>()
        const pageMap = new Map<string, Page>()

        await this.storageManager
            .collection('pages')
            .findObjects<Page>({ url: { $in: pageUrls } })
            .then(res =>
                res.forEach(page =>
                    pageMap.set(page.url, {
                        ...page,
                        screenshot: page.screenshot
                            ? URL.createObjectURL(page.screenshot)
                            : undefined,
                        hasBookmark: false, // Set later, if needed
                    } as any),
                ),
            )

        // Find all assoc. fav-icons and create object URLs
        const hostnames = new Set(
            [...pageMap.values()].map(page => page.hostname),
        )

        await this.storageManager
            .collection('favIcons')
            .findObjects<FavIcon>({ hostname: { $in: [...hostnames] } })
            .then(res =>
                res.forEach(fav =>
                    favIconMap.set(
                        fav.hostname,
                        URL.createObjectURL(fav.favIcon),
                    ),
                ),
            )

        // Find all assoc. bookmarks and augment assoc. page in page map
        await this.storageManager
            .collection('bookmarks')
            .findObjects<Bookmark>({ url: { $in: [...pageUrls] } })
            .then(res =>
                res.forEach(bm => {
                    const page = pageMap.get(bm.url)
                    pageMap.set(bm.url, { ...page, hasBookmark: true } as any)
                }),
            )

        // Map page results back to original input
        const pageResults = pageUrls.map(url => {
            const page = pageMap.get(url)

            return { ...page, favIcon: favIconMap.get(page.hostname) }
        })

        return Searcher.projectPageResults(pageResults)
    }

    abstract search(params: Params): Promise<Result[]>
}
