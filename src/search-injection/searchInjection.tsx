/*
DOM manipulation helper functions
*/
import browser from 'webextension-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import Container from './components/container'
import * as constants from './constants'
import { injectCSS } from '../util/content-injection'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import type { SyncSettingsStoreInterface } from 'src/sync-settings/types'
import { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'

interface RootProps {
    target: HTMLDivElement
    query: any
    requestSearcher: any
    renderComponent: () => Promise<void>
    searchEngine: any
    syncSettings: SyncSettingsStoreInterface
    position: 'side' | 'above'
    getRootElement: () => HTMLElement
}

interface RootState {
    themeVariant?: MemexThemeVariant
}

class Root extends React.Component<RootProps, RootState> {
    state: RootState = {}

    async componentDidMount() {
        this.setState({
            themeVariant: await loadThemeVariant(),
        })
    }

    render() {
        const { themeVariant } = this.state
        if (!themeVariant) {
            return null
        }
        const { props } = this

        return (
            <StyleSheetManager target={props.target}>
                <ThemeProvider theme={theme({ variant: themeVariant })}>
                    <Container
                        query={props.query}
                        requestSearcher={props.requestSearcher}
                        // results={searchRes.docs.slice(0, limit)}
                        // len={searchRes.totalCount}
                        rerender={props.renderComponent}
                        searchEngine={props.searchEngine}
                        syncSettings={props.syncSettings}
                        position={props.position}
                        getRootElement={this.props.getRootElement}
                    />
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export const handleRenderSearchInjection = async (
    query,
    requestSearcher,
    //{ docs, totalCount },
    searchEngine,
    syncSettings: SyncSettingsStoreInterface,
    getRootElement,
) => {
    // docs: (array of objects) returned by the search
    // totalCount: (int) number of results found
    // Injects CSS into the search page.
    // Calls renderComponent to render the react component

    // const searchRes = await requestSearcher({ query, limit: 21 })

    const renderComponent = async () => {
        // Accesses docs, totalCount from parent through closure
        // Gets position from settings
        // Renders React Component on the respective container
        const position =
            (await syncSettings.searchInjection.get('memexResultsPosition')) ??
            'side'

        const searchEngineObj = constants.SEARCH_ENGINES[searchEngine]
        // if (!searchEngineObj) {
        //     return false
        // }

        const component = document.getElementById('memexResults')
        if (component) {
            component.parentNode.removeChild(component)
        }

        const target = document.createElement('div')
        target.setAttribute('id', 'memexResults')

        const containerType = searchEngineObj.containerType
        const containerIdentifier = searchEngineObj.container[position]

        if (searchEngine === 'google') {
            const searchList = document.getElementById(
                searchEngineObj.container.searchList,
            )
            const suggestionsContainer = document.getElementById(
                searchEngineObj.container.side,
            )
            const featurePreview = document.getElementById(
                searchEngineObj.container.featurePreview,
            )
            const containerWithSuggestions = document.getElementById(
                searchEngineObj.container.sideAlternative,
            )

            if (position === 'side') {
                if (featurePreview && !suggestionsContainer) {
                    searchList.style.display = 'grid'
                    searchList.style.gap = '130px'
                    searchList.style.flexDirection = 'row'
                    searchList.style.gridAutoFlow = 'column'
                    searchList.insertAdjacentElement('beforeend', target)
                } else if (!suggestionsContainer) {
                    containerWithSuggestions.style.display = 'grid'
                    containerWithSuggestions.style.gap = '130px'
                    containerWithSuggestions.style.flexDirection = 'row'
                    containerWithSuggestions.style.gridAutoFlow = 'column'
                    containerWithSuggestions.style.justifyContent =
                        'space-between'

                    containerWithSuggestions.insertAdjacentElement(
                        'beforeend',
                        target,
                    )
                } else {
                    suggestionsContainer.insertBefore(
                        target,
                        suggestionsContainer.firstChild,
                    )
                }
            } else {
                const containerAbove = document.getElementById(
                    searchEngineObj.container.above,
                )
                containerAbove.insertBefore(target, containerAbove.firstChild)
            }
        }

        if (searchEngine === 'brave') {
            const suggestionsContainer = document.getElementById(
                searchEngineObj.container.side,
            )
            const containerWithSuggestions = document.getElementById(
                searchEngineObj.container.sideAlternative,
            )

            if (position === 'side') {
                if (!suggestionsContainer) {
                    containerWithSuggestions.style.display = 'grid'
                    containerWithSuggestions.style.gap = '130px'
                    containerWithSuggestions.style.flexDirection = 'row'
                    containerWithSuggestions.style.gridAutoFlow = 'column'
                    containerWithSuggestions.style.justifyContent =
                        'space-between'

                    containerWithSuggestions.insertAdjacentElement(
                        'beforeend',
                        target,
                    )
                } else {
                    suggestionsContainer.insertBefore(
                        target,
                        suggestionsContainer.firstChild,
                    )
                }
            } else {
                const containerAbove = document.getElementById(
                    searchEngineObj.container.above,
                )
                containerAbove.insertBefore(target, containerAbove.firstChild)
            }
        }

        if (searchEngine === 'bing') {
            const suggestionsContainer = document.getElementById(
                searchEngineObj.container.side,
            )
            const containerWithSuggestions = document.getElementById(
                searchEngineObj.container.sideAlternative,
            )

            if (position === 'side') {
                if (!suggestionsContainer) {
                    containerWithSuggestions.style.display = 'grid'
                    containerWithSuggestions.style.gap = '130px'
                    containerWithSuggestions.style.flexDirection = 'row'
                    containerWithSuggestions.style.gridAutoFlow = 'column'
                    containerWithSuggestions.style.justifyContent =
                        'space-between'

                    containerWithSuggestions.insertAdjacentElement(
                        'beforeend',
                        target,
                    )
                } else {
                    suggestionsContainer.insertBefore(
                        target,
                        suggestionsContainer.firstChild,
                    )
                }
            } else {
                const containerAbove = document.getElementById(
                    searchEngineObj.container.above,
                )
                containerAbove.insertBefore(target, containerAbove.firstChild)
            }
        }

        if (searchEngine === 'duckduckgo') {
            const container = document.getElementsByClassName(
                containerIdentifier,
            )[0]
            container.insertBefore(target, container.firstChild)
        }

        // // If re-rendering remove the already present component
        // const component = document.getElementById('memexResults')
        // if (component) {
        //     component.parentNode.removeChild(component)
        // }

        // const target = document.createElement('div')
        // target.setAttribute('id', 'memexResults')
        // container.insertBefore('beforeend', target)

        // Number of results to limit
        const limit = constants.LIMIT[position]

        // Render the React component on the target element
        // Passing this same function so that it can change position

        ReactDOM.render(
            <Root
                {...{
                    searchEngine,
                    position,
                    query,
                    renderComponent,
                    requestSearcher,
                    syncSettings,
                    target,
                }}
                getRootElement={getRootElement}
            />,
            target,
        )
    }

    const cssFile = browser.runtime.getURL(
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
        !(
            document.readyState === 'complete' ||
            document.readyState === 'interactive' ||
            document.readyState === 'loading'
        )
    ) {
        document.addEventListener('DOMContentLoaded', renderComponent, true)
    }
}
