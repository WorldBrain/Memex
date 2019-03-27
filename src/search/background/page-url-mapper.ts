import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import { Page } from 'src/search'
import { reshapePageForDisplay } from './utils'
import { AnnotPage } from './types'

export class PageUrlMapperPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static MAP_OP_ID = 'memex:dexie.mapUrlsToPages'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            PageUrlMapperPlugin.MAP_OP_ID,
            this.findMatchingPages.bind(this),
        )
    }

    private lookupPages(pageUrls: string[], pageMap: Map<string, Page>) {
        return this.backend.dexieInstance
            .table('pages')
            .where('url')
            .anyOf(pageUrls)
            .each(page =>
                pageMap.set(page.url, {
                    ...page,
                    screenshot: page.screenshot
                        ? URL.createObjectURL(page.screenshot)
                        : undefined,
                    hasBookmark: false, // Set later, if needed
                } as any),
            )
    }

    private lookupFavIcons(
        hostnames: string[],
        favIconMap: Map<string, string>,
    ) {
        // Find all assoc. fav-icons and create object URLs pointing to the Blobs
        return this.backend.dexieInstance
            .table('favIcons')
            .where('hostname')
            .anyOf(hostnames)
            .each(fav =>
                favIconMap.set(fav.hostname, URL.createObjectURL(fav.favIcon)),
            )
    }

    private lookupBookmarks(pageUrls: string[], pageMap: Map<string, Page>) {
        // Find all assoc. bookmarks and augment assoc. page in page map
        return this.backend.dexieInstance
            .table('bookmarks')
            .where('url')
            .anyOf(pageUrls)
            .eachPrimaryKey(url => {
                const page = pageMap.get(url)
                pageMap.set(url, { ...page, hasBookmark: true } as any)
            })
    }

    private lookupTags(pageUrls: string[], tagMap: Map<string, string[]>) {
        return this.backend.dexieInstance
            .table('tags')
            .where('url')
            .anyOf(pageUrls)
            .eachPrimaryKey(([name, url]) => {
                const tags = tagMap.get(url) || []
                tagMap.set(url, [...tags, name])
            })
    }

    private async lookupAnnotsCounts(
        pageUrls: string[],
        countMap: Map<string, number>,
    ) {
        for (const url of pageUrls) {
            const count = await this.backend.dexieInstance
                .table('annotations')
                .where('pageUrl')
                .equals(url)
                .count()

            countMap.set(url, count)
        }
    }

    /**
     * Goes through given input, finding all matching pages from the DB.
     * Then does further lookups to determine whether each matching page
     * has an associated bookmark and fav-icon.
     */
    private async findMatchingPages(pageUrls: string[]): Promise<AnnotPage[]> {
        const favIconMap = new Map<string, string>()
        const pageMap = new Map<string, Page>()
        const tagMap = new Map<string, string[]>()
        const countMap = new Map<string, number>()

        await this.lookupPages(pageUrls, pageMap)

        const hostnames = new Set(
            [...pageMap.values()].map(page => page.hostname),
        )

        await Promise.all([
            this.lookupFavIcons([...hostnames], favIconMap),
            this.lookupBookmarks(pageUrls, pageMap),
            this.lookupTags(pageUrls, tagMap),
            this.lookupAnnotsCounts(pageUrls, countMap),
        ])

        // Map page results back to original input
        const pageResults = pageUrls.map(url => {
            const page = pageMap.get(url)

            return {
                ...page,
                favIcon: favIconMap.get(page.hostname),
                tags: tagMap.get(url) || [],
                annotsCount: countMap.get(url),
            }
        })

        return pageResults.map(reshapePageForDisplay)
    }
}
