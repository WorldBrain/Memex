import { StorageBackendPlugin } from '@worldbrain/storex'
import type { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import type { Page } from 'src/search/models'
import { reshapePageForDisplay } from './utils'
import type { AnnotPage } from './types'
import type { Annotation } from 'src/annotations/types'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { User, SocialPage } from 'src/social-integration/types'
import { USERS_COLL, BMS_COLL } from 'src/social-integration/constants'
import {
    buildPostUrlId,
    derivePostUrlIdProps,
    buildTweetUrl,
} from 'src/social-integration/util'
import type { AnnotationPrivacyLevel } from 'src/content-sharing/background/types'

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

    private encodeImage = (img: Blob) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = reject
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(img)
        })

    private async lookupPages(pageUrls: string[], pageMap: Map<string, Page>) {
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
                ? await this.encodeImage(page.screenshot)
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
    ) {
        // Find all assoc. fav-icons and create object URLs pointing to the Blobs
        const favIcons = await this.backend.dexieInstance
            .table('favIcons')
            .where('hostname')
            .anyOf(hostnames)
            .limit(hostnames.length)
            .toArray()

        for (const { favIcon, hostname } of favIcons) {
            if (!favIcon) {
                console.warn(
                    'found a favicon entry without favicon, hostname: ',
                    hostname,
                )
                continue
            }
            favIconMap.set(hostname, await this.encodeImage(favIcon))
        }
    }

    private async lookupUsers(userIds: number[], userMap: Map<number, User>) {
        const users = await this.backend.dexieInstance
            .table(USERS_COLL)
            .where('id')
            .anyOf(userIds)
            .limit(userIds.length)
            .toArray()

        for (const user of users) {
            const profilePic = user.profilePic
                ? await this.encodeImage(user.profilePic)
                : undefined

            userMap.set(user.id, {
                ...user,
                profilePic,
            })
        }
    }

    private async lookupLists(
        pageUrls: string[],
        listMap: Map<string, number[]>,
    ) {
        const listEntries = (await this.backend.dexieInstance
            .table('pageListEntries')
            .where('pageUrl')
            .anyOf(pageUrls)
            .primaryKeys()) as Array<[number, string]>

        for (const [listId, url] of listEntries) {
            const current = listMap.get(url) ?? []
            listMap.set(url, [...current, listId])
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

    private async lookupAnnots(
        pageUrls: string[],
        annotMap: Map<string, Annotation[]>,
    ) {
        const annotTagMap = new Map<string, string[]>()
        const annotListIdMap = new Map<string, number[]>()
        let relevantListIds = new Set<number>()
        const protectedAnnotUrlsSet = new Set<string>()
        const sharedAnnotUrlsSet = new Set<string>()

        const annots = (await this.backend.dexieInstance
            .table('annotations')
            .where('pageUrl')
            .anyOf(pageUrls)
            .toArray()) as Annotation[]

        const annotUrls = annots.map((annot) => annot.url)

        await this.backend.dexieInstance
            .table('tags')
            .where('url')
            .anyOf(annotUrls)
            .eachPrimaryKey(([name, url]: [string, string]) => {
                const prev = annotTagMap.get(url) ?? []
                annotTagMap.set(url, [...prev, name])
            })

        await this.backend.dexieInstance
            .table('annotListEntries')
            .where('url')
            .anyOf(annotUrls)
            .eachPrimaryKey(([id, url]: [number, string]) => {
                const prev = annotListIdMap.get(url) ?? []
                annotListIdMap.set(url, [...prev, id])
                relevantListIds.add(id)
            })

        await this.backend.dexieInstance
            .table('annotationPrivacyLevels')
            .where('annotation')
            .anyOf(annotUrls)
            .each(({ annotation, privacyLevel }: AnnotationPrivacyLevel) => {
                if (
                    [
                        AnnotationPrivacyLevels.PROTECTED,
                        AnnotationPrivacyLevels.SHARED_PROTECTED,
                    ].includes(privacyLevel)
                ) {
                    protectedAnnotUrlsSet.add(annotation)
                }
                if (
                    [
                        AnnotationPrivacyLevels.SHARED,
                        AnnotationPrivacyLevels.SHARED_PROTECTED,
                    ].includes(privacyLevel)
                ) {
                    sharedAnnotUrlsSet.add(annotation)
                }
            })

        annots.forEach((annot) => {
            const prev = annotMap.get(annot.pageUrl) ?? []
            annotMap.set(annot.pageUrl, [
                ...prev,
                {
                    ...annot,
                    tags: annotTagMap.get(annot.url) ?? [],
                    lists: annotListIdMap.get(annot.url) ?? [],
                    isShared: sharedAnnotUrlsSet.has(annot.url),
                    isBulkShareProtected: protectedAnnotUrlsSet.has(annot.url),
                },
            ])
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
        for (const [time, url] of visits as Array<[number, string]>) {
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
            upperTimeBound,
            latestTimes,
        }: {
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
        const listMap = new Map<string, number[]>()
        const annotMap = new Map<string, Annotation[]>()
        const timeMap = new Map<string, number>()
        const textMap = new Map<string, number>()

        // Run the first set of queries to get display data
        await Promise.all([
            this.lookupPages(pageUrls, pageMap),
            this.lookupTags(pageUrls, tagMap),
            this.lookupLists(pageUrls, listMap),
            this.lookupAnnots(pageUrls, annotMap),
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
            this.lookupFavIcons([...hostnames], favIconMap),
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
                    text: pageMap.get(url).text ?? '',
                    annotations: annotMap.get(url) ?? [],
                    annotsCount: annotMap.get(url)?.length,
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
            upperTimeBound,
            latestTimes,
        }: {
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
            this.lookupUsers([...userIds], userMap),
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
