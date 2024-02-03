/*
DOM manipulation helper functions
*/
import browser from 'webextension-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'
import debounce from 'lodash/debounce'

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
import { ResultItemProps } from './types'

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
    searchResDocsProcessed?: ResultItemProps[]
    query?: string
}

class Root extends React.Component<RootProps, RootState> {
    state: RootState = {}

    async componentDidMount() {
        const { query } = this.props

        this.executeSearchDebounced(query)
        this.setState({
            themeVariant: await loadThemeVariant(),
            query,
        })
    }

    executeSearch = async (query) => {
        this.setState({ searchResDocsProcessed: null })
        const { requestSearcher } = this.props
        const limit = 100
        requestSearcher({ query, limit })
            .then((searchRes) => {
                this.setState({
                    searchResDocsProcessed: searchRes.docs.slice(0, limit),
                })
            })
            .catch((error) => console.error('Search request failed', error))
    }

    executeSearchDebounced = debounce(this.executeSearch, 150)

    updateQuery = async (query) => {
        this.executeSearchDebounced(query)
        this.setState({ query })
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
                        // len={searchRes.totalCount}
                        rerender={props.renderComponent}
                        searchEngine={props.searchEngine}
                        syncSettings={props.syncSettings}
                        getRootElement={this.props.getRootElement}
                        searchResDocs={this.state.searchResDocsProcessed}
                        updateQuery={this.updateQuery}
                        query={props.query}
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
            component.style.position = 'sticky'
            component.style.top = '100px'
            component.style.zIndex = '30000'
        }
        const sideBox = document.getElementById(searchEngineObj.container.side)

        if (sideBox) {
            sideBox.style.marginLeft = '40px'
        }

        const target = document.createElement('div')
        target.setAttribute('id', 'memexResults')

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

    // if (!(document.readyState === 'complete'  ||
    //     document.readyState === 'interactive')) {
    //     renderLoading()
    // }
    // Check if the document has completed loading,
    // if it has, execute the rendering function immediately
    // else attach it to the DOMContentLoaded event listener

    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes)
                const isTargetNodeAdded = addedNodes.some((node) => {
                    // Define the condition to identify the target item
                    // For example, checking if the added node is the specific element we are looking for
                    // return node.id === 'targetItemId';
                    // Placeholder condition below, replace with actual condition
                    return (
                        node.nodeType === Node.ELEMENT_NODE &&
                        (node as Element).matches(
                            constants.SEARCH_ENGINES[searchEngine].container
                                .sideAlternative,
                        )
                    )
                })

                if (isTargetNodeAdded) {
                    renderComponent()
                    // Optionally, disconnect the observer if it's a one-time observation
                    // observer.disconnect();
                }
            }
        }
    })

    const targetNode = document.getElementById(
        constants.SEARCH_ENGINES[searchEngine].container.sideAlternative,
    )

    if (targetNode) {
        renderComponent()
    } else {
        // Configuration for the observer (which mutations to observe)
        const config = { childList: true, subtree: true }

        // Select the node that will be observed for mutations
        const documentNode = document

        // Start observing the target node for configured mutations
        if (targetNode) {
            observer.observe(documentNode, config)
        } else {
            console.error('Target node for mutation observer not found')
        }
    }
}
