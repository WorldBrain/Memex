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
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

interface RootProps {
    rootEl: HTMLElement
    syncSettings: SyncSettingsStore<'betaFeatures'>
    annotationsFunctions: any
    browserAPIs: Browser
    contentScriptsBG: ContentScriptsInterface<'caller'>
    imageUrl: string
    imageData: string
    removeElement: () => void
    disableImageInjection: () => void
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
                        <TooltipBox
                            getPortalRoot={() => this.props.rootEl}
                            tooltipText={
                                <span>
                                    Remove for this page session
                                    <br /> <strong>Shift</strong>Click to
                                    disable completely. <br /> Reenable via Beta
                                    Features Settings
                                </span>
                            }
                            placement="bottom"
                        >
                            <PrimaryAction
                                icon="removeX"
                                type="glass"
                                size={'small'}
                                onClick={async (event) => {
                                    event.stopPropagation()
                                    event.preventDefault()

                                    if (event.shiftKey) {
                                        this.props.disableImageInjection()
                                    } else {
                                        this.props.removeElement()
                                    }
                                }}
                                padding={'0 5px'}
                                iconColor={'white'}
                            />
                        </TooltipBox>
                        <TooltipBox
                            getPortalRoot={() => this.props.rootEl}
                            tooltipText="Analyze with AI"
                            placement="bottom"
                        >
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
                                iconColor={'white'}
                                fontColor={'white'}
                            />
                        </TooltipBox>
                        <TooltipBox
                            getPortalRoot={() => this.props.rootEl}
                            tooltipText="Save to Memex"
                            placement="bottom"
                        >
                            <PrimaryAction
                                label="Save"
                                icon="heartEmpty"
                                type="glass"
                                size={'small'}
                                onClick={async (event) => {
                                    await this.props.annotationsFunctions.saveImageAsNewNote(
                                        this.props.imageData,
                                    )
                                    event.stopPropagation()
                                    event.preventDefault()
                                }}
                                iconColor={'white'}
                                fontColor={'white'}
                            />
                        </TooltipBox>
                    </ParentContainer>
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export const handleRenderImgActionButtons = async (
    syncSettings: SyncSettingsStore<'betaFeatures'>,
    annotationsFunctions: any,
    browserAPIs: Browser,
    imageElements: HTMLCollectionOf<HTMLImageElement>,
    contentScriptsBG: ContentScriptsInterface<'caller'>,
) => {
    const betaFeatureSetting = await syncSettings.betaFeatures.get(
        'imageOverlay',
    )
    let imageInjectionEnabled = null
    if (betaFeatureSetting != null) {
        imageInjectionEnabled = betaFeatureSetting
    }

    if (imageInjectionEnabled == null) {
        await syncSettings.betaFeatures.set('imageOverlay', false)
    }

    if (!imageInjectionEnabled) {
        return
    }

    let shouldShow = true
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
        wrapperSpan.style.display = 'flex' // Use flexbox for alignment
        wrapperSpan.style.justifyContent = 'center' // Center content horizontally
        wrapperSpan.style.alignItems = 'center' // Center content vertically
        wrapperSpan.style.width = '100%' // Span takes full width
        wrapperSpan.style.height = '100%' // Span takes full width
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

        if (element.naturalWidth < 100 || element.naturalHeight < 100) {
            continue
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
        renderComponent(element, target, i)

        const arrayOfSpecialCases = ['https://www.google.com/search?']

        const currentUrl = window.location.href

        if (arrayOfSpecialCases.some((url) => currentUrl.includes(url))) {
            element = element.parentNode.parentNode
                .parentNode as HTMLImageElement
            if (element.getAttribute('jsaction')) {
                element.setAttribute('jsaction', null)
            }
        }

        let renderTimeout

        let elementRect, elementTopRightX, elementTopRightY, windowWidth

        if (window.location.href.match(/\.(jpeg|jpg|gif|png|svg)$/) !== null) {
            elementRect = element.getBoundingClientRect()
            elementTopRightX = elementRect.right
            elementTopRightY = elementRect.top
            windowWidth = window.innerWidth
        } else {
            elementTopRightX = 0
            elementTopRightY = 0
            windowWidth = 0
        }

        element.onmouseenter = () => {
            if (shouldShow) {
                renderTimeout = setTimeout(() => {
                    ReactDOM.render(
                        <RootPosContainer
                            top={elementTopRightY}
                            right={windowWidth - elementTopRightX}
                        >
                            <Root
                                rootEl={target}
                                syncSettings={syncSettings}
                                annotationsFunctions={annotationsFunctions}
                                browserAPIs={browserAPIs}
                                contentScriptsBG={contentScriptsBG}
                                imageUrl={imageUrl}
                                imageData={imageData}
                                removeElement={() => {
                                    ReactDOM.unmountComponentAtNode(target)
                                    shouldShow = false
                                }}
                                disableImageInjection={async () => {
                                    ReactDOM.unmountComponentAtNode(target)
                                    await syncSettings.betaFeatures.set(
                                        'imageOverlay',
                                        false,
                                    )
                                    shouldShow = false
                                }}
                            />
                        </RootPosContainer>,
                        target,
                    )
                }, 500) // Delay of 500 milliseconds
            }
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

const RootPosContainer = styled.div<{
    top: number
    right: number
}>`
    position: absolute;
    top: ${(props) => props.top + 5}px;
    right: ${(props) => props.right + 5}px;
    padding: 5px;
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
