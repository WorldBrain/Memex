import debounce from 'lodash/fp/debounce'
import escapeHtml from 'lodash/fp/escape'

import { filterVisitsByQuery } from 'src/search'
import niceTime from 'src/util/nice-time'
import shortUrl from 'src/util/short-url'


const visitToSuggestion = doc => {
    const visitDate = escapeHtml(niceTime(doc.visitStart))
    const url = escapeHtml(shortUrl(doc.url))
    const title = escapeHtml(doc.page.title)
    const description
        = `<url>${url}</url> — ${title} <dim>(visited ${visitDate})</dim>`
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

    const visitsResult = await filterVisitsByQuery({query, limit: 5})
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
            description: 'Found these pages in your memory:',
        })
    }
    const suggestions = visitDocs.map(visitToSuggestion)

    suggest(suggestions)
    latestResolvedQuery = query
}

const acceptInput = (text, disposition) => {
    // TODO if text is not a suggested URL, open the overview with this query.
    switch (disposition) {
        case 'currentTab':
            browser.tabs.update({url: text})
            break
        case 'newForegroundTab':
            browser.tabs.create({url: text})
            break
        case 'newBackgroundTab':
            browser.tabs.create({url: text, active: false})
            break
    }
}

browser.omnibox.onInputChanged.addListener(debounce(500)(makeSuggestion))
browser.omnibox.onInputEntered.addListener(acceptInput)
