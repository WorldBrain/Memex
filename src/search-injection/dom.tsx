/*
DOM manipulation helper functions
*/
import { browser } from 'webextension-polyfill-ts'
import React from 'react'
import ReactDOM from 'react-dom'

import Container from './components/container'
import * as utils from './utils'
import * as constants from './constants'
import { injectCSS } from '../util/content-injection'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'


export const handleRender = async (
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
        if (component) {
            component.parentNode.removeChild(component)
        }

        const target = document.createElement('div')
        target.setAttribute('id', 'memexResults')
        container.insertBefore(target, container.firstChild)

        // Number of results to limit
        const limit = constants.LIMIT[position]

        // Render the React component on the target element
        // Passing this same function so that it can change position

        ReactDOM.render(
            <Container
                results={docs.slice(1, limit)}
                len={totalCount}
                rerender={renderComponent}
                searchEngine={searchEngine}
                requiresMigration={requiresMigration}
            />,
            target,
        )
    }


    const renderLoading = async () => {
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
            if (component) {
                component.parentNode.removeChild(component)
            }

            const target = document.createElement('div')
            target.setAttribute('id', 'memexResults')
            container.insertBefore(target, container.firstChild)

            // Number of results to limit
            const limit = constants.LIMIT[position]

            // Render the React component on the target element
            // Passing this same function so that it can change position
            ReactDOM.render(<div><LoadingIndicator/></div>,target,)
    }

    const cssFile = browser.extension.getURL(
        '/content_script_search_injection.css',
    )
    await injectCSS(cssFile)

    // if (!(document.readyState === 'complete'  ||
    //     document.readyState === 'interactive')) {
    //     renderLoading()
    // }
    // Check if the document has completed loading,
    // if it has, execute the rendering function immediately
    // else attach it to the DOMContentLoaded event listener
    renderComponent()
    if (
        !(document.readyState === 'complete'  ||
        document.readyState === 'interactive' ||
        document.readyState === 'loading')
    ) {
        document.addEventListener('DOMContentLoaded', renderComponent, true)
    }
}
