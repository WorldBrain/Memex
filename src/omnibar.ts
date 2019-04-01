import debounce from 'lodash/fp/debounce'
import escapeHtml from 'lodash/fp/escape'
import urlRegex from 'url-regex'
import qs from 'query-string'
import moment from 'moment'

import analytics from 'src/analytics'
import internalAnalytics from 'src/analytics/internal'
import shortUrl from 'src/util/short-url'
import * as searchIndex from 'src/search'
import extractTimeFiltersFromQuery, {
    queryFiltersDisplay,
} from 'src/util/nlp-time-filter'
import { OVERVIEW_URL } from './constants'
import browserIsChrome from './util/check-browser'
import { EVENT_NAMES } from './analytics/internal/constants'
import { conditionallySkipToTimeFilter } from './overview/onboarding/utils'

// Read which browser we are running in.
let browserName
;(async () => {
    // XXX Firefox seems the only one currently implementing this function, but
    // luckily that is enough for our current needs.
    if (!browserIsChrome()) {
        const browserInfo = await window['browser'].runtime.getBrowserInfo()
        browserName = browserInfo.name
    }
})()

function formatTime(timestamp, showTime) {
    const m = moment(timestamp)
    const inLastSevenDays = moment().diff(m, 'days') <= 7

    if (showTime) {
        return inLastSevenDays
            ? `🕒 ${m.format('HH:mm a ddd')}`
            : `🕒 ${m.format('HH:mm a D/M/YYYY')}`
    }
    return inLastSevenDays ? m.format('ddd') : m.format('D/M/YYYY')
}

function setOmniboxMessage(text) {
    window['browser'].omnibox.setDefaultSuggestion({
        description: text,
    })
}

const pageToSuggestion = timeFilterApplied => doc => {
    const url = escapeHtml(shortUrl(doc.url))
    const title = escapeHtml(doc.title)
    const time = formatTime(doc.displayTime, timeFilterApplied)

    return {
        content: doc.url,
        description:
            browserName === 'Firefox'
                ? `${url} ${title} - ${time}`
                : `<url>${url}</url> <dim>${title}</dim> - ${time}`,
    }
}

let currentQuery
let latestResolvedQuery
async function makeSuggestion(query, suggest) {
    currentQuery = query

    // Show no suggestions if there is no query.
    if (query.trim() === '') {
        setOmniboxMessage('Enter keywords or start with # to filter by tags')
        suggest([])
        latestResolvedQuery = query
        return
    }

    setOmniboxMessage('Searching...(press enter to search in Dashboard)')

    const queryForOldSuggestions = latestResolvedQuery

    const queryFilters = extractTimeFiltersFromQuery(query)

    const searchResults = await (searchIndex.search(searchIndex.getDb) as any)({
        ...queryFilters,
        limit: 5,
    })

    analytics.trackEvent({
        category: 'Search',
        action:
            searchResults.totalCount > 0
                ? 'Successful omnibar search'
                : 'Unsuccessful omnibar search',
        name: queryFiltersDisplay(queryFilters),
        value: searchResults.totalCount,
    })

    internalAnalytics.processEvent({
        type:
            searchResults.totalCount > 0
                ? EVENT_NAMES.SUCCESSFUL_OMNIBAR_SEARCH
                : EVENT_NAMES.UNSUCCESSFUL_OMNIBAR_SEARCH,
    })

    // A subsequent search could have already started and finished while we
    // were busy searching, so we ensure we do not overwrite its results.
    if (
        currentQuery !== query &&
        latestResolvedQuery !== queryForOldSuggestions
    ) {
        return
    }

    if (searchResults.isBadTerm === true) {
        setOmniboxMessage(
            'Your search terms are very vague, please try and use more unique ones',
        )
    } else if (searchResults.requiresMigration) {
        setOmniboxMessage(
            '[ACTION REQUIRED] Upgrade to new search version. Click here.',
        )
    } else if (searchResults.docs.length === 0) {
        setOmniboxMessage('No results found for this query.')
    } else {
        setOmniboxMessage(
            `Found ${
                searchResults.totalCount
            } pages - press ENTER for ALL results`,
        )
    }

    const suggestions = searchResults.docs.map(
        pageToSuggestion(queryFilters.startDate || queryFilters.endDate),
    )

    suggest(suggestions)
    latestResolvedQuery = query
}

/**
 * @param {string} text The omnibar text input.
 * @returns {string} Overview page URL with `text` formatted as query string params.
 */
const formOverviewQuery = text => {
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
            window['browser'].tabs.update({
                url,
            })
            break
        case 'newForegroundTab':
            window['browser'].tabs.create({
                url,
            })
            break
        case 'newBackgroundTab':
            window['browser'].tabs.create({
                url,
                active: false,
            })
            break
        default:
            break
    }
}

window['browser'].omnibox.onInputChanged.addListener(
    debounce(500)(makeSuggestion),
)
window['browser'].omnibox.onInputEntered.addListener(acceptInput)
