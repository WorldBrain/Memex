/* 
DOM manipulation helper functions
*/

import React from 'react'
import ReactDOM from 'react-dom'

import Results from './components/Results'
import * as utils from './utils'
import * as constants from './constants'

export const injectCSS = file => {
    // filename: (string) url of the CSS file
    // injects the css into the webpage

    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = file
    const d = document.body || document.head || document.documentElement
    d.prepend(link)
}

export const handleRender = ({docs, totalCount}) => {
    // docs: (array of objects) returned by the search 
    // totalCount: (int) number of results found
    // Injects CSS into the search page. 
    // Calls renderComponent to render the react component

    const renderComponent = async () => {
        // Accesses docs, totalCount from parent through closure
        // Gets position from settings 
        // Renders React Component on the respective container

        const position = await utils.getLocalStorage(constants.POSITION_KEY, 'above')
        const containerID = constants.SEARCH_ENGINES.google.container[position]
        const container = document.getElementById(containerID)

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
            <Results
                results={docs.slice(0, limit)}
                len={totalCount}
                rerender={renderComponent}
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
    )
        renderComponent()
    else document.addEventListener('DOMContentLoaded', renderComponent, true)
}