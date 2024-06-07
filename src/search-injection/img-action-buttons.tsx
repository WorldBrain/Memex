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
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import * as constants from './constants'
import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { blobToDataURL } from 'src/util/blob-utils'

interface RootProps {
    rootEl: HTMLElement
    syncSettingsBG: RemoteSyncSettingsInterface
    syncSettings: SyncSettingsStore<'openAI'>
    annotationsFunctions: any
    browserAPIs: Browser
    contentScriptsBG: ContentScriptsInterface<'caller'>
    imageUrl: string
    imageData: string
}

interface RootState {
    themeVariant?: MemexThemeVariant
}

class Root extends React.Component<RootProps, RootState> {
    parentContainerRef = React.createRef<HTMLDivElement>() // Assuming you have a ref to the parent container

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
                    <ParentContainer ref={this.parentContainerRef}>
                        <PrimaryAction
                            label="Analzye"
                            icon="stars"
                            type="glass"
                            size={'small'}
                            onClick={async (event) => {
                                await this.props.annotationsFunctions.analyseImageAsWithAI(
                                    this.props.imageData,
                                )
                                event.stopPropagation()
                                event.preventDefault()
                            }}
                        />
                        <PrimaryAction
                            label="Save"
                            icon="heartFull"
                            type="glass"
                            size={'small'}
                            onClick={async (event) => {
                                await this.props.annotationsFunctions.saveImageAsNewNote(
                                    this.props.imageData,
                                )
                                event.stopPropagation()
                                event.preventDefault()
                            }}
                        />
                    </ParentContainer>
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export const handleRenderImgActionButtons = async (
    syncSettings: SyncSettingsStore<'openAI'>,
    syncSettingsBG: RemoteSyncSettingsInterface,
    annotationsFunctions: any,
    browserAPIs: Browser,
    imageElements: HTMLCollectionOf<HTMLImageElement>,
    contentScriptsBG: ContentScriptsInterface<'caller'>,
) => {
    if (imageElements.length === 0) {
        return
    }

    const renderComponent = (imageElement, target, index) => {
        const existingButton = document.getElementById(
            constants.REACT_ROOTS.imgActionButtons + '-' + index,
        )

        if (existingButton) {
            existingButton.remove()
        }

        // Create a span to wrap the imageElement
        const wrapperSpan = document.createElement('span')
        wrapperSpan.style.display = 'inline-block' // Ensure the span does not break the flow
        wrapperSpan.style.position = 'relative' // Positioning context for the absolute positioned target

        // Insert the wrapper before the imageElement in the DOM
        imageElement.parentNode.insertBefore(wrapperSpan, imageElement)

        // Move the imageElement inside the wrapperSpan
        wrapperSpan.appendChild(imageElement)

        // Set the ID for the target and append it to the wrapperSpan
        target.setAttribute(
            'id',
            constants.REACT_ROOTS.imgActionButtons + '-' + index,
        )
        wrapperSpan.appendChild(target)
    }

    for (let i = 0; i < imageElements.length; i++) {
        const target = document.createElement('span')
        target.setAttribute(
            'id',
            constants.REACT_ROOTS.imgActionButtons + '-' + i,
        )

        let element = imageElements[i]
        let imageUrl = null

        if (element.src) {
            imageUrl = element.src
        }

        if (imageUrl == null) {
            continue
        }

        let imageData = null

        if (imageUrl.includes('data:image')) {
            imageData = imageUrl
        } else {
            try {
                const imageBlob = await fetch(imageUrl).then((res: any) =>
                    res.blob(),
                )
                imageData = await blobToDataURL(imageBlob)
            } catch (error) {
                continue
            }
        }

        if (imageData == null) {
            continue
        }

        const arrayOfSpecialCases = ['https://www.google.com/search?']

        const currentUrl = window.location.href

        if (arrayOfSpecialCases.some((url) => currentUrl.includes(url))) {
            element = element.parentNode.parentNode.parentNode
            if (element.getAttribute('jsaction')) {
                element.setAttribute('jsaction', null)
            }
        }

        renderComponent(element, target, i)

        let renderTimeout

        element.onmouseenter = () => {
            renderTimeout = setTimeout(() => {
                ReactDOM.render(
                    <RootPosContainer>
                        <Root
                            rootEl={target}
                            syncSettings={syncSettings}
                            annotationsFunctions={annotationsFunctions}
                            browserAPIs={browserAPIs}
                            syncSettingsBG={syncSettingsBG}
                            contentScriptsBG={contentScriptsBG}
                            imageUrl={imageUrl}
                            imageData={imageData}
                        />
                    </RootPosContainer>,
                    target,
                )
            }, 500) // Delay of 500 milliseconds
        }

        element.onmouseleave = (event) => {
            clearTimeout(renderTimeout) // Cancel the scheduled rendering
            // Check if the related target is a descendant of the main target
            if (!target.contains(event.relatedTarget as Node)) {
                ReactDOM.unmountComponentAtNode(target)
            }
        }
    }
}

const RootPosContainer = styled.div`
    position: absolute;
    top: 5px;
    padding: 5px;
    right: 5px;
`

const ParentContainer = styled.div<{}>`
    overflow: hidden;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    grid-gap: 3px;
    padding: 2px;
    &::-webkit-scrollbar {
        display: none;
    }
`
