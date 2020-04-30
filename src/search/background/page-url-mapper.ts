import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import { Page } from 'src/search/models'
import { reshapePageForDisplay } from './utils'
import { AnnotPage } from './types'
import { User, SocialPage } from 'src/social-integration/types'
import { USERS_COLL, BMS_COLL } from 'src/social-integration/constants'
import {
    buildPostUrlId,
    derivePostUrlIdProps,
    buildTweetUrl,
} from 'src/social-integration/util'

export class PageUrlMapperPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static MAP_OP_ID = 'memex:dexie.mapUrlsToPages'
    static MAP_OP_SOCIAL_ID = 'memex:dexie.mapUrlsToSocial'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            PageUrlMapperPlugin.MAP_OP_ID,
            this.findMatchingPages.bind(this),
        )

        backend.registerOperation(
            PageUrlMapperPlugin.MAP_OP_SOCIAL_ID,
            this.findMatchingSocialPages.bind(this),
        )
    }

    private encodeImage = (img: Blob, base64Img?: boolean) =>
        new Promise<string>((resolve, reject) => {
            if (!base64Img) {
                return resolve(URL.createObjectURL(img))
            }

            const reader = new FileReader()
            reader.onerror = reject
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(img)
        })

    private async lookupPages(
        pageUrls: string[],
        pageMap: Map<string, Page>,
        base64Img?: boolean,
    ) {
        const pages = await this.backend.dexieInstance
            .table('pages')
            .where('url')
            .anyOf(pageUrls)
            .limit(pageUrls.length)
            .toArray()

        const bookmarks = new Set<string>()
        await this.backend.dexieInstance
            .table('bookmarks')
            .where('url')
            .anyOf(pageUrls)
            .limit(pageUrls.length)
            .each((bm) => bookmarks.add(bm.url))

        for (const page of pages) {
            const screenshot = page.screenshot
                ? await this.encodeImage(page.screenshot, base64Img)
                : undefined

            pageMap.set(page.url, {
                ...page,
                screenshot,
                hasBookmark: bookmarks.has(page.url),
            })
        }
    }

    private async lookupFavIcons(
        hostnames: string[],
        favIconMap: Map<string, string>,
        base64Img?: boolean,
    ) {
        // Find all assoc. fav-icons and create object URLs pointing to the Blobs
        const favIcons = await this.backend.dexieInstance
            .table('favIcons')
            .where('hostname')
            .anyOf(hostnames)
            .limit(hostnames.length)
            .toArray()

        for (const { favIcon, hostname } of favIcons) {
            favIconMap.set(hostname, await this.encodeImage(favIcon, base64Img))
        }
    }

    private async lookupUsers(
        userIds: number[],
        userMap: Map<number, User>,
        base64Img?: boolean,
    ) {
        const users = await this.backend.dexieInstance
            .table(USERS_COLL)
            .where('id')
            .anyOf(userIds)
            .limit(userIds.length)
            .toArray()

        for (const user of users) {
            const profilePic = user.profilePic
                ? await this.encodeImage(user.profilePic, base64Img)
                : undefined

            userMap.set(user.id, {
                ...user,
                profilePic,
            })
        }
    }

    private async lookupLists(
        pageUrls: string[],
        listMap: Map<string, string[]>,
    ) {
        const listEntries = (await this.backend.dexieInstance
            .table('pageListEntries')
            .where('pageUrl')
            .anyOf(pageUrls)
            .primaryKeys()) as Array<[number, string]>

        const listIds = new Set(listEntries.map(([listId]) => listId))
        const nameLookupById = new Map<number, string>()

        await this.backend.dexieInstance
            .table('customLists')
            .where('id')
            .anyOf([...listIds])
            .each(({ id, name }) => nameLookupById.set(id, name))

        for (const [listId, url] of listEntries) {
            const current = listMap.get(url) ?? []
            const listName = nameLookupById.get(listId)
            listMap.set(url, [...current, listName])
        }
    }

    private async lookupTags(
        pageUrls: string[],
        tagMap: Map<number | string, string[]>,
        isSocialSearch?: boolean,
    ) {
        const tags = await this.backend.dexieInstance
            .table('tags')
            .where('url')
            .anyOf(pageUrls)
            .primaryKeys()

        tags.forEach((pk) => {
            const [name, url] = pk as [string, string]
            let key: number | string

            if (isSocialSearch) {
                const { postId } = derivePostUrlIdProps({ url })
                key = postId
            } else {
                key = url
            }

            const current = tagMap.get(key) || []
            tagMap.set(key, [...current, name])
        })
    }

    private async lookupSocialBookmarks(
        postIds: number[],
        socialMap: Map<number, SocialPage>,
    ) {
        return this.backend.dexieInstance
            .table(BMS_COLL)
            .where('postId')
            .anyOf(postIds)
            .limit(postIds.length)
            .each(({ postId }) => {
                const page = socialMap.get(postId)
                socialMap.set(postId, { ...page, hasBookmark: true })
            })
    }

    private async lookupAnnotsCounts(
        pageUrls: string[],
        countMap: Map<number | string, number>,
        isSocialSearch?: boolean,
    ) {
        const annotUrls = (await this.backend.dexieInstance
            .table('annotations')
            .where('pageUrl')
            .anyOf(pageUrls)
            .keys()) as string[]

        annotUrls.forEach((url) => {
            let key: number | string

            if (isSocialSearch) {
                const { postId } = derivePostUrlIdProps({ url })
                key = postId
            } else {
                key = url
            }

            const count = countMap.get(key) || 0
            countMap.set(key, count + 1)
        })
    }

    private async lookupLatestTimes(
        pageUrls: string[],
        timeMap: Map<string, number>,
        pageMap: Map<string, Page>,
        upperTimeBound: number,
    ) {
        const visitQueryP = this.backend.dexieInstance
            .table('visits')
            .where('url')
            .anyOf(pageUrls)
            .primaryKeys()
        const bmQueryP = this.backend.dexieInstance
            .table('bookmarks')
            .where('url')
            .anyOf(pageUrls)
            .limit(pageUrls.length)
            .toArray()

        const [visits, bms] = await Promise.all([visitQueryP, bmQueryP])

        const visitMap = new Map<string, number>()
        for (const [time, url] of visits) {
            if (upperTimeBound && time > upperTimeBound) {
                continue
            }

            // For urls with lots of visits, IDB sorts them latest last
            visitMap.set(url, time)
        }

        const bookmarkMap = new Map<string, number>()
        for (const { time, url } of bms) {
            const page = pageMap.get(url)
            pageMap.set(url, { ...page, hasBookmark: true } as any)

            if (upperTimeBound && time > upperTimeBound) {
                continue
            }

            bookmarkMap.set(url, time)
        }

        for (const url of pageUrls) {
            const visit = visitMap.get(url)
            const bm = bookmarkMap.get(url)

            const max = !bm || bm < visit ? visit : bm
            timeMap.set(url, max)
        }
    }

    /**
     * Goes through given input, finding all matching pages from the DB.
     * Then does further lookups to determine whether each matching page
     * has an associated bookmark and fav-icon.
     */
    async findMatchingPages(
        pageUrls: string[],
        {
            base64Img,
            upperTimeBound,
            latestTimes,
        }: {
            base64Img?: boolean
            upperTimeBound?: number
            /**
             * If defined, it should be the same length as main input `pageUrls`, containing the latest times
             * to use for each result. This allows us to skip the lookup
             * (old page search involves this lookup already for scoring).
             */
            latestTimes?: number[]
        },
    ): Promise<AnnotPage[]> {
        if (!pageUrls.length) {
            return []
        }

        const favIconMap = new Map<string, string>()
        const pageMap = new Map<string, Page>()
        const tagMap = new Map<string, string[]>()
        const listMap = new Map<string, string[]>()
        const countMap = new Map<string, number>()
        const timeMap = new Map<string, number>()

        // Run the first set of queries to get display data
        await Promise.all([
            this.lookupPages(pageUrls, pageMap, base64Img),
            this.lookupTags(pageUrls, tagMap),
            this.lookupLists(pageUrls, listMap),
            this.lookupAnnotsCounts(pageUrls, countMap),
        ])

        const hostnames = new Set(
            [...pageMap.values()].map((page) => page.hostname),
        )

        // Run the subsequent set of queries that depend on earlier results
        await Promise.all([
            latestTimes
                ? Promise.resolve()
                : this.lookupLatestTimes(
                      pageUrls,
                      timeMap,
                      pageMap,
                      upperTimeBound,
                  ),
            this.lookupFavIcons([...hostnames], favIconMap, base64Img),
        ])

        // Map page results back to original input
        return pageUrls
            .map((url, i) => {
                const page = pageMap.get(url)

                // Data integrity issue; no matching page in the DB. Fail nicely
                if (!page || !page.url) {
                    return null
                }

                return {
                    ...page,
                    favIcon: favIconMap.get(page.hostname),
                    tags: tagMap.get(url) ?? [],
                    lists: listMap.get(url) ?? [],
                    annotsCount: countMap.get(url),
                    displayTime: latestTimes
                        ? latestTimes[i]
                        : timeMap.get(url),
                }
            })
            .filter((page) => page != null)
            .map(reshapePageForDisplay)
    }

    async findMatchingSocialPages(
        socialMap: Map<number, SocialPage>,
        {
            base64Img,
            upperTimeBound,
            latestTimes,
        }: {
            base64Img?: boolean
            upperTimeBound?: number
            latestTimes?: number[]
        },
    ): Promise<SocialPage[]> {
        const postIds = [...socialMap.keys()]
        const countMap = new Map<number, number>()
        const tagMap = new Map<number, string[]>()
        const userMap = new Map<number, User>()

        const postUrlIds = postIds.map((postId) => {
            const { url } = buildPostUrlId({ postId })
            return url
        })

        // Run the first set of queries to get display data
        await Promise.all([
            this.lookupTags(postUrlIds, tagMap, true),
            this.lookupAnnotsCounts(postUrlIds, countMap, true),
        ])

        const userIds = new Set(
            [...socialMap.values()].map((page) => page.userId),
        )

        await Promise.all([
            this.lookupUsers([...userIds], userMap, base64Img),
            this.lookupSocialBookmarks(postIds, socialMap),
        ])

        // Map page results back to original input
        return postIds
            .map((id, i) => {
                const socialPage = socialMap.get(id)

                // Data integrity issue; no matching page in the DB. Fail nicely
                if (!socialPage) {
                    return null
                }

                const user = userMap.get(socialPage.userId)
                const { url } = buildTweetUrl({
                    serviceId: socialPage.serviceId,
                    username: user.username,
                })

                return {
                    ...socialPage,
                    displayTime:
                        socialPage.createdAt instanceof Date
                            ? socialPage.createdAt.getTime()
                            : socialPage.createdAt,
                    tags: tagMap.get(id) || [],
                    annotsCount: countMap.get(id),
                    user,
                    url,
                }
            })
            .filter((page) => page !== null)
    }
}
