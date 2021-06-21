export type SearchEngineName = 'google' | 'duckduckgo'
export interface SearchEngineInfo {
    regex: RegExp // Regular Expression to match the url
    container: {
        // Identifier of the containers to append elements
        above: string
        side: string
    }
    containerType: 'id' | 'class'
}

export interface ResultItemProps {
    url: string
    title: string
    displayTime: number
    searchEngine: SearchEngineName
    onLinkClick: React.MouseEventHandler
}
