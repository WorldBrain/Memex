import { PowerUpModalVersion } from 'src/authentication/upgrade-modal/types'
import type { ErrorDisplayProps } from './error-display'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import { ContentIdentifier } from 'src/search/types'
import SearchBackground from 'src/search/background'

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
    onLinkClick: React.MouseEventHandler
}

export interface OnDemandInPageUIProps {
    errorDisplayProps?: ErrorDisplayProps
    powerUpModalProps?: {
        limitReachedNotif: PowerUpModalVersion
        authBG: AuthRemoteFunctionsInterface
    }
    embedElements?: HTMLCollectionOf<HTMLEmbedElement>
    imageElements?: HTMLCollectionOf<HTMLImageElement>
    contentScriptsBG?: ContentScriptsInterface<'caller'>
    handleDownloadAudio?: (url: string) => Promise<Float32Array>
}

export type OnDemandInPageUIComponents =
    | 'youtube-integration'
    | 'twitter-integration'
    | 'search-engine-integration'
    | 'dashboard'
    | 'error-display'
    | 'upgrade-modal'
    | 'pdf-open-button'
    | 'img-action-buttons'
