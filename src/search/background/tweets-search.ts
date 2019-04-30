import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import intersection from 'lodash/fp/intersection'

import { SocialSearchParams } from './types'
import { Tweet } from 'src/social-integration/types'
import TweetsStorage from 'src/social-integration/twitter/background/storage'

export class TweetsSearchPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static SEARCH_OP_ID = 'memex:dexie.searchTweets'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            TweetsSearchPlugin.SEARCH_OP_ID,
            this.searchTweets.bind(this),
        )
    }

    private async filterByBookmarks(urls: string[]) {
        return this.backend.dexieInstance
            .table<any, string>('bookmarks')
            .where('url')
            .anyOf(urls)
            .primaryKeys()
    }

    private async filterByTags(urls: string[], params: SocialSearchParams) {
        const tagsExc =
            params.tagsExc && params.tagsExc.length
                ? new Set(params.tagsExc)
                : null
        const tagsInc =
            params.tagsInc && params.tagsInc.length
                ? new Set(params.tagsInc)
                : null

        let tagsForUrls = new Map<string, string[]>()

        await this.backend.dexieInstance
            .table<any, [string, string]>(TweetsStorage.TAGS_COLL)
            .where('url')
            .anyOf(urls)
            .eachPrimaryKey(([tag, url]) => {
                const curr = tagsForUrls.get(url) || []
                tagsForUrls.set(url, [...curr, tag])
            })

        if (tagsExc) {
            tagsForUrls = new Map(
                [...tagsForUrls].filter(([, tags]) =>
                    tags.some(tag => !tagsExc.has(tag)),
                ),
            )
        }

        if (tagsInc) {
            tagsForUrls = new Map(
                [...tagsForUrls].filter(([, tags]) =>
                    tags.some(tag => tagsInc.has(tag)),
                ),
            )
        }

        return urls.filter(url => {
            if (!tagsInc) {
                // Make sure current url doesn't have any excluded tag
                const urlTags = tagsForUrls.get(url) || []
                return urlTags.some(tag => !tagsExc.has(tag))
            }

            return tagsForUrls.has(url)
        })
    }

    private async filterByUsers(
        urls: string[],
        { usersInc, usersExc }: SocialSearchParams,
    ) {
        const inc =
            usersInc && usersInc.length
                ? new Set(usersInc.map(user => user.username))
                : null
        const exc = new Set(usersExc.map(user => user.username))

        return urls.filter(url => {
            const username = url.split('/')[1]
            if (!inc) {
                return !exc.has(username)
            }

            return inc.has(username) && !exc.has(username)
        })
    }

    private async filterByCollections(
        urls: string[],
        params: SocialSearchParams,
    ) {
        const ids = params.collections.map(id => Number(id))

        const pageEntries = await this.backend.dexieInstance
            .table('pageListEntries')
            .where('listId')
            .anyOf(ids)
            .primaryKeys()

        const pageUrls = new Set(pageEntries.map(([, url]) => url))

        return intersection(urls, [...pageUrls])
    }

    private async mapUrlsToTweets(urls: string[]): Promise<Tweet[]> {
        const tweetUrlMap = new Map<string, Tweet>()

        await this.backend.dexieInstance
            .table(TweetsStorage.TWEETS_COLL)
            .where('url')
            .anyOf(urls)
            .each(tweet => tweetUrlMap.set(tweet.url, tweet))

        // Ensure original order of input is kept
        return urls.map(url => tweetUrlMap.get(url))
    }

    private async filterResults(results: string[], params: SocialSearchParams) {
        if (params.bookmarksOnly) {
            results = await this.filterByBookmarks(results)
        }

        if (
            (params.tagsInc && params.tagsInc.length) ||
            (params.tagsExc && params.tagsExc.length)
        ) {
            results = await this.filterByTags(results, params)
        }

        if (params.collections && params.collections.length) {
            results = await this.filterByCollections(results, params)
        }

        if (
            (params.usersInc && params.usersInc.length) ||
            (params.usersExc && params.usersExc.length)
        ) {
            results = await this.filterByUsers(results, params)
        }

        return results
    }

    private async queryTermsField(
        args: {
            field: string
            term: string
        },
        { startDate, endDate }: SocialSearchParams,
    ): Promise<string[]> {
        let coll = this.backend.dexieInstance
            .table<Tweet>(TweetsStorage.TWEETS_COLL)
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

    private async lookbackFromEndDate({
        startDate = 0,
        endDate = Date.now(),
        skip = 0,
        limit = 10,
    }: SocialSearchParams) {
        const latestVisits: Map<string, number> = new Map()

        await this.backend.dexieInstance
            .table(TweetsStorage.TWEETS_COLL)
            .where('url')
            .between('', String.fromCharCode(65535), true, true)
            .filter(
                tweet =>
                    tweet.createdWhen >= new Date(startDate || 0) &&
                    tweet.createdWhen <= new Date(endDate || Date.now()),
            )
            .reverse()
            .until(() => latestVisits.size >= skip + limit)
            .each(tweet => {
                if (!latestVisits.has(tweet.url)) {
                    latestVisits.set(tweet.url, tweet.createdWhen.getTime())
                }
            })

        const results: Map<string, number> = new Map()
        const addToMap = (time, url) => {
            const existing = results.get(url) || 0
            if (existing < time) {
                results.set(url, time)
            }
        }
        latestVisits.forEach(addToMap)

        return results
    }

    async searchTweets(params: SocialSearchParams) {
        let urlScoresMap: Map<string, number>
        let filteredResults

        if (!params.termsInc || !params.termsInc.length) {
            urlScoresMap = await this.lookbackFromEndDate(params)
            urlScoresMap = new Map(
                [...urlScoresMap.entries()].sort(([, a], [, b]) => b - a),
            )
            filteredResults = await this.filterResults(
                [...urlScoresMap.keys()],
                params,
            )
        } else {
            const termsSearchResults = await this.lookupTerms(params)
            filteredResults = await this.filterResults(
                termsSearchResults,
                params,
            )
        }

        const results = filteredResults.slice(
            params.skip,
            params.skip + params.limit,
        )

        return results
    }
}
