import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import { SocialSearchParams } from './types'
import { Tweet, SocialPage, User } from 'src/social-integration/types'
import {
    TWEETS_COLL,
    BMS_COLL,
    VISITS_COLL,
    TAGS_COLL,
} from 'src/social-integration/constants'
import { FilteredURLsManager } from 'src/search/search/filters'
import { FilteredURLs, PageResultsMap } from '..'

export class SocialSearchPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static SEARCH_OP_ID = 'memex:dexie.searchSocial'
    static MAP_URLS_OP_ID = 'memex:dexie.mapUrlsToSocialPages'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            SocialSearchPlugin.SEARCH_OP_ID,
            this.searchSocial.bind(this),
        )

        backend.registerOperation(
            SocialSearchPlugin.MAP_URLS_OP_ID,
            this.mapUrlsToSocialPages.bind(this),
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
            .table(TAGS_COLL)
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
            .table(TWEETS_COLL)
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
            .table(TWEETS_COLL)
            .where('url')
            .anyOf(urls)
            .each(socialPage => socialUrlMap.set(socialPage.url, socialPage))

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
            .table<Tweet>(TWEETS_COLL)
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
            .table(VISITS_COLL)
            .where('[createdAt+url]')
            .between(
                [new Date(startDate), ''],
                [new Date(endDate), String.fromCharCode(65535)],
                true,
                true,
            )
            .reverse()
            .until(() => latestVisits.size >= skip + limit)
            .each(({ createdAt, url }) => {
                if (!latestVisits.has(url) && filteredUrls.isAllowed(url)) {
                    latestVisits.set(url, createdAt.valueOf())
                }
            })

        const latestBookmarks: PageResultsMap = new Map()
        await this.backend.dexieInstance
            .table(BMS_COLL)
            .where('createdAt')
            .between(new Date(startDate), new Date(endDate), true, true)
            .reverse()
            .until(() => latestBookmarks.size >= skip + limit)
            .each(({ createdAt, url }) => {
                latestBookmarks.set(url, createdAt.valueOf())
            })

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
                .table(BMS_COLL)
                .where('createdAt')
                .belowOrEqual(upperBound)
                .reverse()
                .until(() => bms.size >= skip + limit)
                .each(({ createdAt, url }) => {
                    bms.set(url, createdAt)
                })

            if (bms.size < skip + limit) {
                bmsExhausted = true
            }

            await Promise.all(
                [...bms].map(async ([currentUrl, currentTime]) => {
                    if (currentTime > endDate || currentTime < startDate) {
                        let done = false
                        await this.backend.dexieInstance
                            .table(VISITS_COLL)
                            .where('url')
                            .equals(currentUrl)
                            .reverse()
                            .until(() => done)
                            .eachPrimaryKey(([createdAt]) => {
                                const visitTime = createdAt.valueOf()
                                if (
                                    visitTime >= startDate &&
                                    visitTime <= endDate
                                ) {
                                    bms.set(currentUrl, visitTime)
                                    done = true
                                }
                            })
                    }
                }),
            )

            upperBound = Math.min(...bms.values()) - 1

            results = new Map([
                ...results,
                ...[...bms].filter(
                    ([, createdAt]) =>
                        createdAt.valueOf() >= startDate &&
                        createdAt.valueOf() <= endDate,
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
            .table(BMS_COLL)
            .where('url')
            .anyOf(urls)
            .each(({ createdAt, url }) =>
                attemptAdd(latestBookmarks, bookmarksOnly)(
                    createdAt.valueOf(),
                    url,
                ),
            )

        const latestVisits: PageResultsMap = new Map()
        const urlsToCheck = bookmarksOnly ? [...latestBookmarks.keys()] : urls
        const doneFlags = urlsToCheck.map(url => false)

        const visitsPerPage = new Map<string, number[]>()

        const visits = await this.backend.dexieInstance
            .table(VISITS_COLL)
            .where('url')
            .anyOf(urlsToCheck)
            .reverse()
            .primaryKeys()

        visits.forEach(([createdAt, url]) => {
            const current = visitsPerPage.get(url) || []
            visitsPerPage.set(url, [...current, createdAt.valueOf()])
        })

        urlsToCheck.forEach((url, i) => {
            const currVisits = visitsPerPage.get(url) || []
            // `currVisits` array assumed sorted latest first
            currVisits.forEach(visit => {
                if (doneFlags[i]) {
                    return
                }

                doneFlags[i] = attemptAdd(latestVisits)(visit, url)
            })
        })

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

        const ids = [...urlScoresMap.entries()]
            .sort(([, a], [, b]) => b - a)
            .slice(params.skip, params.skip + params.limit)

        const pages: Map<string, SocialPage> = await this.mapUrlsToSocialPages(
            ids.map(([url]) => url),
        )

        return pages
    }
}
