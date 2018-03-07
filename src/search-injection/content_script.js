import React from 'react'
import ReactDOM from 'react-dom'

import Results from './components/Results'
import * as constants from './constants'
import { appendCss, getLocalStorage } from './utils'
import { SEARCH_CONN_NAME, CMDS } from '../overview/constants'

const handleRender = (id, results) => {
    // The actual function to render the results on screen.

    const renderComponent = () => {
        // Gets the container using the passed id
        const container = document.getElementById(id)

        const target = document.createElement('div')
        target.setAttribute('id', 'memexResults')
        container.insertBefore(target, container.firstChild)

        // Render our React component on the target element
        ReactDOM.render(
            <Results
                results={results.slice(0, constants.LIMIT)}
                len={results.length}
            />,
            target,
        )

        // Append content_script.css to the document
        const cssFile = browser.extension.getURL('/content_script.css')
        appendCss(cssFile)
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
        query,
    }

    port.postMessage({ cmd: CMDS.SEARCH, searchParams })
}

const init = async () => {
    // The users setting for this feature is stored in this variable
    // If this is false, there is no need to render the results
    const searchInjection = await getLocalStorage(
        constants.SEARCH_INJECTION_KEY,
    )

    // TODO: Generalize this matching process
    const href = window.location.href
    const gRegex = constants.SEARCH_ENGINES.google.regex
    if (href.match(gRegex) != null && searchInjection) {
        const url = new URL(href)
        const query = url.searchParams.get('q')
        search(query)
    }
}

init()
