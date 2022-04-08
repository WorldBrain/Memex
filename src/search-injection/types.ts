export type SearchEngineName = 'google' | 'duckduckgo' | 'brave' | 'bing'
export interface SearchEngineInfo {
    regex: RegExp // Regular Expression to match the url
    container: {
        // Identifier of the containers to append elements
        above: string
        side: string
        sideAlternative?: string
        featurePreview?: string
        searchList?: string
        productPlacement?: string
    }
    containerType: 'id' | 'class'
}

export interface ResultItemProps {
    url: string
    title: string
    displayTime: number
    searchEngine: SearchEngineName
    tags: []
    onLinkClick: React.MouseEventHandler
}
