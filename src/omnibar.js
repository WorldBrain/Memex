import debounce from 'lodash/fp/debounce'
import escapeHtml from 'lodash/fp/escape'
import tldjs from 'tldjs'
import queryString from 'query-string'

import { filterVisitsByQuery } from 'src/search'
import niceTime from 'src/util/nice-time'
import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter'


const shortUrl = (url, maxLength = 50) => {
    url = url.replace(/^https?:\/\//i, '')
    if (url.length > maxLength) { url = url.slice(0, maxLength - 3) + '...' }
    return url
}

const visitToSuggestion = doc => {
    const visitDate = decodeURIComponent('\uD83D\uDD52') + escapeHtml(niceTime(doc.visitStart))
    const url = escapeHtml(shortUrl(doc.url))
    const title = escapeHtml(doc.page.title)
    const description
        = `<url>${url}</url> — <dim> (${visitDate}) </dim> - ${title}`
    return ({
        content: doc.url,
        description: description.toString(),
    })
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
        description: 'Searching your memory..',
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
            description: 'No results found in your memory.',
        })
    } else {
        browser.omnibox.setDefaultSuggestion({
            description: 'Found these pages. Click here to show all results.',
        })
    }
    const suggestions = visitDocs.map(visitToSuggestion)

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
