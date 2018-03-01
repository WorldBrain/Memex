import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import * as constants from './constants'
import { doSearch } from './actions'
import { remoteFunction } from 'src/util/webextensionRPC'

const fetchSearchInjection = remoteFunction('fetchSearchInjection')

// Render Memex search results to the Google Search Page
const getCmdMessageHandler = ({ cmd, ...payload }) => {
    console.log('Payload Recieved!', payload)
    switch (cmd) {
        case constants.CMDS.RESULTS:
            handleRender(payload)
            break
        case constants.CMDS.ERROR:
            return payload
        default:
            console.error(
                `Background script sent unknown command '${cmd}' with payload:\n${payload}`,
            )
    }
}

// Match URLs
async function matchUrl({ url = location.href }) {
    if (url.match(constants.GOOGLE_SEARCH_INJECTOR.url)) {
        const queryParam = extractQueryParam(url)
        handleSearch(queryParam)
    }
}

// Handle search function
const handleSearch = queryParam => {
    doSearch(queryParam, getCmdMessageHandler)
}

// Handle Render function
const handleRender = results => {
    renderSearchResults(document, results)
}

// Render SEarch results
async function renderSearchResults(doc = document, value) {
    const viewport = doc.getElementById('before-appbar')
    const app = doc.createElement('div')
    app.id = 'searchResults'
    if (viewport) viewport.append(app)
    ReactDOM.render(<App {...value} openOverview={openOverviewPage} />, app)
}

// Check if the feature is enabled
async function injectSearchResultWrapper() {
    const inject = await fetchSearchInjection()
    if (inject) matchUrl(location)
}

// returns query Param from the url
const extractQueryParam = url => {
    const searchUrl = new URL(url)
    return searchUrl.searchParams.get('q')
}

// send message to bg script to open a new overview tab with requested query param
async function openOverviewPage({ url = location.href }) {
    const queryParams = extractQueryParam(url)
    const message = {
        action: 'openOverviewPagewithParams',
        queryParams,
    }
    await browser.runtime.sendMessage(message)
}

// Render after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // matchUrl(location)
    injectSearchResultWrapper()
})
