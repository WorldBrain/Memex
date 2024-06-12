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
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

interface RootProps {
    rootEl: HTMLElement
    syncSettingsBG: RemoteSyncSettingsInterface
    syncSettings: SyncSettingsStore<'openAI'>
    annotationsFunctions: any
    browserAPIs: Browser
    contentScriptsBG: ContentScriptsInterface<'caller'>
    pdfOriginalUrl: string
    buttonBarHeight: string
    disableImageInjection: () => Promise<void>
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
                    <ParentContainer
                        onClick={async () => {
                            await this.props.contentScriptsBG.openPdfInViewer({
                                fullPageUrl: this.props.pdfOriginalUrl,
                            })
                        }}
                        ref={this.parentContainerRef}
                        buttonBarHeight={props.buttonBarHeight}
                    >
                        <PrimaryAction
                            label="Annotate & Summarize this PDF with Memex"
                            icon="goTo"
                            type="primary"
                            fullWidth
                            height={this.props.buttonBarHeight}
                            size={'large'}
                        />
                        Annotate & Summarize this PDF with Memex
                        <CloseButtonContainer>
                            <Icon
                                onClick={props.disableImageInjection}
                                heightAndWidth={'22px'}
                                icon={'removeX'}
                            />
                        </CloseButtonContainer>
                    </ParentContainer>
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export const handleRenderPDFOpenButton = async (
    syncSettings: SyncSettingsStore<'openAI'>,
    syncSettingsBG: RemoteSyncSettingsInterface,
    annotationsFunctions: any,
    browserAPIs: Browser,
    embedElements: HTMLCollectionOf<HTMLEmbedElement>,
    contentScriptsBG: ContentScriptsInterface<'caller'>,
) => {
    let pdfOriginalUrl = null
    let buttonBarHeight = '40px'

    if (
        window.location.href.includes('https://arxiv.org/pdf/') &&
        !window.location.href.includes('.pdf')
    ) {
        pdfOriginalUrl = window.location.href + '.pdf'
    }
    if (window.location.href.includes('.pdf')) {
        pdfOriginalUrl = window.location.href
    }

    const target = document.createElement('div')

    target.setAttribute('id', constants.REACT_ROOTS.pdfOpenButtons)
    const renderComponent = (embedElement, index) => {
        const existingButton = document.getElementById(
            constants.REACT_ROOTS.pdfOpenButtons + '-' + index,
        )

        if (existingButton) {
            existingButton.remove()
        }

        target.setAttribute(
            'id',
            constants.REACT_ROOTS.pdfOpenButtons + '-' + index,
        )

        embedElement.style.top = buttonBarHeight
        embedElement.style.height = `calc(100% - ${buttonBarHeight})`

        embedElement.parentNode.insertBefore(target, embedElement)
    }

    for (let i = 0; i < embedElements.length; i++) {
        let element = embedElements[i]
        if (element.type === 'application/pdf') {
            renderComponent(element, i)
        }
        if (element.src && element.src.includes('.pdf')) {
            pdfOriginalUrl = element.src
        }

        if (pdfOriginalUrl == null) {
            return
        }

        ReactDOM.render(
            <Root
                rootEl={target}
                syncSettings={syncSettings}
                annotationsFunctions={annotationsFunctions}
                browserAPIs={browserAPIs}
                syncSettingsBG={syncSettingsBG}
                contentScriptsBG={contentScriptsBG}
                pdfOriginalUrl={pdfOriginalUrl}
                buttonBarHeight={buttonBarHeight}
                disableImageInjection={async () => {
                    ReactDOM.unmountComponentAtNode(target)
                }}
            />,
            target,
        )
    }
}

const ParentContainer = styled.div<{
    buttonBarHeight: string
}>`
    width: 100%;
    height: ${(props) => props.buttonBarHeight};
    overflow: hidden;
    &::-webkit-scrollbar {
        display: none;
    }
`

const CloseButtonContainer = styled.div`
    position: absolute;
    right: 10px;
    top: 5px;
    cursor: pointer;
`
