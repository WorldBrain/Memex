import debounce from 'lodash/fp/debounce'
import escapeHtml from 'lodash/fp/escape'
import tldjs from 'tldjs'
import queryString from 'query-string'
import moment from 'moment'

import shortUrl from 'src/util/short-url'
import { filterVisitsByQuery } from 'src/search/search-index'
import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter'


// Read which browser we are running in.
let browserName
;(async () => {
    // XXX Firefox seems the only one currently implementing this function, but
    // luckily that is enough for our current needs.
    if (browser.runtime.getBrowserInfo !== undefined) {
        const browserInfo = await browser.runtime.getBrowserInfo()
        browserName = browserInfo.name
    }
})()


const formatTime = (visitStart, showTime) => {
    const m = moment(visitStart)
    const inLastSevenDays = moment().diff(m, 'days') <= 7

    if (showTime) {
        return inLastSevenDays ? `🕒 ${m.format('HH:mm a ddd')}` : `🕒 ${m.format('HH:mm a D/M/YYYY')}`
    }
    return inLastSevenDays ? m.format('ddd') : m.format('D/M/YYYY')
}

const visitToSuggestion = timeFilterApplied => doc => {
    const url = escapeHtml(shortUrl(doc.url))
    const title = escapeHtml(doc.page.title)
    const time = formatTime(doc.visitStart, timeFilterApplied)

    return {
        content: doc.url,
        description: browserName === 'Firefox' ? `${url} ${title} - ${time}` : `<url>${url}</url> <dim>${title}</dim> - ${time}`,
    }
}

let currentQuery
let latestResolvedQuery
async function makeSuggestion(query, suggest) {
    currentQuery = query

    // Show no suggestions if there is no query.
    if (query.trim() === '') {
        browser.omnibox.setDefaultSuggestion({
            description: 'Type to search your memory.',
        })
        suggest([])
        latestResolvedQuery = query
        return
    }

    browser.omnibox.setDefaultSuggestion({
        description: 'Searching your memory.. (press enter to search deeper)',
    })

    const queryForOldSuggestions = latestResolvedQuery

    const {
        startDate,
        endDate,
        extractedQuery,
    } = extractTimeFiltersFromQuery(query)

    const visitsResult = await filterVisitsByQuery({
        query: extractedQuery,
        startDate,
        endDate,
        limit: 5,
    })
    const visitDocs = visitsResult.rows.map(row => row.doc)

    // A subsequent search could have already started and finished while we
    // were busy searching, so we ensure we do not overwrite its results.
    if (currentQuery !== query && latestResolvedQuery !== queryForOldSuggestions) { return }

    if (visitDocs.length === 0) {
        browser.omnibox.setDefaultSuggestion({
            description: 'No results found in your memory. (press enter to search deeper)',
        })
    } else {
        browser.omnibox.setDefaultSuggestion({
            description: `Found these ${visitDocs.length} pages in your memory: (press enter to search deeper)`,
        })
    }
    const suggestions = visitDocs.map(visitToSuggestion(startDate || endDate))

    suggest(suggestions)
    latestResolvedQuery = query
}

const acceptInput = (text, disposition) => {
    // Checks whether the text is a suggested url
    const validUrl = tldjs.isValid(text)
    const {
        startDate,
        endDate,
        extractedQuery,
    } = extractTimeFiltersFromQuery(text)

    const params = queryString.stringify({ query: extractedQuery, startDate, endDate })
    const overviewPageWithQuery = `/overview/overview.html?${params}`

    const goToUrl = validUrl ? text : overviewPageWithQuery

    switch (disposition) {
        case 'currentTab':
            browser.tabs.update({url: goToUrl})
            break
        case 'newForegroundTab':
            browser.tabs.create({url: goToUrl})
            break
        case 'newBackgroundTab':
            browser.tabs.create({url: goToUrl, active: false})
            break
    }
}

browser.omnibox.onInputChanged.addListener(debounce(500)(makeSuggestion))
browser.omnibox.onInputEntered.addListener(acceptInput)
