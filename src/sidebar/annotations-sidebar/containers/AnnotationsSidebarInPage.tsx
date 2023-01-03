import * as React from 'react'
import ReactDOM from 'react-dom'

import { theme } from 'src/common-ui/components/design-library/theme'
import type { HighlightInteractionsInterface } from 'src/highlighting/types'
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
        'isLockable' | 'theme' | 'sidebarContext'
    > = {
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

    componentDidMount() {
        super.componentDidMount()
        document.addEventListener('keydown', this.listenToEsc)
        document.addEventListener('mousedown', this.listenToOutsideClick)
        this.setupEventForwarding()
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
        // sidebarEvents.on('highlightAndScroll', (annotation) => {
        //     // TODO: update sidebar events to used cache annots
        //     // highlighter.highlightAndScroll(annotation.url)
        // })
        // sidebarEvents.on('removeAnnotationHighlight', ({ url }) =>
        //     highlighter.removeAnnotationHighlight(url),
        // )
        // sidebarEvents.on('removeAnnotationHighlights', ({ urls }) =>
        //     highlighter.removeAnnotationHighlights(urls),
        // )
        sidebarEvents.on('renderHighlight', ({ highlight }) =>
            highlighter.renderHighlight(highlight, () => {
                inPageUI.showSidebar({
                    annotationCacheId: highlight.unifiedId,
                    action: 'show_annotation',
                })
            }),
        )
        sidebarEvents.on('renderHighlights', async ({ highlights }) => {
            await highlighter.renderHighlights(
                highlights,
                ({ unifiedAnnotationId }) =>
                    inPageUI.showSidebar({
                        annotationCacheId: unifiedAnnotationId,
                        action: 'show_annotation',
                    }),
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
        } else if (event.action === 'selected_list_mode_from_web_ui') {
            await browser.storage.local.set({
                '@Sidebar-reading_view': true,
            })
            await this.processEvent('setSelectedListFromWebUI', {
                sharedListId: event.sharedListId,
            })
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
                this.props.highlighter.removeAnnotationHighlight(
                    annotation.unifiedId,
                )
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
                        contentSharingBG={this.props.contentSharing}
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
                        authBG={this.props.auth}
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

    // protected renderTopBanner() {
    //     return (
    //         <UpdateNotifBanner
    //             theme={{
    //                 ...theme,
    //                 position: 'fixed',
    //                 width: 'fill-available',
    //                 iconSize: '20px',
    //             }}
    //         />
    //     )
    // }
}
