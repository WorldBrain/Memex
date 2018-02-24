import React from 'react'
import ReactDOM from 'react-dom'

import Results from './components/Results'
import * as constants from './constants'

import { SEARCH_CONN_NAME, CMDS } from '../overview/constants'

const handleRender = (id, results) => {
    // The actual function to render the results on screen.
    const renderComponent = () => {
        // Gets the container using the passed id
        // Container is where all the search engine's results
        // are displayed
        const container = document.getElementById(id)

        // Create a new div and append it as the first child
        // of the container
        const target = document.createElement('div')
        target.setAttribute('id', 'memexResults')
        container.insertBefore(target, container.firstChild)

        // Render our React component on the target element
        ReactDOM.render(<Results results={results} />, target)
    }

    // Check if the document has loaded,
    // if it has, execute the rendering function immediately
    // else attach it to the DOMContentLoaded event listener
    if (
        document.readyState === 'interactive' ||
        document.readyState === 'complete'
    )
        renderComponent()
    else document.addEventListener('DOMContentLoaded', renderComponent, true)
}

const cmdHandler = ({ cmd, ...payload }) => {
    switch (cmd) {
        case CMDS.RESULTS:
            console.log(payload)
            // Render only if there is atleast one result
            if (payload.searchResult.docs.length) {
                const containerID = constants.SEARCH_ENGINES.google.container
                // Pass the container id and the search docs
                handleRender(containerID, payload.searchResult.docs)
            }
            break
        case CMDS.ERROR:
            break
        default:
            console.error(`Unknown command ${cmd} with payload \n${payload}`)
    }
}

const search = query => {
    // Init a connection to the search background
    const port = browser.runtime.connect({ name: SEARCH_CONN_NAME })
    port.onMessage.addListener(cmdHandler)

    const searchParams = {
        limit: constants.LIMIT,
        query,
    }

    port.postMessage({ cmd: CMDS.SEARCH, searchParams })
}

// Get the window's current URL
// Do a regex match of URL against Search Engine's query URLs
// (Google for now)
// And extract the query
const href = window.location.href

const gRegex = constants.SEARCH_ENGINES.google.regex
if (href.match(gRegex) != null) {
    const url = new URL(href)
    const query = url.searchParams.get('q')
    search(query)
}
