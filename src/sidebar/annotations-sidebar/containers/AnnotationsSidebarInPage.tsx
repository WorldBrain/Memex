import * as React from 'react'
import styled, { css } from 'styled-components'
import ReactDOM from 'react-dom'

import { theme } from 'src/common-ui/components/design-library/theme'
import type { HighlightInteractionsInterface } from 'src/highlighting/types'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import type {
    SharedInPageUIEvents,
    SidebarActionOptions,
    SharedInPageUIInterface,
} from 'src/in-page-ui/shared-state/types'
import {
    AnnotationsSidebarContainer,
    Props as ContainerProps,
} from './AnnotationsSidebarContainer'
import type {
    AnnotationCardInstanceLocation,
    AnnotationsSidebarInPageEventEmitter,
} from '../types'
import ShareAnnotationOnboardingModal from 'src/overview/sharing/components/ShareAnnotationOnboardingModal'
import LoginModal from 'src/overview/sharing/components/LoginModal'
import DisplayNameModal from 'src/overview/sharing/components/DisplayNameModal'
import type { SidebarContainerLogic } from './logic'
import type { UnifiedAnnotation } from 'src/annotations/cache/types'
import { ANNOT_BOX_ID_PREFIX } from '../constants'
import browser from 'webextension-polyfill'

export interface Props extends ContainerProps {
    events: AnnotationsSidebarInPageEventEmitter
    inPageUI: SharedInPageUIInterface
    highlighter: HighlightInteractionsInterface
}

export class AnnotationsSidebarInPage extends AnnotationsSidebarContainer<
    Props
> {
    static defaultProps: Pick<
        Props,
        'isLockable' | 'theme' | 'sidebarContext' | 'runtimeAPI' | 'storageAPI'
    > = {
        runtimeAPI: browser.runtime,
        storageAPI: browser.storage,
        sidebarContext: 'in-page',
        isLockable: true,
        theme: {
            ...theme,
            rightOffsetPx: 0,
            canClickAnnotations: true,
            paddingRight: 0,
        },
    }

    popoutOpen = false
    // rootNode?: ShadowRoot | Document

    constructor(props: Props) {
        super({
            ...props,
            showAnnotationShareModal: () =>
                this.processEvent('setAnnotationShareModalShown', {
                    shown: true,
                }),
        })
    }

    async componentDidMount() {
        super.componentDidMount()
        document.addEventListener('keydown', this.listenToEsc)
        document.addEventListener('mousedown', this.listenToOutsideClick)
        this.setupEventForwarding()

        if (
            this.props.fullPageUrl.startsWith(
                'https://www.readcube.com/library/',
            )
        ) {
            document.getElementById('viewer').style.width = 'inherit'
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount()

        document.removeEventListener('keydown', this.listenToEsc)
        document.removeEventListener('mousedown', this.listenToOutsideClick)
        this.cleanupEventForwarding()
    }

    listenToEsc = (event) => {
        if (event.key === 'Escape') {
            this.hideSidebar()
        }
    }

    listenToOutsideClick = async (event) => {
        const sidebarContainer = document.getElementById(
            'memex-sidebar-container',
        )
        const ribbonContainer = document.getElementById(
            'memex-ribbon-container',
        )

        if (sidebarContainer && this.state.showState === 'visible') {
            if (
                event.target.classList.contains('hypothesis-highlight') ||
                this.state.readingView
            ) {
                return
            }

            if (
                !event.composedPath().includes(sidebarContainer) &&
                !event.composedPath().includes(ribbonContainer)
            ) {
                this.hideSidebar()
            }
        }
    }

    async componentDidUpdate(prevProps: Props) {
        const { fullPageUrl } = this.props

        if (fullPageUrl !== prevProps.fullPageUrl) {
            await this.processEvent('setPageUrl', {
                fullPageUrl,
                rerenderHighlights: true,
            })
        }
    }

    private setupEventForwarding() {
        const { inPageUI, highlighter, events: sidebarEvents } = this.props

        inPageUI.events.on('stateChanged', this.handleInPageUIStateChange)
        inPageUI.events.on('sidebarAction', this.handleExternalAction)

        // No longer used, as of the sidebar refactor
        // sidebarEvents.on('removeTemporaryHighlights', () =>
        //     highlighter.removeTempHighlights(),
        // )
        // sidebarEvents.on('removeAnnotationHighlight', ({ url }) =>
        //     highlighter.removeAnnotationHighlight(url),
        // )
        // sidebarEvents.on('removeAnnotationHighlights', ({ urls }) =>
        //     highlighter.removeAnnotationHighlights(urls),
        // )
        sidebarEvents.on('highlightAndScroll', async ({ highlight }) => {
            await highlighter.highlightAndScroll({
                id: highlight.unifiedId,
                selector: highlight.selector,
            })
        })
        sidebarEvents.on('renderHighlight', ({ highlight }) =>
            highlighter.renderHighlight(
                { id: highlight.unifiedId, selector: highlight.selector },
                () =>
                    inPageUI.showSidebar({
                        annotationCacheId: highlight.unifiedId,
                        action: 'show_annotation',
                    }),
            ),
        )
        sidebarEvents.on('renderHighlights', async ({ highlights }) => {
            await highlighter.renderHighlights(
                highlights.map((h) => ({
                    id: h.unifiedId,
                    selector: h.selector,
                })),
                ({ annotationId }) =>
                    inPageUI.showSidebar({
                        annotationCacheId: annotationId.toString(),
                        action: 'show_annotation',
                    }),
                { removeExisting: true },
            )
        })
        sidebarEvents.on('setSelectedList', async (selectedList) => {
            inPageUI.selectedList = selectedList
        })
    }

    cleanupEventForwarding = () => {
        this.props.inPageUI.events.removeAllListeners('stateChanged')
        this.props.inPageUI.events.removeAllListeners('sidebarAction')

        for (const event of this.props.events?.eventNames?.() ?? []) {
            this.props.events.removeAllListeners(event as any)
        }
    }

    private getDocument(): Document | undefined {
        // TODO: This doesn't work. fix it
        const containerNode = ReactDOM.findDOMNode(this)

        return containerNode?.getRootNode() as Document
    }

    private async activateAnnotation(
        unifiedAnnotationId: UnifiedAnnotation['unifiedId'],
        annotationMode: 'edit' | 'edit_spaces' | 'show',
    ) {
        await this.processEvent('setActiveAnnotation', {
            unifiedAnnotationId,
            mode: annotationMode,
        })
        const annotationBoxNode = this.getDocument()?.getElementById(
            ANNOT_BOX_ID_PREFIX + unifiedAnnotationId,
        )

        if (!annotationBoxNode) {
            return
        }

        annotationBoxNode.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
        })
    }

    private handleExternalAction = async (event: SidebarActionOptions) => {
        await (this.logic as SidebarContainerLogic).annotationsLoadComplete

        if (event.action === 'comment') {
            await this.processEvent('setNewPageNoteText', {
                comment: event.annotationData?.commentText ?? '',
            })
        } else if (event.action === 'selected_list_mode_from_web_ui') {
            await this.processEvent('setIsolatedViewOnSidebarLoad', null)
            await browser.storage.local.set({
                '@Sidebar-reading_view': true,
            })
            await this.processEvent('setSelectedListFromWebUI', {
                sharedListId: event.sharedListId,
            })
        } else if (event.action === 'show_annotation') {
            await this.activateAnnotation(event.annotationCacheId, 'show')
        } else if (event.action === 'edit_annotation') {
            await this.activateAnnotation(event.annotationCacheId, 'edit')
        } else if (event.action === 'edit_annotation_spaces') {
            await this.activateAnnotation(
                event.annotationCacheId,
                'edit_spaces',
            )
        } else if (event.action === 'set_sharing_access') {
            await this.processEvent('receiveSharingAccessChange', {
                sharingAccess: event.annotationSharingAccess,
            })
        } else if (event.action === 'show_shared_spaces') {
            await this.processEvent('setActiveSidebarTab', { tab: 'spaces' })
        } else if (event.action === 'show_my_annotations') {
            await this.processEvent('setActiveSidebarTab', {
                tab: 'annotations',
            })
        } else if (event.action === 'show_page_summary') {
            await this.processEvent('setActiveSidebarTab', {
                tab: 'summary',
                textToProcess: event.highlightedText,
            })
        } else if (event.action === 'check_sidebar_status') {
            return true
        }

        this.forceUpdate()
    }

    private handleInPageUIStateChange: SharedInPageUIEvents['stateChanged'] = ({
        changes,
    }) => {
        if ('sidebar' in changes) {
            if (changes.sidebar) {
                this.showSidebar()
            } else {
                this.hideSidebar()
            }
        }
    }

    hideSidebar() {
        super.hideSidebar()
        this.props.inPageUI.hideRibbon()
        this.props.inPageUI.hideSidebar()
    }

    protected getCreateProps() {
        const props = super.getCreateProps()

        return {
            ...props,
            onCancel: () => {
                props.onCancel()
                this.props.highlighter.removeTempHighlights()
            },
        }
    }

    protected bindAnnotationFooterEventProps(
        annotation: Pick<UnifiedAnnotation, 'unifiedId' | 'body'>,
        instanceLocation: AnnotationCardInstanceLocation,
    ) {
        const boundProps = super.bindAnnotationFooterEventProps(
            annotation,
            instanceLocation,
        )
        return {
            ...boundProps,
            onDeleteConfirm: (e) => {
                boundProps.onDeleteConfirm(e)
                this.props.highlighter.removeAnnotationHighlight({
                    id: annotation.unifiedId,
                })
            },
        }
    }

    protected renderModals() {
        return (
            <>
                {super.renderModals()}
                {this.state.showLoginModal && (
                    <LoginModal
                        routeToLoginBtn
                        ignoreReactPortal
                        contentSharingBG={this.props.contentSharingBG}
                        contentScriptBG={this.props.contentScriptsBG}
                        onClose={() =>
                            this.processEvent('setLoginModalShown', {
                                shown: false,
                            })
                        }
                    />
                )}
                {this.state.showDisplayNameSetupModal && (
                    <DisplayNameModal
                        ignoreReactPortal
                        authBG={this.props.authBG}
                        onClose={() =>
                            this.processEvent('setDisplayNameSetupModalShown', {
                                shown: false,
                            })
                        }
                    />
                )}
                {this.state.showAnnotationsShareModal && (
                    <ShareAnnotationOnboardingModal
                        ignoreReactPortal
                        onClose={() =>
                            this.processEvent('setAnnotationShareModalShown', {
                                shown: false,
                            })
                        }
                        onClickLetUsKnow={() => {
                            window.open(
                                'https://worldbrain.io/feedback/betafeatures',
                            )
                        }}
                        onClickViewRoadmap={() => {
                            window.open('https://worldbrain.io/roadmap')
                        }}
                        onClickSharingTutorial={() => {
                            window.open(
                                'https://worldbrain.io/tutorials/memex-social',
                            )
                        }}
                    />
                )}
            </>
        )
    }

    private renderSelectedListPill() {
        if (this.state.pillVisibility === 'hide') {
            return null
        }
        return (
            <IsolatedViewPill
                onClick={async () =>
                    Promise.all([
                        this.processEvent('setPillVisibility', {
                            value: 'unhover',
                        }),
                        this.props.inPageUI.showSidebar(),
                    ])
                }
                onMouseOver={() =>
                    this.processEvent('setPillVisibility', {
                        value: 'hover',
                    })
                }
                onMouseLeave={() =>
                    this.processEvent('setPillVisibility', {
                        value: 'unhover',
                    })
                }
                pillVisibility={this.state.pillVisibility}
            >
                <IconContainer pillVisibility={this.state.pillVisibility}>
                    <Icon
                        filePath="highlight"
                        heightAndWidth="20px"
                        hoverOff
                        color="prime1"
                    />
                </IconContainer>
                <IsolatedPillContent>
                    <TogglePillHoverSmallText
                        pillVisibility={this.state.pillVisibility}
                    >
                        All annotations added to Space
                    </TogglePillHoverSmallText>
                    <TogglePillMainText>
                        {
                            this.props.annotationsCache.lists.byId[
                                this.state.selectedListId
                            ].name
                        }
                    </TogglePillMainText>
                </IsolatedPillContent>
                <CloseContainer pillVisibility={this.state.pillVisibility}>
                    <CloseBox>
                        <TooltipBox
                            tooltipText={'Exit focus mode for this Space'}
                            placement={'left-start'}
                        >
                            <Icon
                                filePath="removeX"
                                heightAndWidth="22px"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    this.processEvent('setPillVisibility', {
                                        value: 'hide',
                                    })
                                    this.processEvent('setSelectedList', {
                                        unifiedListId: null,
                                    })
                                }}
                            />
                        </TooltipBox>
                    </CloseBox>
                </CloseContainer>
            </IsolatedViewPill>
        )
    }

    render() {
        if (
            this.state.selectedListId != null &&
            this.state.showState === 'hidden' &&
            this.state.fullPageUrl != null
        ) {
            return this.renderSelectedListPill()
        }

        return super.render()
    }
}

const IsolatedViewPill = styled.div<{ pillVisibility: string }>`
    display: flex;
    position: relative;
    padding: 10px 20px 10px 15px;
    justify-content: flex-start;
    align-items: flex-end;
    max-height: 26px;
    max-width: 300px;
    min-width: 50px;
    grid-gap: 10px;
    position: fixed;
    z-index: 2147483647;
    width: fit-content;
    bottom: 20px;
    right: 20px;
    cursor: pointer;
    background-color: ${(props) => props.theme.colors.black};
    border-radius: 10px;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};

    ${(props) =>
        props.pillVisibility === 'hover' &&
        css`
            align-items: flex-end;
            max-height: 60px;
            max-width: 400px;
            min-width: 280px;
        `}

    transition: max-width 0.2s ease-in-out, max-height 0.15s ease-in-out;
`

const IconContainer = styled.div<{ pillVisibility: string }>`
    display: flex;
    height: fill-available;
    align-items: flex-start;
    height: 26px;
    transition: height 0.15s ease-in-out;

    ${(props) =>
        props.pillVisibility === 'hover' &&
        css`
            height: 45px;
        `}
`

const CloseBox = styled.div`
    position: relative;
`

const CloseContainer = styled.div<{ pillVisibility: string }>`
    display: flex;
    height: fill-available;
    align-items: flex-start;
    justify-content: flex-end;
    height: 45px;
    width: 50px;
    opacity: 0;
    transition: opacity 0.1s ease-in-out;
    position: absolute;
    top: 10px;
    right: 10px;
    visibility: hidden;

    ${(props) =>
        props.pillVisibility === 'hover' &&
        css`
            opacity: 1;
            visibility: visible;
        `}
`

const IsolatedPillContent = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
`

const TogglePillHoverSmallText = styled.div<{ pillVisibility: string }>`
    font-size: 14px;
    position: absolute;
    font-weight: 300;
    color: ${(props) => props.theme.colors.greyScale5};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    visibility: hidden;
    opacity: 0;
    top: 20px;
    transition: top 0.05s ease-in-out, opacity 0.05s ease-in-out;

    ${(props) =>
        props.pillVisibility === 'hover' &&
        css`
            opacity: 1;
            top: 10px;
            visibility: visible;
        `};
`

const TogglePillMainText = styled.div`
    font-size: 16px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.white};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    padding-bottom: 2px;
`
