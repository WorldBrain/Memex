import debounce from 'lodash/fp/debounce'
import fromPairs from 'lodash/fp/fromPairs'
import escapeHtml from 'lodash/fp/escape'

import { filterVisitsByQuery } from 'src/search'
import niceTime from 'src/util/nice-time'

// Read which browser we are running in.
let browserName
;(async () => {
    const browserInfo = await browser.runtime.getBrowserInfo()
    browserName = browserInfo.name
})()

const visitToSuggestion = doc => {
    const visitDate = escapeHtml(niceTime(doc.visitStart))
    const url = escapeHtml(doc.url)
    const title = escapeHtml(doc.page.title)
    const plainDescription = `⌚ ${visitDate}  —  ${title}  —  ${url}`
    const markedUpDescription
        = `⌚ <dim>${visitDate}</dim>    —    ${title}  —  <url>${url}</url>`
    // Firefox interprets the description as plain text, so we distinguish here.
    const description = (browserName === 'Firefox')
        ? plainDescription
        : markedUpDescription
    return ({
        content: plainDescription,
        description,
    })
}

let suggestionToPageId = {}
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

    const visitsResult = await filterVisitsByQuery({query, limit: 5})
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
    const suggestions = visitDocs.map(visitToSuggestion)

    suggest(suggestions)

    suggestionToPageId = fromPairs(suggestions.map(
        (suggestion, i) => [suggestion.content, visitDocs[i].page._id]
    ))
    latestResolvedQuery = query
}

const acceptInput = (text, disposition) => {
    // The user has clicked a suggestion, or pressed enter.
    let url
    if (text in suggestionToPageId) {
        // Open the page chosen from the suggestions
        const pageId = suggestionToPageId[text]
        url = `/page-viewer/localpage.html?page=${encodeURIComponent(pageId)}`
    } else {
        // Treat input as search query, open the search
        url = `/overview/overview.html?q=${encodeURIComponent(text)}`
    }
    // Open it in the place the browser requests us to.
    switch (disposition) {
        case 'currentTab':
            browser.tabs.update({url})
            break
        case 'newForegroundTab':
            browser.tabs.create({url})
            break
        case 'newBackgroundTab':
            browser.tabs.create({url, active: false})
            break
    }
}

browser.omnibox.onInputChanged.addListener(debounce(500)(makeSuggestion))
browser.omnibox.onInputEntered.addListener(acceptInput)
