import { filterVisitsByQuery } from './search'
import niceTime from './util/nice-time'

const visitToSuggestion = (result) => {
            let doc = result.doc
            let content = doc.url
            let title = ''
            let visitDate = niceTime(doc.visitStart)
            let url = "<url>" + (content.slice(0,30)) + "</url>"
            if(content.length > 30) {
                url+= '...'
            }
            title = "<match>" + escape(doc.page.title) + "</match>"
            title = title.replace(/%20|%2C|%3A|%3F|%B7|%23|%26/gi, matched => ' ')
            let description = `${url} ${(visitDate)}  ${title}`
            return ({
                content,
                description
            })
        }

const makeSuggestion = (query, suggest) => {
    browser.omnibox.setDefaultSuggestion({description: 'Searching'})
    filterVisitsByQuery({query, limit: 5}).then(searchResult => {
        if(searchResult.rows.length === 0) {
            browser.omnibox.setDefaultSuggestion({description: 'No results found'})
        } else {
            browser.omnibox.setDefaultSuggestion({description: 'Found these pages in your memory'})
        }
        const suggestions = searchResult.rows.map(visitToSuggestion)
        suggest(suggestions)
    })
}

const acceptInput = (text, disposition) => {
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

// This event is fired with the user change the input in the omnibox.
browser.omnibox.onInputChanged.addListener(makeSuggestion)

// This event is fired with the user accepts the input in the omnibox.
browser.omnibox.onInputEntered.addListener(acceptInput)
