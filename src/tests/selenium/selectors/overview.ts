import { Selector } from './types'

export const appRoot: Selector = () => `#app > div:nth-child(1)`

export const searchBar: Selector = () =>
    `${appRoot()} > div.src-overview-search-bar-components-__navbar--hkn_F`

export const searchResults: Selector = () =>
    `${appRoot()} > div.src-overview-results-components-__main--dzcJi`

export const searchResultsList: Selector = () => `${searchResults()} > ul`

export const pageResult: Selector<{ resultIndex: number }> = ({
    resultIndex,
}) =>
    `${searchResultsList()} > li:nth-child(${resultIndex + 1}) > div > a > div`

export const pageResultTitle: Selector<{ resultIndex: number }> = (props) =>
    `${pageResult(props)} > div > div > div:nth-child(2)`
