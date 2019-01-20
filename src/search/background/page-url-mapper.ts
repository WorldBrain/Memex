import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import { Page } from 'src/search'
import { reshapePageForDisplay } from './utils'
import { AnnotPage } from './types'

export class PageUrlMapperPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static MAP_OP_ID = 'memex:dexie.mapUrlsToPages'

    private favIconMap: Map<string, string>
    private pageMap: Map<string, Page>
    private tagMap: Map<string, string[]>

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            PageUrlMapperPlugin.MAP_OP_ID,
            this.findMatchingPages.bind(this),
        )
    }

    private initState() {
        this.favIconMap = new Map()
        this.pageMap = new Map()
        this.tagMap = new Map()
    }

    private lookupPages(pageUrls: string[]) {
        return this.backend.dexieInstance
            .table('pages')
            .where('url')
            .anyOf(pageUrls)
            .each(page =>
                this.pageMap.set(page.url, {
                    ...page,
                    screenshot: page.screenshot
                        ? URL.createObjectURL(page.screenshot)
                        : undefined,
                    hasBookmark: false, // Set later, if needed
                } as any),
            )
    }

    private lookupFavIcons(hostnames: string[]) {
        // Find all assoc. fav-icons and create object URLs pointing to the Blobs
        return this.backend.dexieInstance
            .table('favIcons')
            .where('hostname')
            .anyOf(hostnames)
            .each(fav =>
                this.favIconMap.set(
                    fav.hostname,
                    URL.createObjectURL(fav.favIcon),
                ),
            )
    }

    private lookupBookmarks(pageUrls: string[]) {
        // Find all assoc. bookmarks and augment assoc. page in page map
        return this.backend.dexieInstance
            .table('bookmarks')
            .where('url')
            .anyOf(pageUrls)
            .eachPrimaryKey(url => {
                const page = this.pageMap.get(url)
                this.pageMap.set(url, { ...page, hasBookmark: true } as any)
            })
    }

    private lookupTags(pageUrls: string[]) {
        return this.backend.dexieInstance
            .table('tags')
            .where('url')
            .anyOf(pageUrls)
            .eachPrimaryKey(([name, url]) => {
                const tags = this.tagMap.get(url) || []
                this.tagMap.set(url, [...tags, name])
            })
    }

    /**
     * Goes through given input, finding all matching pages from the DB.
     * Then does further lookups to determine whether each matching page
     * has an associated bookmark and fav-icon.
     */
    private async findMatchingPages(pageUrls: string[]): Promise<AnnotPage[]> {
        this.initState()

        await this.lookupPages(pageUrls)

        const hostnames = new Set(
            [...this.pageMap.values()].map(page => page.hostname),
        )

        await Promise.all([
            this.lookupFavIcons([...hostnames]),
            this.lookupBookmarks(pageUrls),
            this.lookupTags(pageUrls),
        ])

        // Map page results back to original input
        const pageResults = pageUrls.map(url => {
            const page = this.pageMap.get(url)

            return {
                ...page,
                favIcon: this.favIconMap.get(page.hostname),
                tags: this.tagMap.get(url) || [],
            }
        })

        return pageResults.map(reshapePageForDisplay)
    }
}
