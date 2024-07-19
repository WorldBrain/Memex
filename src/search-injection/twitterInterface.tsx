/*
DOM manipulation helper functions
*/
import React from 'react'
import ReactDOM from 'react-dom'
import styled, { StyleSheetManager, ThemeProvider } from 'styled-components'

import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import type { SyncSettingsStoreInterface } from 'src/sync-settings/types'
import type { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import { Browser, runtime } from 'webextension-polyfill'
import YoutubeButtonMenu from './components/youtubeActionBar'
import { sleepPromise } from 'src/util/promises'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { SyncSettingsStore } from 'src/sync-settings/util'
import * as constants from './constants'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import TwitterActionBar from './components/twitterVideoActionBar'
import { ContentScriptsBackground } from 'src/content-scripts/background'
import { ContentScriptsInterface } from 'src/content-scripts/background/types'

interface RootProps {
    rootEl: HTMLElement
    syncSettingsBG: RemoteSyncSettingsInterface
    syncSettings: SyncSettingsStore<'openAI'>
    annotationsFunctions: any
    transcriptFunctions: any
    browserAPIs: Browser
    handleDownloadAudio?: (url: string) => Promise<Float32Array>
    videoComponent: HTMLVideoElement
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
            <StyleSheetManager target={props.rootEl}>
                <ThemeProvider theme={theme({ variant: themeVariant })}>
                    <TwitterActionBar
                        runtime={runtime}
                        annotationsFunctions={props.annotationsFunctions}
                        transcriptFunctions={props.transcriptFunctions}
                        syncSettingsBG={props.syncSettingsBG}
                        syncSettings={props.syncSettings}
                        getRootElement={() => props.rootEl}
                        browserAPIs={props.browserAPIs}
                        removeYoutubeBar={() => props.rootEl.remove()}
                        handleDownloadAudio={props.handleDownloadAudio}
                        videoComponent={props.videoComponent}
                    />
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export const handleRenderTwitterInterface = async (
    syncSettings: SyncSettingsStore<'openAI'>,
    syncSettingsBG: RemoteSyncSettingsInterface,
    annotationsFunctions: any,
    transcriptFunctions: any,
    browserAPIs: Browser,
    handleDownloadAudio?: (url: string) => Promise<Float32Array>,
) => {
    const renderComponent = (video: HTMLVideoElement) => {
        // Iterate over each video element

        // Get the attribute value of "poster"
        const poster = video.getAttribute('poster')

        // Extract the tweet ID from the poster URL
        const tweetIdMatch = poster?.match(
            /(?:ext_tw_video_thumb|amplify_video_thumb)\/(\d+)\//,
        )
        const tweetId = tweetIdMatch ? tweetIdMatch[1] : null

        // Print the tweet ID
        console.log('Tweet ID:', tweetId)

        const existingRootElement = document.getElementById(
            constants.REACT_ROOTS.twitterInterface + '_' + tweetId,
        )

        if (existingRootElement) {
            existingRootElement.remove()
        }

        const target = document.createElement('div')
        target.setAttribute(
            'id',
            constants.REACT_ROOTS.twitterInterface + '_' + tweetId,
        )

        // Find the closest parent element with the attribute "aria-labelledby"
        const parentWithAriaLabelledBy = video.closest('[aria-labelledby]')

        // Append the button as the last child of the parent element
        if (parentWithAriaLabelledBy) {
            parentWithAriaLabelledBy.appendChild(target)
        }

        ReactDOM.render(
            <Root
                rootEl={target}
                syncSettings={syncSettings}
                annotationsFunctions={annotationsFunctions}
                transcriptFunctions={transcriptFunctions}
                browserAPIs={browserAPIs}
                syncSettingsBG={syncSettingsBG}
                handleDownloadAudio={handleDownloadAudio}
                videoComponent={video}
            />,
            target,
        )
    }

    if (
        !(
            document.readyState === 'complete' ||
            document.readyState === 'interactive' ||
            document.readyState === 'loading'
        )
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            () => console.log('loaded'),
            true,
        )
    }

    await sleepPromise(2000)
    const hasAnchored = document.getElementById('MemexButtonContainer')

    const observer = new MutationObserver((mutations) => {
        const checkForVideoNodes = (node: Node) => {
            if (node.nodeName === 'VIDEO') {
                renderComponent(node as HTMLVideoElement)
            }
            node.childNodes.forEach((child) => checkForVideoNodes(child))
        }

        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                checkForVideoNodes(node)
            })
        })
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    })

    if (!hasAnchored) {
        function findAllVideoElements() {
            const videoElements = document.querySelectorAll('video')
            return videoElements
        }

        // Example usage:
        const videos = findAllVideoElements()

        videos.forEach((video) => {
            renderComponent(video)
        })
    }
}

function renderYoutubeMenuButton(panel, annotationsFunctions: any, icon) {
    const menuButton = document.getElementById('memex-youtube-menu-button')

    if (menuButton) {
        menuButton.remove()
    }

    const newEntry = document.createElement('div')
    newEntry.setAttribute('class', 'ytp-menuitem')
    newEntry.id = 'memex-youtube-menu-button'
    newEntry.onclick = () =>
        annotationsFunctions.createAnnotation()(
            false,
            false,
            false,
            getTimestampNoteContentForYoutubeNotes(),
        )
    newEntry.innerHTML = `<div class="ytp-menuitem-icon"><img src=${icon} style="height: 23px; padding-left: 2px; display: flex; width: auto"/></div><div class="ytp-menuitem-label" style="white-space: nowrap, color: white">Add Note to current time</div>`
    const newEntryActionButton = document.createElement('div')
    newEntryActionButton.innerHTML =
        '<div class="ytp-menuitem-content"><div class="ytp-menuitem-toggle-checkbox"></div></div>'
    newEntry.appendChild(newEntryActionButton)

    panel.prepend(newEntry)
}

export async function getTimestampedNoteWithAIsummaryForYoutubeNotes() {
    const [startTimeURL] = getHTML5VideoTimestamp()
    const [endTimeURL] = getHTML5VideoTimestamp()

    const startTimeSecs = parseFloat(
        new URL(startTimeURL).searchParams.get('t'),
    )
    const endTimeSecs = parseFloat(new URL(endTimeURL).searchParams.get('t'))

    return [startTimeSecs, endTimeSecs]
}

export function getTimestampNoteContentForYoutubeNotes(
    includeLastFewSecs?: number,
) {
    let videoTimeStampForComment: string | null

    const [videoURLWithTime, humanTimestamp] = getHTML5VideoTimestamp()

    if (videoURLWithTime != null) {
        videoTimeStampForComment = `[${humanTimestamp}](${videoURLWithTime})`

        return videoTimeStampForComment
    } else {
        return null
    }
}

const ButtonContainer = styled.div`
    display: flex;
    width: 100%;
    grid-gap: 10px;
    justify-content: space-between;
    align-items: center;
`
