import * as React from 'react'
import styled, { css } from 'styled-components'
import ReactDOM from 'react-dom'

import { resolvablePromise } from 'src/util/resolvable'
import { theme } from 'src/common-ui/components/design-library/theme'
import type { HighlightRendererInterface } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/types'
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
import type {
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import { ANNOT_BOX_ID_PREFIX } from '../constants'
import browser from 'webextension-polyfill'
import { sleepPromise } from 'src/util/promises'
import type { ImageSupportInterface } from 'src/image-support/background/types'
import type { RemoteBGScriptInterface } from 'src/background-script/types'
import { PKMSyncBackgroundModule } from 'src/pkm-integrations/background'
import { PkmSyncInterface } from 'src/pkm-integrations/background/types'

export interface Props extends ContainerProps {
    events: AnnotationsSidebarInPageEventEmitter
    inPageUI: SharedInPageUIInterface
    highlighter: HighlightRendererInterface
    imageSupport?: ImageSupportInterface<'caller'>
    bgScriptBG?: RemoteBGScriptInterface
    pkmSyncBG?: PkmSyncInterface
    getRootElement: () => HTMLElement
}

export class AnnotationsSidebarInPage extends AnnotationsSidebarContainer<
    Props
> {
    static defaultProps: Pick<
        Props,
        | 'isLockable'
        | 'sidebarContext'
        | 'runtimeAPI'
        | 'storageAPI'
        | 'bgScriptBG'
    > = {
        runtimeAPI: browser.runtime,
        storageAPI: browser.storage,
        sidebarContext: 'in-page',
        isLockable: true,
    }

    private initLogicPromise = resolvablePromise()

    constructor(props: Props) {
        super({
            ...props,
            theme: {
                ...props.theme,
                rightOffsetPx: 0,
                canClickAnnotations: true,
                paddingRight: 0,
            },
            showAnnotationShareModal: () =>
                this.processEvent('setAnnotationShareModalShown', {
                    shown: true,
                }),
        })
    }

    async componentDidMount() {
        document.addEventListener('keydown', this.listenToEsc)
        document.addEventListener('click', this.listenToOutsideClick)
        this.setupEventForwarding()

        if (
            this.props.fullPageUrl.startsWith(
                'https://www.readcube.com/library/',
            )
        ) {
            document.getElementById('viewer').style.width = 'inherit'
        }

        await super.componentDidMount()
        this.initLogicPromise.resolve()
    }

    async componentWillUnmount() {
        document.removeEventListener('keydown', this.listenToEsc)
        document.removeEventListener('click', this.listenToOutsideClick)
        this.cleanupEventForwarding()
        await super.componentWillUnmount()
    }

    listenToEsc = (event) => {
        if (
            event.key === 'Escape' &&
            !window.location.href.includes('/pdfjs/viewer.html?file')
        ) {
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
                ({ annotationId, openInEdit }) =>
                    inPageUI.showSidebar({
                        annotationCacheId: annotationId.toString(),
                        action: openInEdit
                            ? 'edit_annotation'
                            : 'show_annotation',
                    }),
            ),
        )
        sidebarEvents.on(
            'renderHighlights',
            async ({ highlights, removeExisting }) => {
                await highlighter.renderHighlights(
                    highlights.map((h) => ({
                        id: h.unifiedId,
                        selector: h.selector,
                        color: h.color,
                    })),
                    ({ annotationId, openInEdit }) =>
                        inPageUI.showSidebar({
                            annotationCacheId: annotationId.toString(),
                            action: openInEdit
                                ? 'edit_annotation'
                                : 'show_annotation',
                        }),
                    { removeExisting: removeExisting },
                )
            },
        )
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
    }

    private handleExternalAction = async (event: SidebarActionOptions) => {
        // instantl load page summaries bc they are not dependent on initlogicpromise

        if (event.action === 'show_page_summary') {
            await this.processEvent('askAIviaInPageInteractions', {
                textToProcess: event.highlightedText,
                prompt: event.prompt,
            })
        } else if (
            event.action === 'create_youtube_timestamp_with_AI_summary'
        ) {
            await this.processEvent('setActiveSidebarTab', {
                tab: 'annotations',
            })

            this.processEvent('createYoutubeTimestampWithAISummary', {
                videoRangeTimestamps: {
                    startTimeSecs: event.videoRangeTimestamps[0],
                    endTimeSecs: event.videoRangeTimestamps[1],
                },
                prompt: event.prompt,
            })
            return true
        } else if (event.action === 'open_chapter_summary') {
            await this.processEvent('setActiveSidebarTab', {
                tab: 'summary',
            })
            await this.processEvent('getVideoChapters', null)
            return true
        } else if (
            event.action === 'create_youtube_timestamp_with_screenshot'
        ) {
            if (this.state.activeTab !== 'annotations') {
                await this.processEvent('setActiveSidebarTab', {
                    tab: 'annotations',
                })
                await sleepPromise(100)
            }

            this.processEvent('createYoutubeTimestampWithScreenshot', {
                imageData: event.imageData,
            })
            return true
        } else if (event.action === 'save_image_as_new_note') {
            if (this.state.activeTab !== 'annotations') {
                await this.processEvent('setActiveSidebarTab', {
                    tab: 'annotations',
                })
                await sleepPromise(100)
            }

            this.processEvent('saveImageAsNewNote', {
                imageData: event.imageData,
            })
            return true
        } else if (event.action === 'youtube_timestamp') {
            if (this.state.activeTab !== 'annotations') {
                await this.processEvent('setActiveSidebarTab', {
                    tab:
                        this.state.selectedListId &&
                        this.state.activeTab === 'spaces'
                            ? 'spaces'
                            : 'annotations',
                })
                await sleepPromise(100)
            }
            this.sidebarRef.current?.addYoutubeTimestampToEditor(
                event.commentText,
            )
            return true
        } else if (event.action === 'rabbit_hole_open') {
            await this.processEvent('setActiveSidebarTab', {
                tab: 'rabbitHole',
            })
            return true
        }

        // Don't handle any external action that depend on cache until init logic has completed
        await Promise.all([
            this.initLogicPromise,
            this.props.inPageUI.cacheLoadPromise,
        ])

        if (event.action === 'comment') {
            await this.processEvent('setActiveSidebarTab', {
                tab:
                    this.state.selectedListId &&
                    this.state.activeTab === 'spaces'
                        ? 'spaces'
                        : 'annotations',
            })
            await this.processEvent('setNewPageNoteText', {
                comment: event.annotationData?.commentText ?? '',
            })
        } else if (event.action === 'selected_list_mode_from_web_ui') {
            await this.processEvent('setSelectedListFromWebUI', {
                sharedListId: event.sharedListId,
                manuallyPullLocalListData: event.manuallyPullLocalListData,
            })
        } else if (event.action === 'show_annotation') {
            await this.activateAnnotation(event.annotationCacheId, 'show')
            await sleepPromise(500)
            if (
                this.state.selectedListId &&
                this.state.activeTab === 'spaces'
            ) {
                await this.processEvent('setActiveSidebarTab', {
                    tab: 'spaces',
                })
            } else if (this.state.activeTab !== 'annotations') {
                await this.processEvent('setActiveSidebarTab', {
                    tab: 'annotations',
                })
            }
        } else if (event.action === 'edit_annotation') {
            await this.processEvent('setAnnotationEditMode', {
                instanceLocation:
                    this.state.selectedListId &&
                    this.state.activeTab === 'spaces'
                        ? this.state.selectedListId
                        : 'annotations-tab',
                unifiedAnnotationId: event.annotationCacheId,
                isEditing: true,
            })
            await this.activateAnnotation(event.annotationCacheId, 'edit')
        } else if (event.action === 'edit_annotation_spaces') {
            await this.processEvent('setActiveSidebarTab', {
                tab:
                    this.state.selectedListId &&
                    this.state.activeTab === 'spaces'
                        ? 'spaces'
                        : 'annotations',
            })
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
                tab: this.state.selectedListId ? 'spaces' : 'annotations',
            })
        } else if (event.action === 'share_page') {
            await this.processEvent('setActiveSidebarTab', { tab: 'spaces' })
            await sleepPromise(500)
            await this.processEvent('openPageLinkShareMenu', null)
        } else if (event.action === 'check_sidebar_status') {
            return true
        } else if (event.action === 'set_focus_mode') {
            const unifiedListId: UnifiedList['unifiedId'] = this.props.annotationsCache.getListByLocalId(
                event.listId,
            ).unifiedId

            this.processEvent('setSelectedList', {
                unifiedListId: unifiedListId,
            })
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

    async hideSidebar() {
        super.hideSidebar()
        this.props.inPageUI.hideRibbon()
        this.props.inPageUI.hideSidebar()
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
                            getPortalRoot={this.props.getRootElement}
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
            this.state.fullPageUrl != null &&
            this.state.activeTab === 'spaces'
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
