import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import intersection from 'lodash/fp/intersection'

import { SocialSearchParams } from './types'
import { Tweet, SocialPage, User } from 'src/social-integration/types'
import SocialStorage from 'src/social-integration/background/storage'
import { FilteredURLsManager } from 'src/search/search/filters'
import { FilteredURLs, PageResultsMap } from '..'

export class SocialSearchPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static SEARCH_OP_ID = 'memex:dexie.searchSocial'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            SocialSearchPlugin.SEARCH_OP_ID,
            this.searchSocial.bind(this),
        )
    }

    private async listSearch(lists: string[]) {
        if (!lists || !lists.length || !lists[0].length) {
            return undefined
        }

        const urls = new Set<string>()

        const listEntries = await this.backend.dexieInstance
            .table('pageListEntries')
            .where('listId')
            .equals(Number(lists[0]))
            .toArray()

        listEntries.forEach(({ pageUrl }: any) => urls.add(pageUrl))

        return urls
    }

    private async tagSearch(tags: string[]) {
        if (!tags || !tags.length) {
            return undefined
        }

        const urls = new Set<string>()
        await this.backend.dexieInstance
            .table('tags')
            .where('name')
            .anyOf(tags)
            .eachPrimaryKey(([name, url]) => urls.add(url))

        return urls
    }

    private async userSearch(users: User[]) {
        if (!users || !users.length) {
            return undefined
        }

        const userIds = users.map(user => user.id)

        const urls = await this.backend.dexieInstance
            .table('tweets')
            .where('userId')
            .anyOf(userIds)
            .primaryKeys()

        return new Set<string>([...urls])
    }

    private async findFilteredUrls(params: SocialSearchParams) {
        const [
            incTagUrls,
            excTagUrls,
            incUserUrls,
            excUserUrls,
            listUrls,
        ] = await Promise.all([
            this.tagSearch(params.tagsInc),
            this.tagSearch(params.tagsExc),
            this.userSearch(params.usersInc),
            this.userSearch(params.usersExc),
            this.listSearch(params.collections),
        ])

        return new FilteredURLsManager({
            incDomainUrls: undefined,
            excDomainUrls: undefined,
            incTagUrls,
            excTagUrls,
            listUrls,
            incUserUrls,
            excUserUrls,
        })
    }

    private async mapUrlsToSocialPages(
        urls: string[],
    ): Promise<Map<string, SocialPage>> {
        const socialUrlMap = new Map<string, SocialPage>()

        await this.backend.dexieInstance
            .table(SocialStorage.TWEETS_COLL)
            .where('url')
            .anyOf(urls)
            .each(socialPage => socialUrlMap.set(socialPage.url, socialPage))

        // Ensure original order of input is kept
        const pageMap = new Map<string, SocialPage>()
        urls.map(url => {
            const socialPage = socialUrlMap.get(url)
            if (socialPage !== undefined) {
                pageMap.set(url, socialPage)
            }
        })

        return pageMap
    }

    private async queryTermsField(
        args: {
            field: string
            term: string
        },
        { startDate, endDate }: SocialSearchParams,
    ): Promise<string[]> {
        let coll = this.backend.dexieInstance
            .table<Tweet>(SocialStorage.TWEETS_COLL)
            .where(args.field)
            .equals(args.term)

        if (startDate || endDate) {
            coll = coll.filter(
                tweet =>
                    tweet.createdWhen >= new Date(startDate || 0) &&
                    tweet.createdWhen <= new Date(endDate || Date.now()),
            )
        }

        return coll.primaryKeys()
    }

    private async lookupTerms({ termsInc, ...params }: SocialSearchParams) {
        const field = '_text_terms'

        const results = new Map<string, string[]>()

        // Run all needed queries for each term and on each field concurrently
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
        filteredUrls: FilteredURLs,
    ) {
        const latestVisits: PageResultsMap = new Map()

        await this.backend.dexieInstance
            .table(SocialStorage.TWEETS_COLL)
            .where('url')
            .between('', String.fromCharCode(65535), true, true)
            .each(tweet => {
                if (
                    !latestVisits.has(tweet.url) &&
                    filteredUrls.isAllowed(tweet.url) &&
                    tweet.createdWhen >= new Date(startDate) &&
                    tweet.createdWhen <= new Date(endDate)
                ) {
                    latestVisits.set(tweet.url, tweet.createdWhen.getTime())
                }
            })

        const latestBookmarks: PageResultsMap = new Map()
        await this.backend.dexieInstance
            .table('bookmarks')
            .where('time')
            .between(startDate, endDate, true, true)
            .reverse()
            .until(() => latestBookmarks.size >= skip + limit)
            .each(({ time, url }) => latestBookmarks.set(url, time))

        const results: Map<string, number> = new Map()
        const addToMap = (time, url) => {
            const existing = results.get(url) || 0
            if (existing < time) {
                results.set(url, time)
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
        let results: PageResultsMap = new Map()
        let upperBound = Date.now()

        while (results.size < skip + limit && !bmsExhausted) {
            const bms: PageResultsMap = new Map()

            await this.backend.dexieInstance
                .table('bookmarks')
                .where('time')
                .belowOrEqual(upperBound)
                .reverse()
                .until(() => bms.size >= skip + limit)
                .each(({ time, url }) => bms.set(url, time))

            if (bms.size < skip + limit) {
                bmsExhausted = true
            }

            upperBound = Math.min(...bms.values()) - 1

            results = new Map([
                ...results,
                ...[...bms].filter(
                    ([, time]) => time >= startDate && time <= endDate,
                ),
            ])
        }

        return results
    }

    private async mapUrlsToLatestEvents(
        { endDate, startDate, bookmarksOnly }: Partial<SocialSearchParams>,
        urls: string[],
    ) {
        function attemptAdd(urlTimeMap: PageResultsMap, skipDateCheck = false) {
            return (time: number, url: string) => {
                const existing = urlTimeMap.get(url) || 0

                if (
                    existing > time ||
                    (!skipDateCheck && endDate != null && endDate < time) ||
                    (!skipDateCheck && startDate != null && startDate > time)
                ) {
                    return false
                }

                urlTimeMap.set(url, time)
                return true
            }
        }

        const latestBookmarks: PageResultsMap = new Map()
        await this.backend.dexieInstance
            .table('bookmarks')
            .where('url')
            .anyOf(urls)
            .each(({ time, url }) =>
                attemptAdd(latestBookmarks, bookmarksOnly)(time, url),
            )

        const latestVisits: PageResultsMap = new Map()
        const urlsToCheck = bookmarksOnly ? [...latestBookmarks.keys()] : urls

        const visitsPerPage = new Map<string, number>()

        await this.backend.dexieInstance
            .table(SocialStorage.TWEETS_COLL)
            .where('url')
            .anyOf(urlsToCheck)
            .each(tweet =>
                latestVisits.set(tweet.url, tweet.createdWhen.getTime()),
            )

        const latestEvents: PageResultsMap = new Map()
        latestVisits.forEach(attemptAdd(latestEvents))
        latestBookmarks.forEach(attemptAdd(latestEvents))

        return latestEvents
    }

    private async groupLatestEventsByUrl(
        params: SocialSearchParams,
        filteredUrls: FilteredURLs,
    ) {
        return params.bookmarksOnly
            ? this.lookbackBookmarksTime(params)
            : this.lookbackFromEndDate(params, filteredUrls)
    }

    private async paginate(
        results: string[],
        { skip, limit }: SocialSearchParams,
    ) {
        const internalPageSize = limit * 2
        const socialPages = new Map<string, SocialPage>()
        const seenPages = new Set<string>()
        let internalSkip = 0

        while (socialPages.size < limit) {
            const resSlice = results.slice(
                internalSkip,
                internalSkip + internalPageSize,
            )

            if (!resSlice.length) {
                break
            }

            const pages = await this.mapUrlsToSocialPages(resSlice)

            pages.forEach(page => {
                seenPages.add(page.url)
                if (socialPages.size !== limit && seenPages.size > skip) {
                    socialPages.set(page.url, page)
                }
            })

            internalSkip += internalPageSize
        }

        return socialPages
    }

    async searchSocial(
        params: SocialSearchParams,
    ): Promise<Map<string, SocialPage>> {
        let urlScoresMap: PageResultsMap
        const filteredUrls = await this.findFilteredUrls(params)

        if (
            (!params.termsInc || !params.termsInc.length) &&
            filteredUrls.isDataFiltered
        ) {
            urlScoresMap = await this.mapUrlsToLatestEvents(params, [
                ...filteredUrls.include,
            ])
        } else if (!params.termsInc || !params.termsInc.length) {
            urlScoresMap = await this.groupLatestEventsByUrl(
                params,
                filteredUrls,
            )
        } else {
            const termsSearchResults = await this.lookupTerms(params)
            const fileredResults = termsSearchResults.filter(url =>
                filteredUrls.isAllowed(url),
            )
            urlScoresMap = await this.mapUrlsToLatestEvents(
                params,
                fileredResults,
            )
        }

        urlScoresMap = new Map(
            [...urlScoresMap.entries()].sort(([, a], [, b]) => b - a),
        )

        const pages: Map<string, SocialPage> = await this.paginate(
            [...urlScoresMap.keys()],
            params,
        )

        return pages
    }
}
