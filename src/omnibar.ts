import debounce from 'lodash/fp/debounce'
import escapeHtml from 'lodash/fp/escape'
import urlRegex from 'url-regex'
import qs from 'query-string'
import type { Browser } from 'webextension-polyfill'
import shortUrl from 'src/util/short-url'
import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter'
import { OVERVIEW_URL } from './constants'
import checkBrowser from './util/check-browser'
import { conditionallySkipToTimeFilter } from './overview/onboarding/utils'
import {
    diffTimestamp,
    formatTimestamp,
} from '@worldbrain/memex-common/lib/utils/date-time'
import type { BackgroundModules } from './background-script/setup'

export interface OmnibarDeps {
    browserAPIs: Pick<Browser, 'tabs' | 'omnibox'>
    bgModules: Pick<BackgroundModules, 'search'>
}

function formatTime(timestamp, showTime) {
    const inLastSevenDays = diffTimestamp(Date.now(), timestamp, 'days') <= 7

    if (showTime) {
        return inLastSevenDays
            ? `🕒 ${formatTimestamp(timestamp, 'HH:mm a ddd')}`
            : `🕒 ${formatTimestamp(timestamp, 'HH:mm a D/M/YYYY')}`
    }
    return inLastSevenDays
        ? formatTimestamp(timestamp, 'ddd')
        : formatTimestamp(timestamp, 'D/M/YYYY')
}

const pageToSuggestion = (timeFilterApplied) => (doc) => {
    const url = escapeHtml(shortUrl(doc.url))
    const title = escapeHtml(doc.title)
    const time = formatTime(doc.displayTime, timeFilterApplied)

    return {
        content: doc.url,
        description:
            checkBrowser() === 'firefox'
                ? `${url} ${title} - ${time}`
                : `<url>${url}</url> <dim>${title}</dim> - ${time}`,
    }
}

export async function setupOmnibar(deps: OmnibarDeps) {
    const setOmniboxMessage = (description: string): void =>
        deps.browserAPIs.omnibox.setDefaultSuggestion({
            description,
        })

    let currentQuery: string
    let latestResolvedQuery: string
    async function makeSuggestion(
        query: string,
        suggest: (entries: any[]) => void,
    ) {
        currentQuery = query

        // Show no suggestions if there is no query.
        if (query.trim() === '') {
            setOmniboxMessage(
                'Enter keywords or start with # to filter by tags',
            )
            suggest([])
            latestResolvedQuery = query
            return
        }

        setOmniboxMessage('Searching...(press enter to search in Dashboard)')

        const queryForOldSuggestions = latestResolvedQuery

        const queryFilters = extractTimeFiltersFromQuery(query)
        const limit = 5

        const searchResults = await deps.bgModules.search.unifiedSearch({
            untilWhen: queryFilters.to,
            fromWhen: queryFilters.from,
            query: queryFilters.query,
            filterByDomains: [],
            filterByListIds: [],
            limit,
            skip: 0,
        })

        // A subsequent search could have already started and finished while we
        // were busy searching, so we ensure we do not overwrite its results.
        if (
            currentQuery !== query &&
            latestResolvedQuery !== queryForOldSuggestions
        ) {
            return
        }

        if (!searchResults.docs.length) {
            setOmniboxMessage('No results found for this query.')
        } else if (!searchResults.resultsExhausted) {
            setOmniboxMessage('Found more results - press ENTER to view ALL .')
        }

        const suggestions = searchResults.docs
            .slice(0, limit)
            .map(pageToSuggestion(queryFilters.from || queryFilters.to))

        suggest(suggestions)
        latestResolvedQuery = query
    }

    /**
     * @param {string} text The omnibar text input.
     * @returns {string} Overview page URL with `text` formatted as query string params.
     */
    const formOverviewQuery = (text) => {
        const queryFilters = extractTimeFiltersFromQuery(text)
        const queryParams = qs.stringify(queryFilters)

        return `${OVERVIEW_URL}?${queryParams}`
    }

    const acceptInput = async (text, disposition) => {
        // Either go to URL if input is valid URL, else form query for overview search using input terms
        const url = urlRegex().test(text) ? text : formOverviewQuery(text)

        // Skips to time filter in Onboarding Power Search workflow if user queries during demo
        await conditionallySkipToTimeFilter()

        switch (disposition) {
            case 'currentTab':
                deps.browserAPIs.tabs.update({
                    url,
                })
                break
            case 'newForegroundTab':
                deps.browserAPIs.tabs.create({
                    url,
                })
                break
            case 'newBackgroundTab':
                deps.browserAPIs.tabs.create({
                    url,
                    active: false,
                })
                break
            default:
                break
        }
    }

    deps.browserAPIs.omnibox.onInputChanged.addListener(
        debounce(500)(makeSuggestion),
    )
    deps.browserAPIs.omnibox.onInputEntered.addListener(acceptInput)
}
