import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import { SocialSearchParams } from './types'
import { Tweet, SocialPage, User } from 'src/social-integration/types'
import {
    POSTS_COLL,
    BMS_COLL,
    TAGS_COLL,
    LIST_ENTRIES_COLL,
} from 'src/social-integration/constants'
import { derivePostUrlIdProps } from 'src/social-integration/util'
import { FilteredIDsManager } from 'src/search/search/filters'
import { FilteredIDs } from '..'

export class SocialSearchPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static SEARCH_OP_ID = 'memex:dexie.searchSocial'
    static MAP_POST_IDS_OP_ID = 'memex:dexie.mapIdsToSocialPages'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            SocialSearchPlugin.SEARCH_OP_ID,
            this.searchSocial.bind(this),
        )

        backend.registerOperation(
            SocialSearchPlugin.MAP_POST_IDS_OP_ID,
            this.mapIdsToSocialPages.bind(this),
        )
    }

    private async listSearch(lists: string[]): Promise<Set<number>> {
        if (!lists || !lists.length || !lists[0].length) {
            return undefined
        }

        const ids = new Set<number>()

        await this.backend.dexieInstance
            .table(LIST_ENTRIES_COLL)
            .where('listId')
            .equals(Number(lists[0]))
            .each(({ postId }) => ids.add(postId))

        return ids
    }

    private async tagSearch(tags: string[]): Promise<Set<number>> {
        if (!tags || !tags.length) {
            return undefined
        }

        const ids = new Set<number>()
        await this.backend.dexieInstance
            .table('tags')
            .where('name')
            .anyOf(tags)
            .eachPrimaryKey(pk => {
                const [, url] = pk as [void, string]
                const { postId } = derivePostUrlIdProps({ url })

                if (postId) {
                    ids.add(postId)
                }
            })

        return ids
    }

    private async socialTagSearch(tags: string[]): Promise<Set<number>> {
        if (!tags || !tags.length) {
            return undefined
        }

        const ids = new Set<number>()
        await this.backend.dexieInstance
            .table(TAGS_COLL)
            .where('name')
            .anyOf(tags)
            .each(({ postId }) => ids.add(postId))

        return ids as any
    }

    private async userSearch(users: User[]): Promise<Set<number>> {
        if (!users || !users.length) {
            return undefined
        }

        const userIds = users.map(user => user.id)

        const postIds = (await this.backend.dexieInstance
            .table(POSTS_COLL)
            .where('userId')
            .anyOf(userIds)
            .primaryKeys()) as number[]

        return new Set([...postIds])
    }

    private async findFilteredPosts(params: SocialSearchParams) {
        const [
            incTagUrls,
            excTagUrls,
            incUserUrls,
            excUserUrls,
            incHashtagUrls,
            excHashtagUrls,
            listUrls,
        ] = await Promise.all([
            this.tagSearch(params.tagsInc),
            this.tagSearch(params.tagsExc),
            this.userSearch(params.usersInc),
            this.userSearch(params.usersExc),
            this.socialTagSearch(params.hashtagsInc),
            this.socialTagSearch(params.hashtagsExc),
            this.listSearch(params.collections),
        ])

        return new FilteredIDsManager<number>({
            incTagUrls,
            excTagUrls,
            listUrls,
            incUserUrls,
            excUserUrls,
            incHashtagUrls,
            excHashtagUrls,
        })
    }

    async mapIdsToSocialPages(
        postIds: number[],
    ): Promise<Map<number, SocialPage>> {
        const socialPosts = new Map<number, SocialPage>()

        const results = new Map<number, SocialPage>()

        await this.backend.dexieInstance
            .table<Tweet>(POSTS_COLL)
            .where('id')
            .anyOf(postIds)
            .each(post => socialPosts.set(post.id, post))

        postIds.map(id => {
            const post = socialPosts.get(id)
            if (post !== undefined) {
                results.set(id, post)
            }
        })

        return results
    }

    private async queryTermsField(
        args: {
            field: string
            term: string
        },
        { startDate, endDate }: SocialSearchParams,
    ): Promise<number[]> {
        let coll = this.backend.dexieInstance
            .table<Tweet>(POSTS_COLL)
            .where(args.field)
            .equals(args.term)

        if (startDate || endDate) {
            coll = coll.filter(
                tweet =>
                    tweet.createdAt >= new Date(startDate || 0) &&
                    tweet.createdAt <= new Date(endDate || Date.now()),
            )
        }

        return coll.primaryKeys() as Promise<number[]>
    }

    private async lookupTerms({ termsInc, ...params }: SocialSearchParams) {
        const field = '_text_terms'

        const results = new Map<string, number[]>()

        // Run all needed queries for each term and on each field sequentially
        for (const term of termsInc) {
            const termRes = await this.queryTermsField({ field, term }, params)

            // Collect all results from each field for this term
            results.set(term, [...new Set([].concat(...termRes))])
        }

        // Get intersection of results for all terms (all terms must match)
        const intersected = [...results.values()].reduce((a, b) => {
            const bSet = new Set(b)
            return a.filter(res => bSet.has(res))
        })

        return intersected
    }

    private async lookbackFromEndDate(
        {
            startDate = 0,
            endDate = Date.now(),
            skip = 0,
            limit = 10,
        }: SocialSearchParams,
        filteredUrls: FilteredIDs<number>,
    ) {
        const latestVisits = new Map<number, number>()

        await this.backend.dexieInstance
            .table(POSTS_COLL)
            .where('createdAt')
            .between(new Date(startDate), new Date(endDate), true, true)
            .reverse()
            .until(() => latestVisits.size >= skip + limit)
            .each(({ createdAt, id }) => {
                if (
                    !latestVisits.has(id) &&
                    filteredUrls.isAllowed(id.toString())
                ) {
                    latestVisits.set(id, createdAt.valueOf())
                }
            })

        const latestBookmarks = new Map<number, number>()
        await this.backend.dexieInstance
            .table(BMS_COLL)
            .where('createdAt')
            .between(new Date(startDate), new Date(endDate), true, true)
            .reverse()
            .until(() => latestBookmarks.size >= skip + limit)
            .each(({ createdAt, postId }) => {
                latestBookmarks.set(postId, createdAt.valueOf())
            })

        const results = new Map<number, number>()
        const addToMap = (time: number, id: number) => {
            const existing = results.get(id) || 0
            if (existing < time) {
                results.set(id, time)
            }
        }
        latestVisits.forEach(addToMap)
        latestBookmarks.forEach(addToMap)

        return results
    }

    private async lookbackBookmarksTime({
        startDate = 0,
        endDate = Date.now(),
        skip = 0,
        limit = 10,
    }: Partial<SocialSearchParams>) {
        let bmsExhausted = false
        let results = new Map<number, number>()
        let upperBound = new Date()

        while (results.size < skip + limit && !bmsExhausted) {
            const bms = new Map<number, number>()

            await this.backend.dexieInstance
                .table(BMS_COLL)
                .where('createdAt')
                .belowOrEqual(upperBound)
                .reverse()
                .until(() => bms.size >= skip + limit)
                .each(({ createdAt, postId }) => {
                    bms.set(postId, createdAt.valueOf())
                })

            if (bms.size < skip + limit) {
                bmsExhausted = true
            }

            upperBound = new Date(Math.min(...bms.values()) - 1)

            results = new Map([
                ...results,
                ...[...bms].filter(
                    ([, createdAt]) =>
                        createdAt >= startDate && createdAt <= endDate,
                ),
            ])
        }

        return results
    }

    private async mapUrlsToLatestEvents(
        { endDate, startDate, bookmarksOnly }: Partial<SocialSearchParams>,
        postIds: number[],
    ): Promise<Map<number, number>> {
        function attemptAdd(
            idTimeMap: Map<number, number>,
            skipDateCheck = false,
        ) {
            return (time: number, id: number) => {
                const existing = idTimeMap.get(id) || 0

                if (
                    existing > time ||
                    (!skipDateCheck && endDate != null && endDate < time) ||
                    (!skipDateCheck && startDate != null && startDate > time)
                ) {
                    return false
                }

                idTimeMap.set(id, time)
                return true
            }
        }

        const latestBookmarks = new Map<number, number>()
        await this.backend.dexieInstance
            .table(BMS_COLL)
            .where('postId')
            .anyOf(postIds)
            .each(({ createdAt, postId }) =>
                attemptAdd(latestBookmarks, bookmarksOnly)(
                    createdAt.valueOf(),
                    postId,
                ),
            )

        const latestVisits = new Map<number, number>()
        const idsToCheck = bookmarksOnly ? [...latestBookmarks.keys()] : postIds
        const doneFlags = idsToCheck.map(url => false)

        const visitsPerPage = new Map<number, number[]>()

        await this.backend.dexieInstance
            .table(POSTS_COLL)
            .where('id')
            .anyOf(idsToCheck)
            .reverse()
            .each(({ createdAt, id }) => {
                const current = visitsPerPage.get(id) || []
                visitsPerPage.set(id, [...current, createdAt.valueOf()])
            })

        idsToCheck.forEach((postId, i) => {
            const currVisits = visitsPerPage.get(postId) || []
            // `currVisits` array assumed sorted latest first
            currVisits.forEach(visit => {
                if (doneFlags[i]) {
                    return
                }

                doneFlags[i] = attemptAdd(latestVisits)(visit, postId)
            })
        })

        const latestEvents = new Map<number, number>()
        latestVisits.forEach(attemptAdd(latestEvents))
        latestBookmarks.forEach(attemptAdd(latestEvents))

        return latestEvents
    }

    private async groupLatestEventsByUrl(
        params: SocialSearchParams,
        filteredUrls: FilteredIDs<number>,
    ): Promise<Map<number, number>> {
        return params.bookmarksOnly
            ? this.lookbackBookmarksTime(params)
            : this.lookbackFromEndDate(params, filteredUrls)
    }

    async searchSocial(
        params: SocialSearchParams,
    ): Promise<Map<number, SocialPage>> {
        let postScoresMap: Map<number, number>
        const filteredPosts = await this.findFilteredPosts(params)

        if (
            (!params.termsInc || !params.termsInc.length) &&
            filteredPosts.isDataFiltered
        ) {
            postScoresMap = await this.mapUrlsToLatestEvents(
                params,
                [...filteredPosts.include].map(id => Number(id)),
            )
        } else if (!params.termsInc || !params.termsInc.length) {
            postScoresMap = await this.groupLatestEventsByUrl(
                params,
                filteredPosts,
            )
        } else {
            const termsSearchResults = await this.lookupTerms(params)
            const filteredResults = termsSearchResults.filter(id =>
                filteredPosts.isAllowed(id),
            )
            postScoresMap = await this.mapUrlsToLatestEvents(
                params,
                filteredResults,
            )
        }

        const ids = [...postScoresMap.entries()]
            .sort(([, a], [, b]) => b - a)
            .slice(params.skip, params.skip + params.limit)

        const pages = await this.mapIdsToSocialPages(
            ids.map(([postId]) => postId),
        )

        return pages
    }
}
