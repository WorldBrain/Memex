import './activity-logger/background'
import { filterVisitsByQuery } from './search'
import niceTime from './util/nice-time'

const makeSuggestion = (query, suggest) => {
    filterVisitsByQuery({query, limit: 5}).then(searchResult => {
        const suggestions = []
        if(searchResult.rows.length === 0) {
            chrome.omnibox.setDefaultSuggestion({description: 'No results found'})
        } else {
            chrome.omnibox.setDefaultSuggestion({description: 'Select an option below'})
        }
        searchResult.rows.map((result) => {
            let doc = result.doc
            let content = doc.url
            let title = ''
            let visitDate = niceTime(doc.visitStart)
            let url = "<url>" + (content.slice(0,30)) + "</url>"
            if(url.length > 30) {
                url+= '...'
            }
            if(doc.page.extractedMetadata && doc.page.extractedMetadata.title) {
                title = "<match>" + escape(doc.page.extractedMetadata.title) + "</match>"
                title = title.replace(/%20|%2C|%3A|%3F|%B7|%23|%26/gi, matched => ' ')
            }
            let description = `${url} ${(visitDate)}  ${title}`
            suggestions.push({
                content,
                description
            })
        })
        suggest(suggestions)
    })
}

const acceptInput = (text, disposition) => {
    switch (disposition) {
    case 'currentTab':
        chrome.tabs.update({url: text})
        break
    case 'newForegroundTab':
        chrome.tabs.create({url: text})
        break
    case 'newBackgroundTab':
        chrome.tabs.create({url: text, active: false})
        break
    }
}

function openOverview() {
    browser.tabs.create({
        url: '/overview/overview.html',
    })
}

// Open the overview when the extension's button is clicked
browser.browserAction.onClicked.addListener(() => {
    openOverview()
})

browser.commands.onCommand.addListener(command => {
    if (command === "openOverview") {
        openOverview()
    }
})

// This event is fired with the user change the input in the omnibox.
chrome.omnibox.onInputChanged.addListener(makeSuggestion)

// This event is fired with the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener(acceptInput)
