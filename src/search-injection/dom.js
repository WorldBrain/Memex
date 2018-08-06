/*
DOM manipulation helper functions
*/

import React from 'react'
import ReactDOM from 'react-dom'

import Container from './components/container'
import * as utils from './utils'
import * as constants from './constants'

/**
 * Injects a CSS stylesheet into the webpage.
 * @param {string} cssUrl URL of the stylesheet to inject
 */
export const injectCSS = cssUrl => {
    // Check if the css file is already present in the webpage
    const node = document.querySelector(`link[href="${cssUrl}"]`)
    if (node) return

    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = cssUrl
    const d = document.body || document.head || document.documentElement
    d.prepend(link)
}

export const handleRender = (
    { docs, totalCount, requiresMigration },
    searchEngine,
) => {
    // docs: (array of objects) returned by the search
    // totalCount: (int) number of results found
    // Injects CSS into the search page.
    // Calls renderComponent to render the react component

    const renderComponent = async () => {
        // Accesses docs, totalCount from parent through closure
        // Gets position from settings
        // Renders React Component on the respective container

        const position = await utils.getLocalStorage(
            constants.POSITION_KEY,
            'side',
        )

        const searchEngineObj = constants.SEARCH_ENGINES[searchEngine]
        if (!searchEngineObj) {
            return false
        }
        const containerType = searchEngineObj.containerType
        const containerIdentifier = searchEngineObj.container[position]
        const container =
            containerType === 'class'
                ? document.getElementsByClassName(containerIdentifier)[0]
                : document.getElementById(containerIdentifier)

        // If re-rendering remove the already present component
        const component = document.getElementById('memexResults')
        if (component) component.parentNode.removeChild(component)

        const target = document.createElement('div')
        target.setAttribute('id', 'memexResults')
        container.insertBefore(target, container.firstChild)

        // Number of results to limit
        const limit = constants.LIMIT[position]

        // Render the React component on the target element
        // Passing this same function so that it can change position
        ReactDOM.render(
            <Container
                results={docs.slice(0, limit)}
                len={totalCount}
                rerender={renderComponent}
                searchEngine={searchEngine}
                requiresMigration={requiresMigration}
            />,
            target,
        )
    }

    const cssFile = browser.extension.getURL('/content_script.css')
    injectCSS(cssFile)

    // Check if the document has completed loading,
    // if it has, execute the rendering function immediately
    // else attach it to the DOMContentLoaded event listener
    if (
        document.readyState === 'complete' ||
        document.readyState === 'interactive'
    ) {
        renderComponent()
    } else document.addEventListener('DOMContentLoaded', renderComponent, true)
}
