import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import * as constants from './constants'
import { doSearch } from './actions'
import {
    toggleSearchInjection,
    storeValue,
    fetchSearchInjection,
    fetchData,
} from './utilities/'

// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', function () {
//         console.log('start render');
//         injectSearchResultWrapper()
//     })
// } else {
//     injectSearchResultWrapper();
// }

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
        const query = extractQueryParam(url)
        const queryParams = {
            limit: 4,
            query,
        }
        handleSearch(queryParams)
    }
}

// Handle search function
const handleSearch = queryParam => {
    doSearch(queryParam, getCmdMessageHandler)
}

// Handle Render function
const handleRender = results => {
    async function renderSearchResults(doc = document, value = results) {
        let inject
        let resultLimit

        const { injectionPosition } = await fetchData(
            constants.INJECTION_POSITION_KEY,
        )
        const { showResultState } = await fetchData(constants.SHOW_RESULT_STATE)

        switch (injectionPosition) {
            case constants.OVER_SEARCH_RESULT:
                inject = constants.GOOGLE_SEARCH_INJECTOR.overContainer
                resultLimit = 3
                break
            case constants.ALONGSIDE_SEARCH_RESULT:
                inject = constants.GOOGLE_SEARCH_INJECTOR.alongsideContainer
                resultLimit = 6
                break
            default:
                inject = constants.GOOGLE_SEARCH_INJECTOR.alongsideContainer
                resultLimit = 6
        }
        const viewport = document.getElementById(inject)
        const memexSearchResults = document.getElementById('memexSearchResults')

        if (memexSearchResults) {
            memexSearchResults.parentNode.removeChild(memexSearchResults)
        }

        const app = document.createElement('div')
        app.id = 'memexSearchResults'
        // Append App container div
        if (viewport) {
            viewport.prepend(app)
            // Append css
            renderCss(viewport)
        }

        ReactDOM.render(
            <App
                {...value}
                openOverview={openOverviewPage}
                handleInjectionPosition={handleInjectionPosition}
                injectionPosition={injectionPosition}
                handleHideResults={handleHideResults}
                resultLimit={resultLimit}
                showResultState={showResultState}
                handleMaximizeMinimize={handleMaximizeMinimize}
            />,
            app,
        )
    }
    const cssFile = browser.extension.getURL('/content_script.css')
    renderCss(cssFile)

    // Check if the document has completed loading,
    // if it has, execute the rendering function immediately
    // else attach it to the DOMContentLoaded event listener
    if (
        document.readyState === 'complete' ||
        document.readyState === 'interactive'
    )
        renderSearchResults()
    else
        document.addEventListener('DOMContentLoaded', renderSearchResults, true)
}

async function handleHideResults() {
    const memexSearchResults = document.getElementById('memexSearchResults')
    ReactDOM.unmountComponentAtNode(memexSearchResults)
    return await toggleSearchInjection()
}

async function handleInjectionPosition(position) {
    await storeValue(constants.INJECTION_POSITION_KEY, position)
    injectSearchResultWrapper()
}

// Handling Maximize Minimize of the results
async function handleMaximizeMinimize(resultState) {
    await storeValue(constants.SHOW_RESULT_STATE, resultState)
    // injectSearchResultWrapper()
}

const renderCss = (doc = document) => {
    const link = document.createElement('LINK')
    link.href = browser.extension.getURL('injector.css')
    link.rel = 'stylesheet'
    link.type = 'text/css'
    const d = document.body || document.head || document.documentElement
    d.prepend(link)
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

injectSearchResultWrapper()
