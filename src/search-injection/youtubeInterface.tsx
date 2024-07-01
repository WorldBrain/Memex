/*
DOM manipulation helper functions
*/
import React from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

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

interface RootProps {
    rootEl: HTMLElement
    syncSettingsBG: RemoteSyncSettingsInterface
    syncSettings: SyncSettingsStore<'openAI'>
    annotationsFunctions: any
    transcriptFunctions: any
    browserAPIs: Browser
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
                    <YoutubeButtonMenu
                        runtime={runtime}
                        annotationsFunctions={props.annotationsFunctions}
                        transcriptFunctions={props.transcriptFunctions}
                        syncSettingsBG={props.syncSettingsBG}
                        syncSettings={props.syncSettings}
                        getRootElement={() => props.rootEl}
                        browserAPIs={props.browserAPIs}
                        removeYoutubeBar={() => props.rootEl.remove()}
                    />
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export const handleRenderYoutubeInterface = async (
    syncSettings: SyncSettingsStore<'openAI'>,
    syncSettingsBG: RemoteSyncSettingsInterface,
    annotationsFunctions: any,
    transcriptFunctions: any,
    browserAPIs: Browser,
) => {
    const existingButton = document.getElementById(
        constants.REACT_ROOTS.youtubeInterface,
    )

    if (existingButton) {
        existingButton.remove()
    }
    const target = document.createElement('div')
    target.setAttribute('id', constants.REACT_ROOTS.youtubeInterface)
    const renderComponent = () => {
        const below = document.querySelector('#below')
        const player = document.querySelector('#player')
        const url = new URL(window.location.href)
        const videoPath = url.pathname + '?v=' + url.searchParams.get('v')
        const selector = `#description-inline-expander .yt-core-attributed-string__link[href^="${videoPath}"]`
        const chapterContainer = document.querySelectorAll(selector)
        let hasChapterContainer = chapterContainer.length > 0

        if (below) {
            // injectYoutubeButtonMenu(annotationsFunctions)
            below.insertAdjacentElement('afterbegin', target)
        }
        if (player) {
            injectYoutubeContextMenu(annotationsFunctions)
        }

        if (!below || !player || !hasChapterContainer) {
            // Create a new MutationObserver instance
            const observer = new MutationObserver(function (
                mutationsList,
                observer,
            ) {
                mutationsList.forEach(function (mutation) {
                    mutation.addedNodes.forEach((node) => {
                        // Check if the added node is an HTMLElement
                        if (!player) {
                            if (node instanceof HTMLElement) {
                                // Check if the "player" element is in the added node or its descendants
                                if (node.querySelector('#player')) {
                                    const existingElement = document.getElementById(
                                        'MemexButtonContainer',
                                    )

                                    if (existingElement) {
                                        return
                                    }
                                    const below = document.querySelector(
                                        '#below',
                                    )
                                    const player = document.querySelector(
                                        '#player',
                                    )

                                    injectYoutubeContextMenu(
                                        annotationsFunctions,
                                    )

                                    if (
                                        below &&
                                        player &&
                                        hasChapterContainer
                                    ) {
                                        observer.disconnect()
                                    }
                                }
                            }
                        }
                        if (!below) {
                            if (node instanceof HTMLElement) {
                                // Check if the "below" element is in the added node or its descendants
                                if (node.querySelector('#below')) {
                                    const existingElement = document.getElementById(
                                        'MemexButtonContainer',
                                    )

                                    if (existingElement) {
                                        return
                                    }
                                    const below = document.querySelector(
                                        '#below',
                                    )
                                    const player = document.querySelector(
                                        '#player',
                                    )
                                    below.insertAdjacentElement(
                                        'afterbegin',
                                        target,
                                    )

                                    if (
                                        below &&
                                        player &&
                                        hasChapterContainer
                                    ) {
                                        observer.disconnect()
                                    }
                                }
                            }
                        }
                        if (!hasChapterContainer) {
                            if (node instanceof HTMLElement) {
                                // Check if the "below" element is in the added node or its descendants
                                if (
                                    node.classList.contains(
                                        'yt-core-attributed-string__link',
                                    )
                                ) {
                                    if (
                                        node
                                            .getAttribute('href')
                                            .startsWith(videoPath)
                                    ) {
                                        const selector2 = `#description-inline-expander .yt-core-attributed-string__link[href^="${videoPath}"]`
                                        const chapterTimestamps = document.querySelectorAll(
                                            selector2,
                                        )
                                        const chapterBlocks = []
                                        hasChapterContainer = true
                                        Array.from(chapterTimestamps).forEach(
                                            (block, i) => {
                                                const chapteblock =
                                                    block.parentElement
                                                chapterBlocks.push(chapteblock)
                                            },
                                        )

                                        const firstBlock = chapterBlocks[0]

                                        const buttonIcon = runtime.getURL(
                                            '/img/memex-icon.svg',
                                        )

                                        const newBlock = document.createElement(
                                            'div',
                                        )
                                        newBlock.style.display = 'flex'
                                        newBlock.style.alignItems = 'center'
                                        newBlock.style.marginTop = '10px'
                                        newBlock.style.marginBottom = '10px'
                                        newBlock.style.flexWrap = 'wrap'
                                        newBlock.style.gap = '15px'
                                        newBlock.style.width = 'fit-content'
                                        newBlock.style.height = 'fit-content'
                                        newBlock.style.padding =
                                            '10px 16px 10px 16px'
                                        newBlock.style.borderRadius = '5px'
                                        newBlock.style.backgroundColor =
                                            '#12131B'
                                        newBlock.style.color = '#C6F0D4'
                                        newBlock.style.fontSize = '14px'
                                        newBlock.style.fontFamily = 'Arial'
                                        newBlock.style.cursor = 'pointer'
                                        newBlock.onclick = () => {
                                            annotationsFunctions.openChapterSummary()
                                        }
                                        newBlock.innerHTML = `<img src=${buttonIcon} style="height: 23px; padding-left: 2px; display: flex; grid-gap:5px; width: auto"/> <div style="white-space: nowrap">Summarize Chapters</div>`

                                        firstBlock.insertAdjacentElement(
                                            'beforebegin',
                                            newBlock,
                                        )

                                        if (
                                            below &&
                                            player &&
                                            chapterContainer
                                        ) {
                                            observer.disconnect()
                                        }
                                    }
                                }
                            }
                        }
                    })
                })
            })

            // Start observing mutations to the document body
            observer.observe(document.body, { childList: true, subtree: true })
        }

        ReactDOM.render(
            <Root
                rootEl={target}
                syncSettings={syncSettings}
                annotationsFunctions={annotationsFunctions}
                transcriptFunctions={transcriptFunctions}
                browserAPIs={browserAPIs}
                syncSettingsBG={syncSettingsBG}
            />,
            target,
        )
    }

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

    await sleepPromise(5000)
    const hasAnchored = document.getElementById('MemexButtonContainer')

    if (!hasAnchored) {
        renderComponent()
    }
}

export function injectYoutubeContextMenu(annotationsFunctions: any) {
    const config = { attributes: true, childList: true, subtree: true }
    const icon = runtime.getURL('/img/memex-icon.svg')
    let panel = null

    const contextMenu = document.getElementsByClassName(
        'ytp-popup ytp-contextmenu',
    )
    if (contextMenu.length > 0) {
        panel = contextMenu[0]?.querySelector('.ytp-panel-menu')
    }
    if (panel) {
        renderYoutubeMenuButton(panel, annotationsFunctions, icon)
        return
    }

    const observer = new MutationObserver((mutation) => {
        const targetObject = mutation[0]
        const targetElement = targetObject.target as HTMLElement
        if (targetElement.classList.contains('ytp-contextmenu')) {
            const targetChildren = targetElement.children

            for (let i = 0; i < targetChildren.length; i++) {
                if (targetChildren[i].classList.contains('ytp-panel')) {
                    const potentialPanel = targetChildren[i].querySelector(
                        '.ytp-panel-menu',
                    )
                    if (potentialPanel) {
                        panel = potentialPanel
                        break
                    }
                }
            }
            if (panel == null) {
                return
            }

            renderYoutubeMenuButton(panel, annotationsFunctions, icon)

            // panel.style.height = "320px"
            observer.disconnect()
        }
    })

    observer.observe(document, config)
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
